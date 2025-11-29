/**
 * Implementation Plan Types
 * 
 * These types define the structure for implementation plans generated for ACTION intents.
 */

/**
 * Represents a single step in an implementation plan
 */
export interface ImplementationPlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  order: number;
  estimatedTimeMinutes?: number;
  assignedTo?: string;
  dependencies?: string[]; // IDs of steps that must be completed before this one
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a complete implementation plan
 */
export interface ImplementationPlan {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  steps: ImplementationPlanStep[];
  metadata: {
    intentId?: string;
    decisionId?: string;
    workflowId?: string;
    createdBy?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}
