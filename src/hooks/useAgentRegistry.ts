/**
 * Agent Registry Hook
 * 
 * This hook provides functions for managing the agent registry:
 * - Creating, updating, and deleting agent definitions
 * - Discovering agents based on semantic search
 * - Managing agent executions
 */

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  AgentDefinition,
  AgentExecutionRecord,
  DiscoverAgentsRequest,
  DiscoverAgentsResult,
  AgentActivationRequest,
  AgentActivationResponse,
  AgentExecutionStatusRequest,
  AgentExecutionStatusResponse
} from '@/types/agentRegistry';

export const useAgentRegistry = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const agentList = await getAgents();
      setAgents(agentList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new agent definition in the registry
   */
  const createAgent = async (agent: AgentDefinition): Promise<AgentDefinition | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create agent definition compatible with existing schema
      const agentData = {
        name: agent.name,
        class: 'specialist' as const, // Map to existing schema
        skills: agent.capabilities.map(c => c.name),
        specializations: agent.useCases,
        level: 1,
        experience_points: 0,
        equipment: agent.tags,
        user_id: user.id,
        avatar: '/placeholder.svg',
        team: 'default' // Required field
      };

      const { data, error } = await supabase
        .from('agents')
        .insert(agentData)
        .select()
        .single();

      if (error) throw error;

      // Generate embeddings for the agent (similar to how prompts embeddings are generated)
      await generateAgentEmbeddings(
        `${agent.name} ${agent.description} ${agent.useCases.join(' ')}`,
        data.id
      );

      toast({
        title: "Success",
        description: "Agent created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing agent definition
   */
  const updateAgent = async (agent: AgentDefinition): Promise<AgentDefinition | null> => {
    if (!agent.id) {
      toast({
        title: "Error",
        description: "Agent ID is required for update",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update agent with existing schema
      const updateData = {
        name: agent.name,
        skills: agent.capabilities.map(c => c.name),
        specializations: agent.useCases,
        equipment: agent.tags,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agent.id)
        .select()
        .single();

      if (error) throw error;

      // Update embeddings
      await generateAgentEmbeddings(
        `${agent.name} ${agent.description} ${agent.useCases.join(' ')}`,
        agent.id
      );

      toast({
        title: "Success",
        description: "Agent updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete an agent from the registry
   */
  const deleteAgent = async (agentId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all agents in the registry
   */
  const getAgents = async (): Promise<AgentDefinition[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert database records to AgentDefinition format
      const agentDefinitions: AgentDefinition[] = (data || []).map((record: any) => ({
        id: record.id,
        name: record.name,
        description: `${record.class} agent specialized in ${record.specializations?.join(', ') || 'general tasks'}`,
        capabilities: (record.skills || []).map((skill: string) => ({
          name: skill,
          description: `Capability: ${skill}`,
          inputSchema: {},
          outputSchema: {}
        })),
        parameters: [],
        useCases: record.specializations || [],
        tags: record.equipment || [],
        implementation: {
          type: 'builtin' as const,
          entryPoint: record.class,
          config: {}
        },
        created_at: record.created_at,
        updated_at: record.updated_at,
        user_id: record.user_id
      }));
      
      return agentDefinitions;
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agents",
        variant: "destructive"
      });
      return [];
    }
  };

  /**
   * Get a specific agent by ID
   */
  const getAgentById = async (agentId: string): Promise<AgentDefinition | null> => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      
      // Convert to AgentDefinition format
      const agentDefinition: AgentDefinition = {
        id: data.id,
        name: data.name,
        description: `${data.class} agent specialized in ${Array.isArray(data.specializations) ? data.specializations.join(', ') : 'general tasks'}`,
        capabilities: (Array.isArray(data.skills) ? data.skills : []).map((skill: string) => ({
          name: skill,
          description: `Capability: ${skill}`,
          inputSchema: {},
          outputSchema: {}
        })),
        parameters: [],
        useCases: Array.isArray(data.specializations) ? data.specializations : [],
        tags: data.equipment || [],
        implementation: {
          type: 'builtin' as const,
          entryPoint: data.class,
          config: {}
        },
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id
      };
      
      return agentDefinition;
    } catch (error) {
      console.error('Error fetching agent:', error);
      return null;
    }
  };

  /**
   * Generate embeddings for agent definitions
   */
  const generateAgentEmbeddings = async (text: string, agentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call the same function used for prompt embeddings but for agents table
      const response = await supabase.functions.invoke('generate-embeddings', {
        body: { text, table: 'agents', id: agentId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error generating agent embeddings:', error);
      throw error;
    }
  };

  /**
   * Discover agents using semantic search
   */
  const discoverAgents = async (request: DiscoverAgentsRequest): Promise<DiscoverAgentsResult[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call a new edge function for agent discovery
      const response = await supabase.functions.invoke('discover-agents', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data.results || [];
    } catch (error) {
      console.error('Error discovering agents:', error);
      return [];
    }
  };

  /**
   * Create a new agent execution record
   */
  const activateAgent = async (request: AgentActivationRequest): Promise<AgentActivationResponse | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get agent definition to validate parameters
      const agent = await getAgentById(request.agent_id);
      if (!agent) throw new Error('Agent not found');

      // Use agent_performance table for execution tracking
      const { data, error } = await supabase
        .from('agent_performance')
        .insert({
          agent_id: request.agent_id,
          mission_id: request.conversation_id,
          performance_score: 0,
          metrics: {
            status: 'pending',
            input_parameters: request.parameters,
            started_at: new Date().toISOString()
          },
          feedback: 'Execution started'
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger agent execution via edge function
      const response = await supabase.functions.invoke('execute-agent', {
        body: {
          execution_id: data.id,
          agent_id: request.agent_id,
          parameters: request.parameters
        },
        headers: {
          Authorization: `Bearer ${user.id}`
        }
      });

      if (response.error) throw response.error;

      return {
        execution_id: data.id,
        status: 'running',
      };
    } catch (error) {
      console.error('Error activating agent:', error);
      toast({
        title: "Error",
        description: "Failed to activate agent",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get agent execution status
   */
  const getAgentExecutionStatus = async (request: AgentExecutionStatusRequest): Promise<AgentExecutionStatusResponse | null> => {
    try {
      const { data, error } = await supabase
        .from('agent_performance')
        .select('*')
        .eq('id', request.execution_id)
        .single();

      if (error) throw error;
      
      const metrics = data.metrics as any || {};
      return {
        status: metrics.status || 'completed',
        progress: data.performance_score || 100,
        results: metrics.results || {},
        error: metrics.error
      };
    } catch (error) {
      console.error('Error getting agent execution status:', error);
      return null;
    }
  };

  /**
   * Get all executions for an agent
   */
  const getAgentExecutions = async (agentId: string): Promise<AgentExecutionRecord[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_performance')
        .select('*')
        .eq('agent_id', agentId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting agent executions:', error);
      return [];
    }
  };

  // Add missing methods that AgentConsole expects
  const deactivateAgent = async (agentId: string): Promise<boolean> => {
    // For now, just return success - implement actual deactivation logic later
    return true;
  };

  return {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgents,
    getAgentById,
    discoverAgents,
    activateAgent,
    deactivateAgent,
    getAgentExecutionStatus,
    getAgentExecutions,
    isLoading,
    error,
    refreshAgents: loadAgents
  };
};
