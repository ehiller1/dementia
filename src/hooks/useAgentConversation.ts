
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent' | 'system';
  sender_id: string | null;
  content: string;
  metadata?: any;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export const useAgentConversation = (agentId: string | null, conversationId?: string) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  // Load specific conversation or create new one
  useEffect(() => {
    if (!agentId) return;

    const initConversation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Initializing conversation for agent:', agentId, 'conversation:', conversationId);

        // Verify agent exists
        const { data: agentExists, error: agentError } = await supabase
          .from('agents')
          .select('id, name')
          .eq('id', agentId)
          .single();

        if (agentError || !agentExists) {
          console.error('Agent not found:', agentError);
          toast({
            title: "Agent Error",
            description: "Selected agent not found. Please try selecting another agent.",
            variant: "destructive"
          });
          return;
        }

        let targetConversation: Conversation | null = null;

        if (conversationId) {
          // Load specific conversation
          const { data: specificConversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('agent_id', agentId)
            .eq('user_id', user.id)
            .single();

          targetConversation = specificConversation;
        }

        if (!targetConversation) {
          // Create new conversation
          const { data: newConversation, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              agent_id: agentId,
              title: `New Chat - ${new Date().toLocaleString()}`
            })
            .select()
            .single();

          if (error) throw error;
          targetConversation = newConversation;
          console.log('Created new conversation:', targetConversation.id);
        } else {
          console.log('Using existing conversation:', targetConversation.id);
        }

        setConversation(targetConversation);

        // Load messages for this conversation
        const { data: conversationMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', targetConversation.id)
          .order('created_at', { ascending: true });

        const typedMessages: Message[] = (conversationMessages || []).map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_type: msg.sender_type as 'user' | 'agent' | 'system',
          sender_id: msg.sender_id,
          content: msg.content,
          metadata: msg.metadata,
          created_at: msg.created_at
        }));

        setMessages(typedMessages);

      } catch (error) {
        console.error('Error initializing conversation:', error);
        toast({
          title: "Error",
          description: "Failed to initialize conversation",
          variant: "destructive"
        });
      }
    };

    initConversation();
  }, [agentId, conversationId, toast]);

  // Load all conversations for agent
  const loadConversations = async () => {
    if (!agentId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allConversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setConversations(allConversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [agentId]);

  const createNewConversation = async (title?: string) => {
    if (!agentId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          title: title || `New Chat - ${new Date().toLocaleString()}`
        })
        .select()
        .single();

      if (error) throw error;

      // Clear current messages and set new conversation
      setConversation(newConversation);
      setMessages([]);
      await loadConversations();

      return newConversation;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
      return null;
    }
  };

  const switchToConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: targetConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (!targetConversation) return;

      setConversation(targetConversation);

      // Load messages for this conversation
      const { data: conversationMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      const typedMessages: Message[] = (conversationMessages || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type as 'user' | 'agent' | 'system',
        sender_id: msg.sender_id,
        content: msg.content,
        metadata: msg.metadata,
        created_at: msg.created_at
      }));

      setMessages(typedMessages);
    } catch (error) {
      console.error('Error switching conversation:', error);
    }
  };

  const sendSystemMessage = async (message: string, metadata?: any) => {
    if (!conversation || !agentId) {
      console.error('Missing conversation or agentId for system message:', { conversation: !!conversation, agentId });
      toast({
        title: "Error",
        description: "No active conversation. Please select an agent first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('Sending SYSTEM message:', {
        message: message.substring(0, 50) + '...',
        conversationId: conversation.id
      });

      // Insert system message directly into the database
      const { data: systemMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'system',
          sender_id: null, // System messages don't have a sender
          content: message,
          metadata: metadata || { systemMessage: true }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh messages
      const { data: updatedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      const typedMessages: Message[] = (updatedMessages || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type as 'user' | 'agent' | 'system',
        sender_id: msg.sender_id,
        content: msg.content,
        metadata: msg.metadata,
        created_at: msg.created_at
      }));

      setMessages(typedMessages);
      return systemMessage;

    } catch (error) {
      console.error('Error sending system message:', error);
      toast({
        title: "Error",
        description: "Failed to send system message.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const sendMessage = async (message: string, additionalData?: any) => {
    if (!conversation || !agentId) {
      console.error('Missing conversation or agentId:', { conversation: !!conversation, agentId });
      toast({
        title: "Error",
        description: "No active conversation. Please select an agent first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Sending message:', {
        message: message.substring(0, 50) + '...',
        agentId,
        conversationId: conversation.id
      });

      const response = await supabase.functions.invoke('chat-with-agent', {
        body: {
          message,
          agentId,
          conversationId: conversation.id,
          additionalData: additionalData || {}
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw response.error;
      }

      console.log('Message sent successfully');

      // Refresh messages
      const { data: updatedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      const typedMessages: Message[] = (updatedMessages || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_type: msg.sender_type as 'user' | 'agent' | 'system',
        sender_id: msg.sender_id,
        content: msg.content,
        metadata: msg.metadata,
        created_at: msg.created_at
      }));

      setMessages(typedMessages);
      return response.data;

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conversation,
    messages,
    conversations,
    sendMessage,
    sendSystemMessage,
    createNewConversation,
    switchToConversation,
    loadConversations,
    isLoading
  };
};
