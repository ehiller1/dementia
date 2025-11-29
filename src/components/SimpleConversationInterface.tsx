/**
 * Simple Conversation Interface - Minimal UI for Intent → Slots flow
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSimpleConversation } from '../hooks/useSimpleConversation';

export const SimpleConversationInterface: React.FC<{
  conversationId?: string;
  apiBaseUrl?: string;
}> = ({ conversationId = 'default', apiBaseUrl = '/api' }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isProcessing, sendMessage } = useSimpleConversation(conversationId, apiBaseUrl);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}>
                {msg.metadata?.title && <div className="font-bold mb-1">{msg.metadata.title}</div>}
                {msg.metadata?.badges && (
                  <div className="flex gap-1 mb-2">
                    {msg.metadata.badges.map((b, i) => <Badge key={i}>{b.label}</Badge>)}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="p-4 border-t flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your business..."
            disabled={isProcessing}
          />
          <Button onClick={handleSend} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};
