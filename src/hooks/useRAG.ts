
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeEntry {
  id?: string;
  title: string;
  content: string;
  team?: string;
  agent_class?: string;
  metadata?: any;
}

interface SemanticSearchResult {
  id: string;
  title?: string;
  name?: string;
  content: string;
  similarity: number;
  source: 'prompt' | 'knowledge_base';
  metadata?: any; // Added to support template metadata from decision_templates
  team?: string;
  agent_class?: string;
}

export const useRAG = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateEmbeddings = async (text: string, table: string, id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('generate-embeddings', {
        body: { text, table, id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      toast({
        title: "Error",
        description: "Failed to generate embeddings",
        variant: "destructive"
      });
      throw error;
    }
  };

  const createKnowledgeEntry = async (entry: KnowledgeEntry) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use a raw SQL insert to avoid type issues
      const { data: newEntry, error } = await supabase
        .from('knowledge_base')
        .insert({
          title: entry.title,
          content: entry.content,
          team: entry.team,
          agent_class: entry.agent_class,
          metadata: entry.metadata || {},
          user_id: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Generate embeddings for the new entry
      await generateEmbeddings(
        `${entry.title} ${entry.content}`,
        'knowledge_base',
        newEntry.id
      );

      toast({
        title: "Success",
        description: "Knowledge entry created successfully",
      });

      return newEntry;
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      toast({
        title: "Error",
        description: "Failed to create knowledge entry",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const searchSemantic = async (
    query: string, 
    agentTeam?: string, 
    agentClass?: string, 
    limit = 5
  ): Promise<SemanticSearchResult[]> => {
    try {
      console.log('🔐 Getting Supabase session for semantic search...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.error('❌ No session found for semantic search');
        throw new Error('Not authenticated');
      }
      
      console.log('✅ Session found, calling semantic-search edge function...');
      console.log('📋 Search parameters:', { query, agentTeam, agentClass, limit });
      
      const response = await supabase.functions.invoke('semantic-search', {
        body: { query, agentTeam, agentClass, limit },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      console.log('📡 Edge function response:', response);

      if (response.error) {
        console.error('❌ Edge function error:', response.error);
        throw response.error;
      }
      
      const results = response.data?.results || [];
      // --- Added detailed logging by result source
      const counts = results.reduce((acc: Record<string, number>, r: any) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('📊 Result breakdown by source:', counts);
      console.log('✅ Semantic search results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error performing semantic search:', error);
      return [];
    }
  };

  const getKnowledgeEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching knowledge entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch knowledge entries",
        variant: "destructive"
      });
      return [];
    }
  };

  const regenerateEmbeddingsForPrompts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all prompts without embeddings
      const { data: prompts } = await supabase
        .from('prompts')
        .select('id, name, content')
        .or('embeddings.is.null,user_id.eq.' + user.id);

      if (!prompts) return;

      for (const prompt of prompts) {
        await generateEmbeddings(
          `${prompt.name} ${prompt.content}`,
          'prompts',
          prompt.id
        );
      }

      toast({
        title: "Success",
        description: `Generated embeddings for ${prompts.length} prompts`,
      });
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate embeddings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createKnowledgeEntry,
    searchSemantic,
    getKnowledgeEntries,
    generateEmbeddings,
    regenerateEmbeddingsForPrompts,
    isLoading
  };
};
