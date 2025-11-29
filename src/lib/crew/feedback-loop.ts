// Use correct crewAI import structure


/**
 * Interface for agent feedback on task outputs
 */
interface AgentFeedback {
  feedbackId: string;
  sourceAgentName: string;
  targetAgentName: string;
  taskId: string;
  feedback: string;
  suggestedImprovements: string[];
  iterationNumber: number;
  timestamp: string;
}

/**
 * Interface for tracking task iterations in the feedback loop
 */
interface TaskIteration {
  taskId: string;
  agentName: string;
  iterationNumber: number;
  output: any;
  feedbackReceived: AgentFeedback[];
  improvementsMade: string[];
  timestamp: string;
}

/**
 * Class that manages the feedback loop between agents
 */
export class FeedbackLoopManager {
  private taskIterations: Map<string, TaskIteration[]> = new Map();
  private feedbacks: Map<string, AgentFeedback[]> = new Map();
  private maxIterations: number;
  private improvementThreshold: number;
  
  constructor(options: { maxIterations?: number; improvementThreshold?: number } = {}) {
    this.maxIterations = options.maxIterations || 3;
    this.improvementThreshold = options.improvementThreshold || 0.2;
  }
  
  /**
   * Records the output of a task iteration
   */
  recordTaskOutput(taskId: string, agentName: string, output: any): string {
    const iterationId = `${taskId}-${agentName}-${Date.now()}`;
    const iterationNumber = this.getIterationsForTask(taskId).length + 1;
    
    const iteration: TaskIteration = {
      taskId,
      agentName,
      iterationNumber,
      output,
      feedbackReceived: [],
      improvementsMade: [],
      timestamp: new Date().toISOString()
    };
    
    if (!this.taskIterations.has(taskId)) {
      this.taskIterations.set(taskId, []);
    }
    
    this.taskIterations.get(taskId)?.push(iteration);
    console.log(`[Feedback Loop] Recorded output for ${agentName} on task ${taskId} (iteration ${iterationNumber})`);
    
    return iterationId;
  }
  
  /**
   * Creates a feedback task for one agent to review another's work
   */
  createFeedbackTask(
    reviewerAgent: any, 
    targetAgentName: string, 
    taskId: string,
    taskDescription: string
  ): any {
    const iterations = this.getIterationsForTask(taskId);
    const latestIteration = iterations.find(it => it.agentName === targetAgentName);
    
    if (!latestIteration) {
      throw new Error(`No output found for agent ${targetAgentName} on task ${taskId}`);
    }
    
    // Format the output in a readable way for the reviewer
    let formattedOutput = '';
    try {
      if (typeof latestIteration.output === 'string') {
        formattedOutput = latestIteration.output;
      } else {
        formattedOutput = JSON.stringify(latestIteration.output, null, 2);
      }
    } catch (e) {
      formattedOutput = `[Error formatting output: ${e.message}]`;
    }
    
    return {
      description: `Review the work of the ${targetAgentName} for the following task:
      
${taskDescription}

The ${targetAgentName} has produced the following output (iteration ${latestIteration.iterationNumber}):

---
${formattedOutput}
---

As a reviewer, your job is to:
1. Evaluate the accuracy and completeness of the output
2. Identify specific strengths of the work
3. Identify areas that could be improved
4. Provide specific, actionable suggestions for improvement
5. Assign an overall quality score from 0 to 10

Your feedback should be constructive and specific, helping the ${targetAgentName} to improve their output.`,
      agent: reviewerAgent,
      expectedOutput: `{
        "overallScore": 7,
        "strengths": ["..."],
        "areasForImprovement": ["..."],
        "specificSuggestions": ["..."],
        "additionalComments": "..."
      }`
    };
  }
  
  /**
   * Records feedback from one agent to another
   */
  recordFeedback(
    sourceAgentName: string,
    targetAgentName: string,
    taskId: string,
    feedbackContent: any
  ): string {
    const feedbackId = `feedback-${sourceAgentName}-${targetAgentName}-${Date.now()}`;
    
    // Get the iteration number of the target agent's latest output
    const iterations = this.getIterationsForTask(taskId);
    const targetIterations = iterations.filter(it => it.agentName === targetAgentName);
    const iterationNumber = targetIterations.length;
    
    // Parse suggestions from feedback content
    let suggestedImprovements: string[] = [];
    if (typeof feedbackContent === 'string') {
      try {
        const parsed = JSON.parse(feedbackContent);
        suggestedImprovements = parsed.specificSuggestions || [];
      } catch (e) {
        // If parsing fails, try to extract suggestions from the text
        suggestedImprovements = 
          feedbackContent.split('\n')
            .filter(line => line.includes('suggest') || line.includes('improve'))
            .map(line => line.trim());
      }
    } else if (feedbackContent.specificSuggestions) {
      suggestedImprovements = feedbackContent.specificSuggestions;
    }
    
    const feedback: AgentFeedback = {
      feedbackId,
      sourceAgentName,
      targetAgentName,
      taskId,
      feedback: typeof feedbackContent === 'string' ? feedbackContent : JSON.stringify(feedbackContent),
      suggestedImprovements,
      iterationNumber,
      timestamp: new Date().toISOString()
    };
    
    if (!this.feedbacks.has(targetAgentName)) {
      this.feedbacks.set(targetAgentName, []);
    }
    
    this.feedbacks.get(targetAgentName)?.push(feedback);
    
    // Also add feedback to the task iteration
    const latestIteration = targetIterations[targetIterations.length - 1];
    if (latestIteration) {
      latestIteration.feedbackReceived.push(feedback);
    }
    
    console.log(`[Feedback Loop] Recorded feedback from ${sourceAgentName} to ${targetAgentName} on task ${taskId}`);
    
    return feedbackId;
  }
  
  /**
   * Creates a task for an agent to improve their work based on feedback
   */
  createImprovementTask(
    agent: any,
    taskId: string,
    originalTaskDescription: string
  ): any | null {
    const iterations = this.getIterationsForTask(taskId);
    const agentName = agent.name;
    const agentIterations = iterations.filter(it => it.agentName === agentName);
    
    if (agentIterations.length === 0) {
      console.log(`[Feedback Loop] No iterations found for agent ${agentName} on task ${taskId}`);
      return null;
    }
    
    const latestIteration = agentIterations[agentIterations.length - 1];
    
    // Check if we've reached the maximum number of iterations
    if (latestIteration.iterationNumber >= this.maxIterations) {
      console.log(`[Feedback Loop] Maximum iterations (${this.maxIterations}) reached for agent ${agentName} on task ${taskId}`);
      return null;
    }
    
    // Check if there's any feedback for this agent on this task
    if (latestIteration.feedbackReceived.length === 0) {
      console.log(`[Feedback Loop] No feedback received for agent ${agentName} on task ${taskId}`);
      return null;
    }
    
    // Compile all feedback suggestions
    const allSuggestions = latestIteration.feedbackReceived
      .flatMap(fb => fb.suggestedImprovements)
      .filter(Boolean);
    
    if (allSuggestions.length === 0) {
      console.log(`[Feedback Loop] No improvement suggestions found for agent ${agentName} on task ${taskId}`);
      return null;
    }
    
    // Format the original output
    let formattedOutput = '';
    try {
      if (typeof latestIteration.output === 'string') {
        formattedOutput = latestIteration.output;
      } else {
        formattedOutput = JSON.stringify(latestIteration.output, null, 2);
      }
    } catch (e) {
      formattedOutput = `[Error formatting output: ${e.message}]`;
    }
    
    // Create a task for the agent to improve their work
    return {
      description: `Improve your previous work based on the feedback received.

Original Task: ${originalTaskDescription}

Your previous output (iteration ${latestIteration.iterationNumber}):
---
${formattedOutput}
---

Feedback and suggestions for improvement:
${latestIteration.feedbackReceived.map(fb => 
  `Feedback from ${fb.sourceAgentName}:
   ${fb.feedback}
   
   Specific suggestions:
   ${fb.suggestedImprovements.map(sugg => `   - ${sugg}`).join('\n')}
  `
).join('\n\n')}

Please revise your output to address these suggestions. Focus particularly on:
${allSuggestions.map(sugg => `- ${sugg}`).join('\n')}

Provide your improved output in the same format as your original output.`,
      agent,
      context: `This is iteration ${latestIteration.iterationNumber + 1} of ${this.maxIterations}.`,
    };
  }
  
  /**
   * Records improvements made by an agent based on feedback
   */
  recordImprovement(
    agentName: string,
    taskId: string,
    improvedOutput: any,
    improvementsMade: string[]
  ): string {
    const improvementId = `improvement-${agentName}-${taskId}-${Date.now()}`;
    
    // Record the new iteration with improvements
    this.recordTaskOutput(taskId, agentName, improvedOutput);
    
    // Update the latest iteration with the improvements made
    const iterations = this.getIterationsForTask(taskId);
    const agentIterations = iterations.filter(it => it.agentName === agentName);
    const latestIteration = agentIterations[agentIterations.length - 1];
    
    if (latestIteration) {
      latestIteration.improvementsMade = improvementsMade;
    }
    
    console.log(`[Feedback Loop] Recorded improvement for ${agentName} on task ${taskId}`);
    
    return improvementId;
  }
  
  /**
   * Gets all iterations for a specific task
   */
  getIterationsForTask(taskId: string): TaskIteration[] {
    return this.taskIterations.get(taskId) || [];
  }
  
  /**
   * Gets all feedback for a specific agent
   */
  getFeedbackForAgent(agentName: string): AgentFeedback[] {
    return this.feedbacks.get(agentName) || [];
  }
  
  /**
   * Gets the final output for a task
   */
  getFinalOutput(taskId: string, agentName: string): any {
    const iterations = this.getIterationsForTask(taskId);
    const agentIterations = iterations
      .filter(it => it.agentName === agentName)
      .sort((a, b) => b.iterationNumber - a.iterationNumber);
    
    if (agentIterations.length === 0) {
      return null;
    }
    
    return agentIterations[0].output;
  }
  
  /**
   * Gets improvement metrics for a task
   */
  getImprovementMetrics(taskId: string, agentName: string): any {
    const iterations = this.getIterationsForTask(taskId);
    const agentIterations = iterations.filter(it => it.agentName === agentName);
    
    if (agentIterations.length <= 1) {
      return {
        totalIterations: agentIterations.length,
        totalFeedbackReceived: agentIterations.reduce((sum, it) => sum + it.feedbackReceived.length, 0),
        totalImprovementsMade: 0,
        improvementTrajectory: []
      };
    }
    
    // Calculate improvement metrics
    const improvementTrajectory = agentIterations.map((it, idx) => {
      if (idx === 0) {
        return { iteration: 1, improvementScore: 0 };
      }
      
      const prevFeedback = agentIterations[idx - 1].feedbackReceived;
      const avgScore = prevFeedback.reduce((sum, fb) => {
        try {
          const parsed = JSON.parse(fb.feedback);
          return sum + (parsed.overallScore || 5);
        } catch (e) {
          return sum + 5; // Default score if parsing fails
        }
      }, 0) / Math.max(1, prevFeedback.length);
      
      return {
        iteration: it.iterationNumber,
        improvementScore: avgScore / 10, // Normalize to 0-1 scale
        improvementsMade: it.improvementsMade
      };
    });
    
    return {
      totalIterations: agentIterations.length,
      totalFeedbackReceived: agentIterations.reduce((sum, it) => sum + it.feedbackReceived.length, 0),
      totalImprovementsMade: agentIterations.reduce((sum, it) => sum + it.improvementsMade.length, 0),
      improvementTrajectory
    };
  }
}
