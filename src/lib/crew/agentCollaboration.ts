/**
 * Agent Collaboration System
 * 
 * Enables agent collaboration through CrewAI's crew mechanism.
 * Provides tools for agents to communicate, share context, and work together
 * to solve complex tasks that require multiple specialized agents.
 */

import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';
import { CrewManager, Crew, CrewMember } from './crewManager.ts';

// Types for agent collaboration
export interface CollaborationSession {
  id: string;
  name: string;
  description: string;
  crewId: string;
  status: 'active' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  context: Record<string, any>;
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  fromAgentId: string;
  toAgentId?: string; // If undefined, message is broadcast to all agents
  content: string;
  timestamp: string;
  type: 'text' | 'data' | 'command' | 'result';
  metadata?: Record<string, any>;
}

export interface SharedContext {
  sessionId: string;
  data: Record<string, any>;
  lastUpdated: string;
}

export interface CollaborationResult {
  sessionId: string;
  success: boolean;
  output: any;
  error?: string;
  metrics: {
    totalTimeMs: number;
    messageCount: number;
    agentContributions: Record<string, number>; // Agent ID -> contribution count
  };
}

/**
 * Agent Collaboration System for enabling agent teamwork
 */
export class AgentCollaboration {
  private crewManager: CrewManager;
  private sessions: Map<string, CollaborationSession> = new Map();
  private sharedContexts: Map<string, SharedContext> = new Map();
  
  constructor(crewManager: CrewManager) {
    this.crewManager = crewManager;
  }
  
  /**
   * Start a new collaboration session with a crew
   */
  async startCollaboration(
    crewId: string,
    name: string,
    description: string,
    initialContext: Record<string, any> = {}
  ): Promise<CollaborationSession> {
    // Get the crew
    const crew = await this.crewManager.getCrew(crewId);
    if (!crew) {
      throw new Error(`Crew with ID ${crewId} not found`);
    }
    
    // Create the session
    const sessionId = nanoid();
    const session: CollaborationSession = {
      id: sessionId,
      name,
      description,
      crewId,
      status: 'active',
      startedAt: new Date().toISOString(),
      context: initialContext
    };
    
    // Store the session
    this.sessions.set(sessionId, session);
    
    // Initialize shared context
    this.sharedContexts.set(sessionId, {
      sessionId,
      data: initialContext,
      lastUpdated: new Date().toISOString()
    });
    
    // Save to database
    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .insert({
          id: sessionId,
          name,
          description,
          crew_id: crewId,
          status: 'active',
          started_at: session.startedAt,
          context: initialContext
        });
        
      if (error) {
        console.error('Error saving collaboration session to database:', error);
      }
    } catch (err) {
      console.error('Exception saving collaboration session to database:', err);
    }
    
    // Send initial messages to all agents
    await this.broadcastMessage(
      sessionId,
      'system',
      `Collaboration session "${name}" has started. Goal: ${description}`,
      'text',
      { isSystemMessage: true }
    );
    
    return session;
  }
  
  /**
   * Get a collaboration session by ID
   */
  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    // Check local cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    
    // Try to fetch from database
    try {
      const { data, error } = await supabase
        .from('collaboration_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching collaboration session from database:', error);
        return null;
      }
      
      // Convert database format to CollaborationSession object
      const session: CollaborationSession = {
        id: data.id,
        name: data.name,
        description: data.description,
        crewId: data.crew_id,
        status: data.status,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        context: data.context
      };
      
      // Store in local cache
      this.sessions.set(sessionId, session);
      
      return session;
    } catch (err) {
      console.error('Exception fetching collaboration session from database:', err);
      return null;
    }
  }
  
  /**
   * Send a message from one agent to another (or broadcast)
   */
  async sendMessage(
    sessionId: string,
    fromAgentId: string,
    toAgentId: string | undefined,
    content: string,
    type: 'text' | 'data' | 'command' | 'result' = 'text',
    metadata?: Record<string, any>
  ): Promise<CollaborationMessage> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    if (session.status !== 'active') {
      throw new Error(`Session ${sessionId} is not active`);
    }
    
    // Create the message
    const message: CollaborationMessage = {
      id: nanoid(),
      sessionId,
      fromAgentId,
      toAgentId,
      content,
      timestamp: new Date().toISOString(),
      type,
      metadata
    };
    
    // Save to database
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .insert({
          id: message.id,
          session_id: sessionId,
          from_agent_id: fromAgentId,
          to_agent_id: toAgentId,
          content,
          timestamp: message.timestamp,
          type,
          metadata
        });
        
      if (error) {
        console.error('Error saving collaboration message to database:', error);
      }
    } catch (err) {
      console.error('Exception saving collaboration message to database:', err);
    }
    
    // Process the message (e.g., update shared context, trigger agent responses)
    await this.processMessage(message);
    
    return message;
  }
  
  /**
   * Broadcast a message to all agents in the crew
   */
  async broadcastMessage(
    sessionId: string,
    fromAgentId: string,
    content: string,
    type: 'text' | 'data' | 'command' | 'result' = 'text',
    metadata?: Record<string, any>
  ): Promise<CollaborationMessage> {
    return this.sendMessage(sessionId, fromAgentId, undefined, content, type, metadata);
  }
  
  /**
   * Process an incoming message and take appropriate actions
   */
  private async processMessage(message: CollaborationMessage): Promise<void> {
    // Get the session
    const session = await this.getSession(message.sessionId);
    if (!session) {
      console.error(`Session ${message.sessionId} not found`);
      return;
    }
    
    // Get the crew
    const crew = await this.crewManager.getCrew(session.crewId);
    if (!crew) {
      console.error(`Crew ${session.crewId} not found`);
      return;
    }
    
    // Process based on message type
    switch (message.type) {
      case 'command':
        // Handle command messages (e.g., requests for action)
        await this.processCommandMessage(message, session, crew);
        break;
        
      case 'data':
        // Handle data messages (e.g., sharing information)
        await this.processDataMessage(message, session);
        break;
        
      case 'result':
        // Handle result messages (e.g., task completion)
        await this.processResultMessage(message, session);
        break;
        
      case 'text':
      default:
        // For text messages, just notify the recipient(s)
        await this.notifyRecipients(message, crew);
        break;
    }
  }
  
  /**
   * Process a command message
   */
  private async processCommandMessage(
    message: CollaborationMessage,
    session: CollaborationSession,
    crew: Crew
  ): Promise<void> {
    // Parse the command from the message content
    try {
      const command = JSON.parse(message.content);
      
      if (command.action === 'update_context') {
        // Update shared context
        await this.updateSharedContext(
          session.id,
          command.data,
          message.fromAgentId
        );
      } else if (command.action === 'request_help') {
        // Find agents that can help with the specified task
        const helpersNeeded = command.helpersNeeded || 1;
        const taskDescription = command.taskDescription;
        
        // Find suitable helpers based on capabilities
        const helpers = crew.members
          .filter(member => member.agentId !== message.fromAgentId)
          .slice(0, helpersNeeded);
        
        if (helpers.length > 0) {
          // Notify helpers about the help request
          for (const helper of helpers) {
            await this.sendMessage(
              session.id,
              'system',
              helper.agentId,
              JSON.stringify({
                action: 'help_requested',
                requesterId: message.fromAgentId,
                taskDescription,
                context: command.context
              }),
              'command',
              { isHelpRequest: true }
            );
          }
          
          // Notify the requester about assigned helpers
          await this.sendMessage(
            session.id,
            'system',
            message.fromAgentId,
            JSON.stringify({
              action: 'help_assigned',
              helpers: helpers.map(h => ({
                agentId: h.agentId,
                role: h.role
              }))
            }),
            'command',
            { isHelpResponse: true }
          );
        } else {
          // No helpers available
          await this.sendMessage(
            session.id,
            'system',
            message.fromAgentId,
            JSON.stringify({
              action: 'help_unavailable',
              reason: 'No suitable helpers found'
            }),
            'command',
            { isHelpResponse: true }
          );
        }
      }
    } catch (error) {
      console.error('Error processing command message:', error);
      
      // Notify sender of the error
      await this.sendMessage(
        session.id,
        'system',
        message.fromAgentId,
        `Error processing command: ${error.message}`,
        'text',
        { isErrorMessage: true }
      );
    }
  }
  
  /**
   * Process a data message
   */
  private async processDataMessage(
    message: CollaborationMessage,
    session: CollaborationSession
  ): Promise<void> {
    // Parse the data from the message content
    try {
      const data = JSON.parse(message.content);
      
      // Update shared context with the data
      await this.updateSharedContext(
        session.id,
        data,
        message.fromAgentId
      );
    } catch (error) {
      console.error('Error processing data message:', error);
    }
  }
  
  /**
   * Process a result message
   */
  private async processResultMessage(
    message: CollaborationMessage,
    session: CollaborationSession
  ): Promise<void> {
    // Parse the result from the message content
    try {
      const result = JSON.parse(message.content);
      
      // Check if this is a final result that should complete the session
      if (result.isFinalResult) {
        await this.completeSession(session.id, true, result);
      }
      
      // Update shared context with the result
      await this.updateSharedContext(
        session.id,
        { result },
        message.fromAgentId
      );
    } catch (error) {
      console.error('Error processing result message:', error);
    }
  }
  
  /**
   * Notify message recipients
   */
  private async notifyRecipients(
    message: CollaborationMessage,
    crew: Crew
  ): Promise<void> {
    if (message.toAgentId) {
      // Direct message to a specific agent
      // In a real implementation, this would trigger the agent to process the message
      console.log(`Message to agent ${message.toAgentId}: ${message.content}`);
    } else {
      // Broadcast message to all agents
      // In a real implementation, this would trigger all agents to process the message
      console.log(`Broadcast message: ${message.content}`);
    }
  }
  
  /**
   * Update the shared context for a session
   */
  async updateSharedContext(
    sessionId: string,
    data: Record<string, any>,
    updatedBy: string
  ): Promise<SharedContext> {
    // Get current shared context
    let sharedContext = this.sharedContexts.get(sessionId);
    
    if (!sharedContext) {
      // Initialize if not exists
      sharedContext = {
        sessionId,
        data: {},
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update the context
    sharedContext = {
      ...sharedContext,
      data: {
        ...sharedContext.data,
        ...data
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Store updated context
    this.sharedContexts.set(sessionId, sharedContext);
    
    // Save to database
    try {
      const { data: dbData, error } = await supabase
        .from('collaboration_contexts')
        .upsert({
          session_id: sessionId,
          data: sharedContext.data,
          last_updated: sharedContext.lastUpdated,
          updated_by: updatedBy
        });
        
      if (error) {
        console.error('Error saving shared context to database:', error);
      }
    } catch (err) {
      console.error('Exception saving shared context to database:', err);
    }
    
    return sharedContext;
  }
  
  /**
   * Get the shared context for a session
   */
  async getSharedContext(sessionId: string): Promise<SharedContext | null> {
    // Check local cache first
    if (this.sharedContexts.has(sessionId)) {
      return this.sharedContexts.get(sessionId)!;
    }
    
    // Try to fetch from database
    try {
      const { data, error } = await supabase
        .from('collaboration_contexts')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching shared context from database:', error);
        return null;
      }
      
      // Convert database format to SharedContext object
      const sharedContext: SharedContext = {
        sessionId: data.session_id,
        data: data.data,
        lastUpdated: data.last_updated
      };
      
      // Store in local cache
      this.sharedContexts.set(sessionId, sharedContext);
      
      return sharedContext;
    } catch (err) {
      console.error('Exception fetching shared context from database:', err);
      return null;
    }
  }
  
  /**
   * Get messages for a session
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CollaborationMessage[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error('Error fetching session messages from database:', error);
        return [];
      }
      
      return data.map((item: any) => ({
        id: item.id,
        sessionId: item.session_id,
        fromAgentId: item.from_agent_id,
        toAgentId: item.to_agent_id,
        content: item.content,
        timestamp: item.timestamp,
        type: item.type,
        metadata: item.metadata
      }));
    } catch (err) {
      console.error('Exception fetching session messages from database:', err);
      return [];
    }
  }
  
  /**
   * Complete a collaboration session
   */
  async completeSession(
    sessionId: string,
    success: boolean,
    output: any
  ): Promise<CollaborationResult> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Calculate session duration
    const startTime = new Date(session.startedAt).getTime();
    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    
    // Get message count
    const { count: messageCount } = await supabase
      .from('collaboration_messages')
      .select('id', { count: 'exact' })
      .eq('session_id', sessionId);
    
    // Get agent contributions
    const { data: messageData } = await supabase
      .from('collaboration_messages')
      .select('from_agent_id')
      .eq('session_id', sessionId);
    
    const agentContributions: Record<string, number> = {};
    if (messageData) {
      messageData.forEach((msg: any) => {
        const agentId = msg.from_agent_id;
        if (agentId !== 'system') {
          agentContributions[agentId] = (agentContributions[agentId] || 0) + 1;
        }
      });
    }
    
    // Update session status
    session.status = success ? 'completed' : 'failed';
    session.completedAt = new Date().toISOString();
    
    // Update in database
    try {
      const { error } = await supabase
        .from('collaboration_sessions')
        .update({
          status: session.status,
          completed_at: session.completedAt
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error updating session status in database:', error);
      }
    } catch (err) {
      console.error('Exception updating session status in database:', err);
    }
    
    // Create result object
    const result: CollaborationResult = {
      sessionId,
      success,
      output,
      metrics: {
        totalTimeMs,
        messageCount: messageCount || 0,
        agentContributions
      }
    };
    
    // Save result to database
    try {
      const { error } = await supabase
        .from('collaboration_results')
        .insert({
          session_id: sessionId,
          success,
          output,
          metrics: {
            total_time_ms: totalTimeMs,
            message_count: messageCount || 0,
            agent_contributions: agentContributions
          }
        });
        
      if (error) {
        console.error('Error saving collaboration result to database:', error);
      }
    } catch (err) {
      console.error('Exception saving collaboration result to database:', err);
    }
    
    return result;
  }
}

// Export factory function
export function createAgentCollaboration(crewManager: CrewManager): AgentCollaboration {
  return new AgentCollaboration(crewManager);
}

// Export singleton instance
import { crewManager } from './crewManager.ts';
export const agentCollaboration = createAgentCollaboration(crewManager);
