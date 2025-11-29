
import { Agent } from '@/pages/Index';
import { useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useSeasonalityAgentSetup = () => {
  const { agents } = useAgents();
  const { toast } = useToast();

  const getSeasonalityAgent = (): Agent | null => {
    // Any analyst class agent can perform seasonality analysis
    return agents.find(agent => agent.class === 'analyst') || null;
  };

  const createSeasonalityConversation = async (agentId: string, title?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create new conversation for this seasonality analysis session
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          title: title || `Seasonality Analysis - ${new Date().toLocaleString()}`
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize context for this conversation
      const initialContext = {
        agentId,
        conversationId: conversation.id,
        currentPhase: 'discovery',
        conversationHistory: [],
        dataContext: null,
        analysisScope: null,
        activeMethod: null,
        planState: {
          currentMethod: null,
          requiredSteps: [],
          executionStatus: 'pending',
          parameters: {},
          intermediateResults: {}
        }
      };

      // Save initial context to database
      await supabase
        .from('agent_performance')
        .insert({
          agent_id: agentId,
          metrics: initialContext,
          performance_score: 100,
          feedback: `New seasonality analysis session started: ${conversation.title}`
        });

      toast({
        title: "New Seasonality Session Created",
        description: `Created new analysis session: ${conversation.title}`,
      });

      return conversation;

    } catch (error) {
      console.error('Failed to create seasonality conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new seasonality session",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getSeasonalityConversations = async (agentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return conversations || [];

    } catch (error) {
      console.error('Failed to get seasonality conversations:', error);
      return [];
    }
  };

  const invokeSeasonalityAgent = async (agentId: string, conversationId?: string) => {
    try {
      if (conversationId) {
        // Load existing conversation context
        const { data: existingContext } = await supabase
          .from('agent_performance')
          .select('*')
          .eq('agent_id', agentId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingContext?.metrics) {
          const metrics = existingContext.metrics as any;
          if (metrics.conversationId === conversationId) {
            return {
              agentId,
              conversationId,
              context: metrics
            };
          }
        }
      }

      // Create new conversation if none specified or not found
      const conversation = await createSeasonalityConversation(agentId);
      
      return {
        agentId,
        conversationId: conversation.id,
        context: {
          agentId,
          conversationId: conversation.id,
          currentPhase: 'discovery',
          conversationHistory: [],
          dataContext: null,
          analysisScope: null,
          activeMethod: null,
          planState: {
            currentMethod: null,
            requiredSteps: [],
            executionStatus: 'pending',
            parameters: {},
            intermediateResults: {}
          }
        }
      };

    } catch (error) {
      console.error('Failed to invoke seasonality agent:', error);
      toast({
        title: "Error",
        description: "Failed to invoke seasonality agent",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    getSeasonalityAgent,
    createSeasonalityConversation,
    getSeasonalityConversations,
    invokeSeasonalityAgent,
    hasSeasonalityAgent: !!getSeasonalityAgent()
  };
};
