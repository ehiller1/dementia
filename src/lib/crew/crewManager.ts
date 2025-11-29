/**
 * CrewAI Integration Manager
 * 
 * Provides integration with CrewAI for task delegation and process management.
 * Enables creating agent crews, defining processes, and managing task execution.
 */

import { Agent } from '@/types/agents';
import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';

// Types for CrewAI integration
export interface CrewMember {
  id: string;
  agentId: string;
  role: string;
  goal: string;
  backstory?: string;
  allowedTools: string[];
  verbose?: boolean;
}

export interface CrewTask {
  id: string;
  description: string;
  expectedOutput: string;
  assignedTo?: string; // Agent ID
  context?: Record<string, any>;
  dependencies?: string[]; // Task IDs
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface CrewProcess {
  id: string;
  name: string;
  description: string;
  tasks: CrewTask[];
  sequential: boolean;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  goal: string;
  members: CrewMember[];
  processes: CrewProcess[];
  verbose: boolean;
  maxIterations?: number;
  memory?: any; // CrewAI memory system
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  output: any;
  success: boolean;
  error?: string;
  executionTimeMs: number;
  metadata?: Record<string, any>;
}

export interface CrewExecutionResult {
  crewId: string;
  processId: string;
  results: TaskResult[];
  success: boolean;
  error?: string;
  executionTimeMs: number;
}

/**
 * CrewAI Manager for handling agent crews and task delegation
 */
export class CrewManager {
  private crews: Map<string, Crew> = new Map();
  
  /**
   * Create a new crew with the specified members and goal
   */
  async createCrew(
    name: string,
    description: string,
    goal: string,
    agents: Agent[],
    verbose: boolean = false
  ): Promise<Crew> {
    const crewId = nanoid();
    
    // Convert agents to crew members
    const members: CrewMember[] = agents.map(agent => ({
      id: nanoid(),
      agentId: agent.id,
      role: agent.role || 'Assistant',
      goal: agent.goal || goal,
      backstory: agent.description,
      allowedTools: agent.tools || [],
      verbose
    }));
    
    // Create the crew
    const crew: Crew = {
      id: crewId,
      name,
      description,
      goal,
      members,
      processes: [],
      verbose,
      maxIterations: 10
    };
    
    // Store the crew
    this.crews.set(crewId, crew);
    
    // Save to database
    try {
      const { data, error } = await supabase
        .from('crews')
        .insert({
          id: crewId,
          name,
          description,
          goal,
          members: members.map(m => ({
            id: m.id,
            agent_id: m.agentId,
            role: m.role,
            goal: m.goal,
            backstory: m.backstory,
            allowed_tools: m.allowedTools
          })),
          verbose,
          max_iterations: 10
        });
        
      if (error) {
        console.error('Error saving crew to database:', error);
      }
    } catch (err) {
      console.error('Exception saving crew to database:', err);
    }
    
    return crew;
  }
  
  /**
   * Get a crew by ID
   */
  async getCrew(crewId: string): Promise<Crew | null> {
    // Check local cache first
    if (this.crews.has(crewId)) {
      return this.crews.get(crewId)!;
    }
    
    // Try to fetch from database
    try {
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .eq('id', crewId)
        .single();
        
      if (error || !data) {
        console.error('Error fetching crew from database:', error);
        return null;
      }
      
      // Convert database format to Crew object
      const crew: Crew = {
        id: data.id,
        name: data.name,
        description: data.description,
        goal: data.goal,
        members: data.members.map((m: any) => ({
          id: m.id,
          agentId: m.agent_id,
          role: m.role,
          goal: m.goal,
          backstory: m.backstory,
          allowedTools: m.allowed_tools,
          verbose: data.verbose
        })),
        processes: data.processes || [],
        verbose: data.verbose,
        maxIterations: data.max_iterations
      };
      
      // Store in local cache
      this.crews.set(crewId, crew);
      
      return crew;
    } catch (err) {
      console.error('Exception fetching crew from database:', err);
      return null;
    }
  }
  
  /**
   * Create a new process for a crew
   */
  async createProcess(
    crewId: string,
    name: string,
    description: string,
    tasks: Omit<CrewTask, 'id' | 'status'>[],
    sequential: boolean = true
  ): Promise<CrewProcess | null> {
    const crew = await this.getCrew(crewId);
    if (!crew) {
      console.error(`Crew with ID ${crewId} not found`);
      return null;
    }
    
    // Create process with tasks
    const processId = nanoid();
    const process: CrewProcess = {
      id: processId,
      name,
      description,
      tasks: tasks.map(task => ({
        ...task,
        id: nanoid(),
        status: 'pending'
      })),
      sequential
    };
    
    // Add process to crew
    crew.processes.push(process);
    
    // Update in database
    try {
      const { data, error } = await supabase
        .from('crews')
        .update({
          processes: crew.processes.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            tasks: p.tasks.map(t => ({
              id: t.id,
              description: t.description,
              expected_output: t.expectedOutput,
              assigned_to: t.assignedTo,
              context: t.context,
              dependencies: t.dependencies,
              status: t.status
            })),
            sequential: p.sequential
          }))
        })
        .eq('id', crewId);
        
      if (error) {
        console.error('Error updating crew processes in database:', error);
      }
    } catch (err) {
      console.error('Exception updating crew processes in database:', err);
    }
    
    return process;
  }
  
  /**
   * Run a process with the specified crew
   */
  async runProcess(
    crewId: string,
    processId: string
  ): Promise<CrewExecutionResult> {
    const startTime = Date.now();
    const crew = await this.getCrew(crewId);
    
    if (!crew) {
      return {
        crewId,
        processId,
        results: [],
        success: false,
        error: `Crew with ID ${crewId} not found`,
        executionTimeMs: Date.now() - startTime
      };
    }
    
    // Find the process
    const process = crew.processes.find(p => p.id === processId);
    if (!process) {
      return {
        crewId,
        processId,
        results: [],
        success: false,
        error: `Process with ID ${processId} not found in crew ${crewId}`,
        executionTimeMs: Date.now() - startTime
      };
    }
    
    // Execute the process
    const results: TaskResult[] = [];
    let success = true;
    
    try {
      if (process.sequential) {
        // Execute tasks sequentially
        for (const task of process.tasks) {
          const result = await this.executeTask(crew, task);
          results.push(result);
          
          // Update task status
          task.status = result.success ? 'completed' : 'failed';
          
          // Stop on failure if sequential
          if (!result.success) {
            success = false;
            break;
          }
        }
      } else {
        // Execute tasks in parallel
        const taskPromises = process.tasks.map(task => this.executeTask(crew, task));
        const taskResults = await Promise.all(taskPromises);
        
        results.push(...taskResults);
        
        // Update task statuses
        for (let i = 0; i < process.tasks.length; i++) {
          process.tasks[i].status = taskResults[i].success ? 'completed' : 'failed';
        }
        
        // Check if any task failed
        success = taskResults.every(result => result.success);
      }
      
      // Save process execution results
      const executionResult: CrewExecutionResult = {
        crewId,
        processId,
        results,
        success,
        executionTimeMs: Date.now() - startTime
      };
      
      // Save results to database
      try {
        const { data, error } = await supabase
          .from('crew_executions')
          .insert({
            crew_id: crewId,
            process_id: processId,
            results: results.map(r => ({
              task_id: r.taskId,
              agent_id: r.agentId,
              output: r.output,
              success: r.success,
              error: r.error,
              execution_time_ms: r.executionTimeMs,
              metadata: r.metadata
            })),
            success,
            execution_time_ms: executionResult.executionTimeMs
          });
          
        if (error) {
          console.error('Error saving crew execution results to database:', error);
        }
      } catch (err) {
        console.error('Exception saving crew execution results to database:', err);
      }
      
      return executionResult;
    } catch (error) {
      return {
        crewId,
        processId,
        results,
        success: false,
        error: `Error executing process: ${error.message}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
  
  /**
   * Execute a single task with an appropriate agent
   */
  private async executeTask(crew: Crew, task: CrewTask): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // Find the assigned agent
      let agentId = task.assignedTo;
      
      if (!agentId) {
        // If no agent is assigned, find a suitable one
        const suitableMembers = crew.members.filter(member => {
          // Implement logic to find suitable agent based on task requirements
          // For now, just return the first member
          return true;
        });
        
        if (suitableMembers.length === 0) {
          throw new Error('No suitable agent found for task');
        }
        
        agentId = suitableMembers[0].agentId;
      }
      
      // Find the crew member
      const crewMember = crew.members.find(member => member.agentId === agentId);
      if (!crewMember) {
        throw new Error(`Agent with ID ${agentId} not found in crew`);
      }
      
      // Execute the task with the agent
      const { data, error } = await supabase.functions.invoke('execute-agent-task', {
        body: {
          agentId,
          task: {
            description: task.description,
            expectedOutput: task.expectedOutput,
            context: task.context || {}
          },
          crewContext: {
            crewId: crew.id,
            crewGoal: crew.goal,
            role: crewMember.role,
            allowedTools: crewMember.allowedTools
          }
        }
      });
      
      if (error) {
        throw new Error(`Error executing task: ${error.message}`);
      }
      
      // Update task status
      task.status = 'completed';
      
      return {
        taskId: task.id,
        agentId,
        output: data.output,
        success: true,
        executionTimeMs: Date.now() - startTime,
        metadata: data.metadata
      };
    } catch (error) {
      // Update task status
      task.status = 'failed';
      
      return {
        taskId: task.id,
        agentId: task.assignedTo || 'unknown',
        output: null,
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
  
  /**
   * Get the results of a process execution
   */
  async getProcessResults(
    crewId: string,
    processId: string
  ): Promise<CrewExecutionResult | null> {
    try {
      const { data, error } = await supabase
        .from('crew_executions')
        .select('*')
        .eq('crew_id', crewId)
        .eq('process_id', processId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error || !data) {
        console.error('Error fetching crew execution results from database:', error);
        return null;
      }
      
      return {
        crewId: data.crew_id,
        processId: data.process_id,
        results: data.results.map((r: any) => ({
          taskId: r.task_id,
          agentId: r.agent_id,
          output: r.output,
          success: r.success,
          error: r.error,
          executionTimeMs: r.execution_time_ms,
          metadata: r.metadata
        })),
        success: data.success,
        executionTimeMs: data.execution_time_ms
      };
    } catch (err) {
      console.error('Exception fetching crew execution results from database:', err);
      return null;
    }
  }
}

// Export singleton instance
export const crewManager = new CrewManager();
