
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client.ts';
import { useToast } from './use-toast.ts';
import { Agent } from '../pages/Index';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agentsData, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedAgents: Agent[] = agentsData.map(agent => ({
        id: agent.id,
        name: agent.name,
        team: agent.team,
        class: agent.class,
        level: agent.level || 1,
        skills: typeof agent.skills === 'object' && agent.skills !== null 
          ? agent.skills as { learning: number; action: number; collaboration: number; analysis: number; }
          : { learning: 50, action: 50, collaboration: 50, analysis: 50 },
        equipment: agent.equipment || [],
        avatar: agent.avatar || '🤖'
      }));

      setAgents(formattedAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (agentData: Omit<Agent, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name: agentData.name,
          team: agentData.team,
          class: agentData.class as 'analyst' | 'strategist' | 'executor' | 'specialist',
          level: agentData.level,
          skills: agentData.skills,
          equipment: agentData.equipment,
          avatar: agentData.avatar
        })
        .select()
        .single();

      if (error) throw error;

      const formattedAgent: Agent = {
        id: newAgent.id,
        name: newAgent.name,
        team: newAgent.team,
        class: newAgent.class,
        level: newAgent.level || 1,
        skills: typeof newAgent.skills === 'object' && newAgent.skills !== null 
          ? newAgent.skills as { learning: number; action: number; collaboration: number; analysis: number; }
          : { learning: 50, action: 50, collaboration: 50, analysis: 50 },
        equipment: newAgent.equipment || [],
        avatar: newAgent.avatar || '🤖'
      };

      setAgents(prev => [...prev, formattedAgent]);
      
      toast({
        title: "Agent Created",
        description: `${agentData.name} has joined your team!`,
      });

      return formattedAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    agents,
    setAgents,
    createAgent,
    isLoading,
    refetch: loadAgents
  };
};
