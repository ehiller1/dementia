/**
 * Agent Progress Updates API
 * 
 * This module enables agents to send intermediate progress updates during execution,
 * improving the user experience by providing real-time feedback on agent activities.
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ProgressUpdate {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  percentage?: number; // 0-100 completion percentage
  metadata?: Record<string, any>;
}

/**
 * Send a progress update for an agent execution
 */
export async function sendAgentProgressUpdate(
  executionId: string,
  update: ProgressUpdate
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agent_execution_progress')
      .insert({
        id: uuidv4(),
        execution_id: executionId,
        step: update.step,
        title: update.title,
        description: update.description,
        status: update.status,
        percentage: update.percentage || null,
        metadata: update.metadata || {},
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error sending agent progress update:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error sending agent progress update:', error);
    return false;
  }
}

/**
 * Get all progress updates for an agent execution
 */
export async function getAgentProgressUpdates(
  executionId: string
): Promise<ProgressUpdate[]> {
  try {
    const { data, error } = await supabase
      .from('agent_execution_progress')
      .select('*')
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error getting agent progress updates:', error);
      return [];
    }
    
    return data.map(item => ({
      step: item.step,
      title: item.title,
      description: item.description,
      status: item.status,
      percentage: item.percentage,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Unexpected error getting agent progress updates:', error);
    return [];
  }
}

/**
 * Update the status and progress of an existing update
 */
export async function updateAgentProgress(
  updateId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  percentage?: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('agent_execution_progress')
      .update({
        status,
        percentage: percentage || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', updateId);
    
    if (error) {
      console.error('Error updating agent progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error updating agent progress:', error);
    return false;
  }
}
