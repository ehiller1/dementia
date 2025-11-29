import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MessageSquare, Plus, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationSelectorProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateNew: (title?: string) => void;
  onRefresh: () => void;
}

export const ConversationSelector = ({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onCreateNew,
  onRefresh 
}: ConversationSelectorProps) => {
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await onCreateNew(newConversationTitle.trim() || undefined);
      setNewConversationTitle('');
      onRefresh();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete conversation and all its messages (cascade should handle messages)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been permanently deleted.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
                <DialogDescription>
                  Create a fresh conversation session
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="conversationTitle">Conversation Title (Optional)</Label>
                  <Input
                    id="conversationTitle"
                    placeholder="e.g., Sales Data Analysis"
                    value={newConversationTitle}
                    onChange={(e) => setNewConversationTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
                  />
                </div>
                <Button 
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Start New Conversation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title || 'Untitled Conversation'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {currentConversationId === conversation.id && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {conversations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs">Start your first conversation</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
