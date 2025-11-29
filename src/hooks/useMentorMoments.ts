/**
 * Mentor Moments Hook
 * 
 * React hook for managing mentor moments in conversation UI.
 * Listens for mentor.moment.injected events and provides actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { eventBus } from '@/services/events/EventBus';
import { MentorMoment, MentorAction } from '@/services/mentoring/MentorMomentsTypes';

interface UseMentorMomentsOptions {
  conversationId: string;
  enabled?: boolean;
}

export function useMentorMoments({ conversationId, enabled = true }: UseMentorMomentsOptions) {
  const [moments, setMoments] = useState<MentorMoment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    dismissed: 0,
    engaged: 0,
    actioned: 0
  });

  // Listen for new mentor moments
  useEffect(() => {
    if (!enabled) return;

    const subscription = eventBus.subscribe('mentor.moment.injected', (event: any) => {
      if (event.conversationId === conversationId) {
        setMoments(prev => [...prev, event.moment]);
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
        
        console.log('[useMentorMoments] New mentor moment:', event.moment.snippet.title);
      }
    });

    return () => subscription.unsubscribe();
  }, [conversationId, enabled]);

  // Dismiss a moment
  const dismissMoment = useCallback((momentId: string) => {
    setMoments(prev => prev.filter(m => m.id !== momentId));
    setStats(prev => ({ ...prev, dismissed: prev.dismissed + 1 }));

    // Publish user action for analytics
    eventBus.publish('mentor.moment.user_action', {
      conversationId,
      momentId,
      action: 'dismissed'
    });

    console.log('[useMentorMoments] Dismissed moment:', momentId);
  }, [conversationId]);

  // Handle moment action
  const handleAction = useCallback((moment: MentorMoment, action: MentorAction) => {
    setStats(prev => ({ ...prev, engaged: prev.engaged + 1 }));

    // Publish user action for analytics
    eventBus.publish('mentor.moment.user_action', {
      conversationId,
      momentId: moment.id,
      action: 'engaged'
    });

    // Handle different action types
    switch (action.type) {
      case 'open_playbook':
        console.log('[useMentorMoments] Open playbook:', action.payload.playbook_id);
        // TODO: Open playbook modal/sidebar
        break;

      case 'show_template':
        console.log('[useMentorMoments] Show template:', action.payload.template);
        // TODO: Download or display template
        window.open(`/api/templates/${action.payload.template}`, '_blank');
        break;

      case 'pin_to_sidebar':
        console.log('[useMentorMoments] Pin to sidebar:', moment.id);
        // TODO: Pin moment to persistent sidebar
        break;

      case 'spawn_agent':
        setStats(prev => ({ ...prev, actioned: prev.actioned + 1 }));
        
        // Publish user action for analytics
        eventBus.publish('mentor.moment.user_action', {
          conversationId,
          momentId: moment.id,
          action: 'action_taken'
        });

        // Trigger full mentor agent spawning
        spawnFullAgent(
          action.payload.specialist || moment.specialist,
          action.payload.intent || 'general_guidance',
          {
            question: `I need detailed help with ${action.payload.intent}`,
            escalated_from_moment: moment.id,
            original_context: moment.triggeredBy
          }
        );
        break;

      case 'run_assistant':
        console.log('[useMentorMoments] Run assistant:', action.payload);
        // TODO: Trigger assistant workflow
        break;

      default:
        console.warn('[useMentorMoments] Unknown action type:', action.type);
    }
  }, [conversationId]);

  // Spawn full mentoring agent (escalation)
  const spawnFullAgent = useCallback((specialist: string, intent: string, context: any) => {
    console.log(`[useMentorMoments] 🚀 Spawning full ${specialist}`);

    // Publish event to trigger agent spawning via ConversationAgentBridge
    eventBus.publish('mentor.spawn_full_agent', {
      conversationId,
      specialist,
      intent,
      context: {
        ...context,
        userId: 'current_user', // TODO: Get from auth context
        conversation_history: moments.map(m => ({
          moment_id: m.id,
          specialist: m.specialist,
          title: m.snippet.title
        }))
      }
    });
  }, [conversationId, moments]);

  // Clear all moments (e.g., on conversation reset)
  const clearMoments = useCallback(() => {
    setMoments([]);
    console.log('[useMentorMoments] Cleared all moments');
  }, []);

  // Get moments by specialist
  const getMomentsBySpecialist = useCallback((specialist: string) => {
    return moments.filter(m => m.specialist === specialist);
  }, [moments]);

  // Get recent moments (last N)
  const getRecentMoments = useCallback((count: number = 5) => {
    return moments.slice(-count);
  }, [moments]);

  return {
    moments,
    stats,
    dismissMoment,
    handleAction,
    spawnFullAgent,
    clearMoments,
    getMomentsBySpecialist,
    getRecentMoments
  };
}
