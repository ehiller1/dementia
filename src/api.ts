import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createClient } from '@supabase/supabase-js';
import { getMetaPrompt, applyPromptTemplate, parsePromptResponse, generatePromptResponse } from './utils/meta-prompt-utils.ts';
import agentRoutes from './api/routes/agents.ts';

const app = express();

// --- Supabase Admin Client Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in the environment variables.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// --- Express Middleware ---
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // Allow all localhost origins regardless of port
    if(origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Also allow these specific origins
    const allowedOrigins = [
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'http://localhost:8080', 
      'http://localhost:8081', 
      'http://localhost:8084', 
      'http://localhost:5173', 
      'http://localhost:8085',
      'http://localhost:3000'
    ];
    
    if(allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());
app.use((req: any, res: any, next: () => void) => {
  console.log(`[API Server] Received request: ${req.method} ${req.path}`);
  next();
});

// Register agent routes
app.use('/api/agents', agentRoutes);

// --- Live API Endpoints ---

// API route for narratives
app.get('/api/narratives/latest', async (req: any, res: any) => {
  try {
    console.log('[API] Fetching latest narratives from database');
    
    // Check if Supabase client is initialized properly
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return res.status(500).json({ 
        error: 'Database client not initialized',
        details: 'Internal server configuration error'
      });
    }
    
    // Fetch narratives with error handling
    const { data, error } = await supabaseAdmin
      .from('narratives')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error fetching narratives:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        message: error.message,
        details: error.details || 'Error fetching from database'
      });
    }
    
    console.log(`[API] Found ${data?.length || 0} narratives`);
    
    // If we have narratives, process them through the narrative schema
    if (data && data.length > 0) {
      // For each narrative, try to parse it as JSON if it's not already
      const processedNarratives = data.map(narrative => {
        try {
          // If content is already an object, use it
          if (typeof narrative.content === 'object') return narrative;
          
          // Otherwise try to parse the content as JSON (if it was saved as a structured JSON string)
          try {
            const parsedContent = JSON.parse(narrative.content);
            return { ...narrative, parsed_content: parsedContent };
          } catch (parseErr) {
            // If it's not valid JSON, create a structured format from the plain text
            return {
              ...narrative,
              parsed_content: {
                title: narrative.title || 'Untitled Narrative',
                content: narrative.content || 'No content provided',
                type: narrative.type || 'general'
              }
            };
          }
        } catch (err) {
          // If parsing fails, return the original narrative with safe defaults
          console.error('Error processing narrative content:', err);
          return {
            ...narrative,
            parsed_content: {
              title: narrative.title || 'Untitled Narrative',
              content: 'Error parsing narrative content',
              type: narrative.type || 'general'
            }
          };
        }
      });
      
      return res.json({ narratives: processedNarratives || [] });
    } else {
      // Return empty array if no narratives found
      return res.json({ narratives: [] });
    }
  } catch (error) {
    console.error('Unexpected error in narratives endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch narratives',
      message: error.message || 'Unknown server error'
    });
  }
});

// API route for generating a new narrative
app.post('/api/narratives/generate', async (req: any, res: any) => {
  try {
    const { context, query, userId } = req.body;
    
    if (!context || !query) {
      return res.status(400).json({ error: 'Context and query are required' });
    }
    
    console.log('Generating narrative with context:', context);
    
    // Generate narrative using the narrative prompt
    const narrativeResponse = await generatePromptResponse(supabaseAdmin, 'narrative', {
      context,
      query
    });
    
    // Store the generated narrative
    const { data, error } = await supabaseAdmin.from('narratives').insert([
      { 
        content: JSON.stringify(narrativeResponse),
        user_id: userId || null,
        query: query
      }
    ]).select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      narrative: narrativeResponse,
      saved: data?.[0] || null
    });
  } catch (error) {
    console.error('Error generating narrative:', error);
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
});

// API route for decision suggestions
app.get('/api/decisions/suggestions', async (req: any, res: any) => {
  try {
    console.log('[API] Fetching decisions from database');
    
    // Check if Supabase client is initialized properly
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return res.status(500).json({ 
        error: 'Database client not initialized',
        details: 'Internal server configuration error'
      });
    }
    
    // Fetch decisions with error handling
    const { data, error } = await supabaseAdmin
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching decisions:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        message: error.message,
        details: error.details || 'Error fetching from database'
      });
    }
    
    console.log(`[API] Found ${data?.length || 0} decisions`);
    
    // If we have decisions, process them through the action schema
    if (data && data.length > 0) {
      // For each decision, try to parse it as JSON if it's not already
      const processedDecisions = data.map(decision => {
        try {
          // If content is already an object, use it
          if (typeof decision.description === 'object') return decision;
          
          // Otherwise try to parse the description as JSON (if it was saved as a structured JSON string)
          try {
            const parsedDescription = JSON.parse(decision.description);
            return { ...decision, parsed_content: parsedDescription };
          } catch (parseErr) {
            // If it's not valid JSON, create a structured format from the plain text
            return {
              ...decision,
              parsed_content: {
                suggestions: [{
                  title: decision.title || 'Untitled Decision',
                  description: decision.description || 'No description provided',
                  priority: decision.priority || 'medium'
                }],
                context: '',
                reasoning: ''
              }
            };
          }
        } catch (err) {
          // If parsing fails, return the original decision with safe defaults
          console.error('Error processing decision content:', err);
          return {
            ...decision,
            parsed_content: {
              suggestions: [{
                title: decision.title || 'Untitled Decision',
                description: 'Error parsing decision content',
                priority: 'medium'
              }]
            }
          };
        }
      });
      
      return res.json({ suggestions: processedDecisions || [] });
    } else {
      // Return empty array if no decisions found
      return res.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('Unexpected error in decisions endpoint:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch decision suggestions',
      message: error.message || 'Unknown server error'
    });
  }
});

// API route for generating new decision suggestions
app.post('/api/decisions/generate', async (req: any, res: any) => {
  try {
    const { context, query, userId, conversationId } = req.body;
    
    if (!context) {
      return res.status(400).json({ error: 'Context is required' });
    }
    
    console.log('Generating decision suggestions with context:', context);
    
    // Generate suggestions using the action prompt
    const actionResponse = await generatePromptResponse(supabaseAdmin, 'action', {
      context,
      query: query || ''
    });
    
    // Store each suggestion as a separate decision
    if (actionResponse.suggestions && actionResponse.suggestions.length > 0) {
      const decisionsToInsert = actionResponse.suggestions.map((suggestion, index) => ({
        title: suggestion.title || `Suggestion ${index + 1}`,
        description: suggestion.description || '',
        status: 'pending',
        priority: suggestion.priority || 'medium',
        user_id: userId || null,
        conversation_id: conversationId || null,
        context: JSON.stringify(actionResponse)
      }));
      
      const { data, error } = await supabaseAdmin.from('decisions').insert(decisionsToInsert).select();
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        suggestions: actionResponse.suggestions,
        saved: data || []
      });
    } else {
      res.json({ 
        success: true, 
        suggestions: [],
        message: 'No suggestions generated'
      });
    }
  } catch (error) {
    console.error('Error generating decision suggestions:', error);
    res.status(500).json({ error: 'Failed to generate decision suggestions' });
  }
});

// API routes for handling decisions
app.post('/api/decisions/:id/accept', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.from('decisions').delete().match({ id });
    if (error) throw error;
    res.status(200).send({ message: 'Decision accepted' });
  } catch (error) {
    console.error(`Error accepting decision ${id}:`, error);
    res.status(500).json({ error: 'Failed to accept decision' });
  }
});

app.post('/api/decisions/:id/dismiss', async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin.from('decisions').delete().match({ id });
    if (error) throw error;
    res.status(200).send({ message: 'Decision dismissed' });
  } catch (error) {
    console.error(`Error dismissing decision ${id}:`, error);
    res.status(500).json({ error: 'Failed to dismiss decision' });
  }
});

// API route for simulation
app.post('/api/simulator', async (req: any, res: any) => {
  try {
    const { context, action, userId } = req.body;
    
    if (!context || !action) {
      return res.status(400).json({ error: 'Context and action are required' });
    }
    
    console.log('Running simulation for action:', action);
    
    // Generate simulation using the simulator prompt
    const simulationResponse = await generatePromptResponse(supabaseAdmin, 'simulator', {
      context,
      action
    });
    
    // Store the simulation result (optional)
    const { data, error } = await supabaseAdmin.from('simulations').insert([
      { 
        content: JSON.stringify(simulationResponse),
        user_id: userId || null,
        action: action
      }
    ]).select();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      simulation: simulationResponse,
      saved: data?.[0] || null
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: 'Failed to run simulation' });
  }
});

// --- Supabase Proxy ---
// This must be the last route to avoid interfering with other API endpoints.
app.use('/supabase', createProxyMiddleware({
  target: supabaseUrl,
  changeOrigin: true,
  pathRewrite: { '^/supabase': '' },
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('host', new URL(supabaseUrl).host);
    },
  },
}));

export default app;
