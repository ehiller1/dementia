/**
 * Learning and Adaptation Layer
 * 
 * Analyzes error patterns, tracks successful recovery strategies,
 * and suggests improvements to the system.
 */

import { supabase } from '../../integrations/supabase/client.ts';
import OpenAI from 'openai';
import { ErrorType, ErrorCategory, SourceType } from './error-detection-engine.ts';
import { RecoveryResult } from './recovery-execution-engine.ts';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Adaptation suggestion
export interface AdaptationSuggestion {
  id: string;
  errorPatternId?: string;
  suggestionType: 'workflow' | 'template' | 'agent' | 'component' | 'system';
  targetId?: string;
  suggestion: string;
  rationale: string;
  confidence: number;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  potentialImpact: 'low' | 'medium' | 'high';
  status: 'suggested' | 'approved' | 'rejected' | 'implemented';
}

// Error pattern
export interface ErrorPattern {
  id: string;
  errorType: ErrorType;
  errorCategory: ErrorCategory;
  sourceType: SourceType;
  patternRegex?: string;
  patternEmbedding?: number[];
  occurrences: number;
  recoveryStrategies: string[];
  successfulStrategies: string[];
  successRate: number;
}

/**
 * Learning and Adaptation Layer
 */
export class LearningAdaptationLayer {
  /**
   * Process recovery result to learn from it
   */
  public async processRecoveryResult(
    result: RecoveryResult,
    errorDetails: any,
    recoveryPlan: any
  ): Promise<void> {
    try {
      // Update error pattern statistics
      await this.updateErrorPatternStats(
        result.errorId,
        result.successful,
        recoveryPlan.strategy
      );
      
      // If successful, log the adaptation
      if (result.successful) {
        await this.logSuccessfulAdaptation(
          result.errorId,
          result.recoveryId,
          recoveryPlan.strategy,
          errorDetails
        );
      }
      
      // Analyze for potential improvements
      await this.analyzeForImprovements(
        result,
        errorDetails,
        recoveryPlan
      );
    } catch (err) {
      console.error('Error processing recovery result:', err);
    }
  }
  
  /**
   * Update error pattern statistics
   */
  private async updateErrorPatternStats(
    errorId: string,
    successful: boolean,
    strategy: string
  ): Promise<void> {
    try {
      // Get error details
      const { data: errorData, error: errorFetchError } = await supabase
        .from('error_logs')
        .select('error_type, error_category, source_type, error_message, component_id')
        .eq('id', errorId)
        .single();
      
      if (errorFetchError || !errorData) {
        console.error('Error fetching error details:', errorFetchError);
        return;
      }
      
      // Find matching pattern or create new one
      const { data: patterns, error: patternError } = await supabase.rpc('find_matching_error_patterns', {
        p_error_type: errorData.error_type,
        p_error_category: errorData.error_category,
        p_error_message: errorData.error_message,
        p_source_type: errorData.source_type,
        p_component_type: errorData.component_id
      });
      
      if (patternError) {
        console.error('Error finding matching patterns:', patternError);
        return;
      }
      
      if (patterns && patterns.length > 0) {
        // Update existing pattern
        const pattern = patterns[0];
        
        // Calculate new success rate
        const totalAttempts = pattern.occurrences + 1;
        const successfulAttempts = successful 
          ? (pattern.success_rate * pattern.occurrences) + 1 
          : (pattern.success_rate * pattern.occurrences);
        const newSuccessRate = successfulAttempts / totalAttempts;
        
        // Update pattern
        await supabase
          .from('error_patterns')
          .update({
            occurrences: totalAttempts,
            success_rate: newSuccessRate,
            last_seen: new Date().toISOString(),
            recovery_strategies: successful 
              ? [...new Set([...pattern.recovery_strategies, strategy])]
              : pattern.recovery_strategies
          })
          .eq('id', pattern.id);
      } else {
        // Create new pattern
        await supabase
          .from('error_patterns')
          .insert({
            error_type: errorData.error_type,
            error_category: errorData.error_category,
            source_type: errorData.source_type,
            component_type: errorData.component_id,
            pattern_regex: this.generatePatternRegex(errorData.error_message),
            occurrences: 1,
            success_rate: successful ? 1 : 0,
            recovery_strategies: successful ? [strategy] : [],
            created_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Error updating error pattern stats:', err);
    }
  }
  
  /**
   * Generate a pattern regex from an error message
   */
  private generatePatternRegex(errorMessage: string): string {
    // Simple implementation: replace numbers, UUIDs, and dates with wildcards
    return errorMessage
      .replace(/\d+/g, '\\d+')
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[0-9a-f-]+')
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}');
  }
  
  /**
   * Log successful adaptation
   */
  private async logSuccessfulAdaptation(
    errorId: string,
    recoveryId: string,
    strategy: string,
    errorDetails: any
  ): Promise<void> {
    try {
      // Get recovery details
      const { data: recoveryData, error: recoveryError } = await supabase
        .from('recovery_attempts')
        .select('recovery_plan, recovery_parameters, user_input, execution_result')
        .eq('id', recoveryId)
        .single();
      
      if (recoveryError || !recoveryData) {
        console.error('Error fetching recovery details:', recoveryError);
        return;
      }
      
      // Create learned adaptation
      await supabase
        .from('learned_adaptations')
        .insert({
          error_id: errorId,
          recovery_attempt_id: recoveryId,
          adaptation_type: 'recovery',
          adaptation_details: {
            strategy,
            parameters: recoveryData.recovery_parameters,
            userInput: recoveryData.user_input,
            result: recoveryData.execution_result
          },
          source_context: errorDetails,
          confidence: 1.0,
          created_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Error logging successful adaptation:', err);
    }
  }
  
  /**
   * Analyze for potential improvements
   */
  private async analyzeForImprovements(
    result: RecoveryResult,
    errorDetails: any,
    recoveryPlan: any
  ): Promise<void> {
    try {
      // Only analyze if we have enough data
      if (!result.successful || !errorDetails || !recoveryPlan) {
        return;
      }
      
      // Get error patterns with this error type
      const { data: patterns, error: patternError } = await supabase
        .from('error_patterns')
        .select('*')
        .eq('error_type', errorDetails.error_type)
        .order('occurrences', { ascending: false })
        .limit(10);
      
      if (patternError) {
        console.error('Error fetching error patterns:', patternError);
        return;
      }
      
      // If we have enough patterns, analyze them with LLM
      if (patterns && patterns.length >= 3) {
        await this.generateImprovementSuggestions(patterns, errorDetails);
      }
    } catch (err) {
      console.error('Error analyzing for improvements:', err);
    }
  }
  
  /**
   * Generate improvement suggestions using LLM
   */
  private async generateImprovementSuggestions(
    patterns: any[],
    errorDetails: any
  ): Promise<void> {
    try {
      // Construct prompt for LLM
      const prompt = this.constructImprovementPrompt(patterns, errorDetails);
      
      // Call OpenAI API
            const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });
      
      // Parse suggestions
      const suggestions = this.parseSuggestions(response.choices[0].message.content || '');
      
      // Save suggestions to database
      for (const suggestion of suggestions) {
        await supabase
          .from('adaptation_suggestions')
          .insert({
            suggestion_type: suggestion.suggestionType,
            target_id: suggestion.targetId,
            suggestion: suggestion.suggestion,
            rationale: suggestion.rationale,
            confidence: suggestion.confidence,
            implementation_difficulty: suggestion.implementationDifficulty,
            potential_impact: suggestion.potentialImpact,
            status: 'suggested',
            created_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Error generating improvement suggestions:', err);
    }
  }
  
  /**
   * Construct a prompt for improvement suggestions
   */
  private constructImprovementPrompt(
    patterns: any[],
    errorDetails: any
  ): string {
    return `
You are an AI system improvement analyzer. Given the following error patterns and details, suggest improvements to prevent similar errors in the future.

Error Patterns:
${patterns.map(pattern => `
- Type: ${pattern.error_type}
  Category: ${pattern.error_category}
  Source: ${pattern.source_type}
  Component: ${pattern.component_type || 'N/A'}
  Occurrences: ${pattern.occurrences}
  Success Rate: ${pattern.success_rate}
  Recovery Strategies: ${pattern.recovery_strategies.join(', ')}
`).join('\n')}

Current Error Details:
- Type: ${errorDetails.error_type}
  Category: ${errorDetails.error_category}
  Source: ${errorDetails.source_type}
  Component: ${errorDetails.component_id || 'N/A'}
  Message: ${errorDetails.error_message}

Please suggest 1-3 improvements that could help prevent these types of errors in the future. For each suggestion, provide:
1. The type of suggestion (workflow, template, agent, component, system)
2. The target ID if applicable
3. The specific suggestion
4. The rationale for the suggestion
5. Your confidence in this suggestion (0.0 to 1.0)
6. The implementation difficulty (easy, medium, hard)
7. The potential impact (low, medium, high)

Format your response as JSON:
[
  {
    "suggestionType": "workflow|template|agent|component|system",
    "targetId": "id or null",
    "suggestion": "specific suggestion",
    "rationale": "why this would help",
    "confidence": 0.9,
    "implementationDifficulty": "easy|medium|hard",
    "potentialImpact": "low|medium|high"
  }
]
`;
  }
  
  /**
   * Parse suggestions from LLM response
   */
  private parseSuggestions(response: string): AdaptationSuggestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedSuggestions = JSON.parse(jsonMatch[0]);
        
        // Convert to AdaptationSuggestion objects
        return parsedSuggestions.map((suggestion: any) => ({
          id: uuidv4(),
          suggestionType: suggestion.suggestionType,
          targetId: suggestion.targetId,
          suggestion: suggestion.suggestion,
          rationale: suggestion.rationale,
          confidence: suggestion.confidence,
          implementationDifficulty: suggestion.implementationDifficulty,
          potentialImpact: suggestion.potentialImpact,
          status: 'suggested'
        }));
      }
    } catch (err) {
      console.error('Error parsing suggestions:', err);
    }
    
    return [];
  }
  
  /**
   * Get adaptation suggestions for review
   */
  public async getAdaptationSuggestions(
    status: 'suggested' | 'approved' | 'rejected' | 'implemented' = 'suggested',
    limit: number = 10
  ): Promise<AdaptationSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('adaptation_suggestions')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching adaptation suggestions:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        suggestionType: item.suggestion_type,
        targetId: item.target_id,
        suggestion: item.suggestion,
        rationale: item.rationale,
        confidence: item.confidence,
        implementationDifficulty: item.implementation_difficulty,
        potentialImpact: item.potential_impact,
        status: item.status
      }));
    } catch (err) {
      console.error('Error getting adaptation suggestions:', err);
      return [];
    }
  }
  
  /**
   * Update adaptation suggestion status
   */
  public async updateSuggestionStatus(
    suggestionId: string,
    status: 'approved' | 'rejected' | 'implemented'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('adaptation_suggestions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', suggestionId);
      
      if (error) {
        console.error('Error updating suggestion status:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error updating suggestion status:', err);
      return false;
    }
  }
  
  /**
   * Get error patterns
   */
  public async getErrorPatterns(
    limit: number = 10
  ): Promise<ErrorPattern[]> {
    try {
      const { data, error } = await supabase
        .from('error_patterns')
        .select('*')
        .order('occurrences', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching error patterns:', error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        errorType: item.error_type,
        errorCategory: item.error_category,
        sourceType: item.source_type,
        patternRegex: item.pattern_regex,
        patternEmbedding: item.pattern_embedding,
        occurrences: item.occurrences,
        recoveryStrategies: item.recovery_strategies,
        successfulStrategies: item.successful_strategies || [],
        successRate: item.success_rate
      }));
    } catch (err) {
      console.error('Error getting error patterns:', err);
      return [];
    }
  }
}

// Export singleton instance
export const learningAdaptationLayer = new LearningAdaptationLayer();
