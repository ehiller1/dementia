/**
 * Decision Template Integration with Intent Router
 * 
 * This module extends the intent router to support decision templates,
 * enabling automatic discovery and instantiation of templates based on user queries.
 * Also supports dynamic template generation and integration.
 */
import { classifyIntent } from './intent-classifier.ts';
import { findMatchingDecisionTemplate, extractTemplateParameters } from '../decision-templates/workflow.ts';
import { ExtendedIntent } from '../decision-templates/types.ts';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase.ts';
import { identifyMissingParameters, processDecisionTemplate } from '../decision-templates/workflow.ts';
import { DynamicTemplateEngine } from '../../services/dynamic-template-engine/DynamicTemplateEngine.ts';
import { MemoryIntegrationService } from '../../services/memory-integration/MemoryIntegrationService.ts';
import { DynamicTemplate } from '../../services/dynamic-template-engine/interfaces.ts';



// Initialize services
const memoryService = new MemoryIntegrationService();
const templateEngine = new DynamicTemplateEngine({ memoryIntegrationService: memoryService });

// Define a type for the combined template strategy result
type TemplateStrategy = 'database' | 'dynamic' | 'combined';
type TemplateStrategyResult = {
  templateToUse: DynamicTemplate | null;
  strategy: TemplateStrategy;
};

// Helper function to update the dynamic template
async function updateDynamicTemplate(conversationId: string, sessionId: string, userId: string, tenantId: string) {
    const DYNAMIC_META_PROMPT_ID = 'meta-prompt-dynamic-generation'; // Assuming this ID exists
    
    try {
        const executionResult = await templateEngine.executeTemplate(DYNAMIC_META_PROMPT_ID, {
            conversationId,
            sessionId,
            userId,
            tenantId,
        });

        console.log('--- updateDynamicTemplate: executionResult ---', JSON.stringify(executionResult, null, 2));

        if (executionResult.status === 'success' && executionResult.result) {
            let dynamicTemplateSchema;
            if (typeof executionResult.result === 'string') {
                try {
                    dynamicTemplateSchema = JSON.parse(executionResult.result);
                } catch (e) {
                    console.error('Failed to parse executionResult.result', e);
                    dynamicTemplateSchema = {}; // or handle error appropriately
                }
            } else if (typeof executionResult.result === 'object') {
                dynamicTemplateSchema = executionResult.result;
            } else {
                console.error('Invalid type for executionResult.result:', typeof executionResult.result);
                dynamicTemplateSchema = {}; // or handle error appropriately
            }
            console.log('--- updateDynamicTemplate: parsed schema ---', JSON.stringify(dynamicTemplateSchema, null, 2));

            const currentState = await memoryService.getShortTermMemory({ conversationId, sessionId });
            if (!currentState || !currentState.currentState) {
                console.error('Failed to retrieve current state');
                return;
            }
            const newContext = {
                ...(currentState.currentState.context || {}),
                dynamic_template_schema: dynamicTemplateSchema,
            };

            console.log('--- updateDynamicTemplate: storing new context ---', JSON.stringify(newContext, null, 2));
            await memoryService.storeWorkflowState({
                workflow_instance_id: sessionId,
                conversation_id: conversationId,
                current_step: currentState.currentState.current_step || 'dynamic_template_updated',
                context: newContext,
                tenant_id: tenantId,
                user_id: userId,
            }, { conversationId, sessionId, userId, tenantId });

        } else {
            console.error("Failed to execute dynamic template meta-prompt", executionResult.result);
        }
    } catch (error) {
        console.error('Error in updateDynamicTemplate:', error);
    }
}

// Helper function to resolve the template strategy
async function resolveTemplateStrategy(conversationId: string, sessionId: string, templateId: string): Promise<TemplateStrategyResult> {
    try {
        const shortTermMemory = await memoryService.getShortTermMemory({ conversationId, sessionId });
        console.log('--- resolveTemplateStrategy: shortTermMemory ---', JSON.stringify(shortTermMemory, null, 2));

        if (!shortTermMemory || !shortTermMemory.currentState) {
            console.error('Failed to retrieve short term memory');
            return { templateToUse: null, strategy: 'database' };
        }
        const dynamicTemplateSchema = shortTermMemory.currentState.context?.dynamic_template_schema;
        console.log('--- resolveTemplateStrategy: dynamicTemplateSchema ---', JSON.stringify(dynamicTemplateSchema, null, 2));

        const dbTemplate = await memoryService.getTemplate(templateId, { conversationId, sessionId });

        if (dynamicTemplateSchema && dbTemplate) {
            // Error handling for dynamicTemplateSchema.workflow
            if (!dynamicTemplateSchema.workflow) {
                console.error('Error: dynamicTemplateSchema.workflow is undefined.');
                // Handle the error appropriately, maybe return a default or log
            }
            const combinedSchema = {
                ...dbTemplate.schema,
                ...dynamicTemplateSchema,
                workflow: {
                    steps: [
                        ...(dbTemplate.schema.workflow?.steps || []),
                        ...(dynamicTemplateSchema.workflow?.steps || [])
                    ]
                },
                recommendations: {
                    ...(dbTemplate.schema.recommendations || {}),
                    ...(dynamicTemplateSchema.recommendations || {})
                }
            };
            return {
                templateToUse: { ...dbTemplate, schema: combinedSchema },
                strategy: 'combined'
            };
        } else if (dynamicTemplateSchema) {
            return {
                templateToUse: {
                    id: `dynamic-${templateId}`,
                    name: 'Dynamic Template',
                    prompt: JSON.stringify(dynamicTemplateSchema), // Store schema as a string in prompt
                    type: 'dynamic',
                    created_at: new Date().toISOString(),
                    tenant_id: ''
                },
                strategy: 'dynamic'
            };
        } else if (dbTemplate) {
            return {
                templateToUse: dbTemplate,
                strategy: 'database'
            };
        }
    } catch (error) {
        console.error('Error in resolveTemplateStrategy:', error);
    }
    return { templateToUse: null, strategy: 'database' };
}

/**
 * Enhanced intent router that includes decision template matching
 * @param query The user query to classify
 * @returns The classified intent, potentially including a matched template
 */
export async function classifyIntentWithTemplates(query: string): Promise<ExtendedIntent> {
  try {
    // 1. First run basic intent classification
    const baseIntent = await classifyIntent(query);
    
    // 2. If it's an action intent, check for matching templates
    if (baseIntent.type === 'action') {
      // Check if this matches a decision template
      const templateMatch = await findMatchingDecisionTemplate(query);
      
      if (templateMatch && templateMatch.confidence > 0.75) {
        return {
          type: 'decision',
          templateId: templateMatch.templateId,
          templateName: templateMatch.name,
          confidence: templateMatch.confidence
        };
      }
    }
    
    // 3. Return original intent if no template match
    return baseIntent;
  } catch (error) {
    console.error('Error in enhanced intent classification:', error);
    
    // Fallback to informational if there's an error
    return {
      type: 'informational',
      confidence: 1.0
    };
  }
}

/**
 * Process a user query for a matched template
 * @param query The user query
 * @param templateId The matched template ID
 * @param conversationId The conversation ID
 * @param userId The user ID
 * @returns Information about missing parameters and extraction results
 */
export async function processQueryForTemplate(
  query: string,
  templateId: string,
  conversationId: string,
  userId: string
): Promise<{
  extractedParams: Record<string, any>;
  missingParams: Array<{ name: string, description: string }>;
  needsMoreInfo: boolean;
}> {
  // Extract parameters from the query
  const extractedParams = await extractTemplateParameters(templateId, query);
  
  if (!extractedParams) {
    throw new Error('Failed to extract template parameters');
  }
  
  // Load the template to check for missing required parameters
  const { data: template, error } = await supabase
    .from('decision_templates')
    .select('*')
    .eq('id', templateId)
    .single();
  
  if (error || !template) {
    throw new Error(`Template not found: ${error?.message}`);
  }
  
  // Identify any missing required parameters
  const missingParams = identifyMissingParameters(template, extractedParams);
  const needsMoreInfo = missingParams.length > 0;
  
  return {
    extractedParams,
    missingParams,
    needsMoreInfo
  };
}

/**
 * Generate follow-up questions for missing parameters
 * @param missingParams List of missing parameter information
 * @returns Formatted questions to ask the user
 */
export function generateParameterQuestions(
  missingParams: Array<{ name: string, description: string }>
): string {
  let questions = "I need some additional information to help you with this:\n\n";
  
  for (const param of missingParams) {
    questions += `- ${param.description}?\n`;
  }
  
  return questions;
}

/**
 * Integrate with the message processing pipeline with dynamic template support
 * @param message The user message
 * @param conversationId The conversation ID
 * @param userId The user ID
 * @param tenantId The tenant ID
 * @param sessionId The session ID
 * @returns The appropriate response based on intent classification
 */
export async function processMessageWithTemplates(
  message: string,
  conversationId: string,
  userId: string,
  tenantId: string = '',
  sessionId: string = ''
): Promise<any> {
  try {
    // 1. Update dynamic template based on latest context if session info provided
    if (sessionId && conversationId) {
        await updateDynamicTemplate(conversationId, sessionId, userId, tenantId || userId);
    }
    
    // 2. Classify intent with template matching
    const intent = await classifyIntentWithTemplates(message);
    
    // 3. Handle based on intent type
    if (intent.type === 'decision' && intent.templateId) {
      // This matches a decision template
      const templateResult = await processQueryForTemplate(
        message,
        intent.templateId,
        conversationId,
        userId
      );
      
      // If we need more info, return questions
      if (templateResult.needsMoreInfo) {
        return {
          type: 'parameter_request',
          templateId: intent.templateId,
          templateName: intent.templateName,
          extractedParams: templateResult.extractedParams,
          questions: generateParameterQuestions(templateResult.missingParams),
        };
      }
      
      // Resolve template strategy (combine dynamic + database if both exist)
      let resolvedTemplate: TemplateStrategyResult = { templateToUse: null, strategy: 'database' };
      if (sessionId && conversationId) {
          resolvedTemplate = await resolveTemplateStrategy(
            conversationId,
            sessionId,
            intent.templateId
          );
      } else {
          const dbTemplate = await memoryService.getTemplate(intent.templateId, { userId, tenantId });
          resolvedTemplate = { templateToUse: dbTemplate, strategy: 'database' };
      }
      
      // Create a unique instance ID for this template execution
      const instanceId = uuidv4();
      
      // Process the template with available parameters
      const result = await processDecisionTemplate(
        intent.templateId,
        templateResult.extractedParams,
        conversationId,
        userId,
        resolvedTemplate.templateToUse, // Pass the resolved template if available
        resolvedTemplate.strategy // Pass the strategy used
      );
      
      return {
        type: 'decision_processing',
        instanceId: result.instanceId,
        templateId: intent.templateId,
        templateName: intent.templateName,
        strategy: resolvedTemplate.strategy
      };
    }
    
    // 4. Check if we have dynamic template recommendations for other intent types
    if (sessionId && conversationId) {
      const shortTermMemory = await memoryService.getShortTermMemory({ conversationId, sessionId });
      const dynamicRecommendations = shortTermMemory.currentState?.context?.dynamic_template_schema?.recommendations;
      
      if (dynamicRecommendations) {
        // For non-decision intents, we can still use recommendations from the dynamic template
        // This would be handled here based on the specific requirements
      }
    }
    
    // 5. Handle other intent types as usual
    if (intent.type === 'action') {
      return {
        type: 'action',
        action: intent.action,
      };
    } else {
      return {
        type: 'informational',
      };
    }
  } catch (error) {
    console.error('Error processing message with templates:', error);
    throw error;
  }
}

// Import at top but moved here to avoid circular imports

