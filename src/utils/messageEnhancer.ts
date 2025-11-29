/**
 * Message Enhancer Utility
 * 
 * This utility provides functions to enhance messages with knowledge graph context
 * for improved understanding of domain-specific concepts.
 */

import { KnowledgeGraphService } from '@/services/knowledgeGraphService';

/**
 * Enhances a message with knowledge graph context
 * @param message The original message to enhance
 * @returns The enhanced message with knowledge graph context
 */
export async function enhanceMessageWithKnowledgeGraph(message: string): Promise<{
  originalMessage: string;
  enhancedMessage: string;
  knowledgeContext: any;
}> {
  try {
    // Get knowledge graph context
    const enhancedContext = await KnowledgeGraphService.enhanceQueryWithKnowledge(message);
    
    // Extract key concepts and their descriptions
    const keyConcepts = enhancedContext.enhancedContext.relatedConcepts
      .filter(concept => concept.depth <= 1)
      .map(concept => ({
        name: concept.name,
        type: concept.type,
        description: concept.description,
        relationship: concept.relationship_type
      }));
    
    // Format the enhanced message with knowledge context
    let enhancedMessage = message;
    
    // Only add context if we found relevant concepts
    if (keyConcepts.length > 0) {
      // Create a context string with the most relevant concepts
      const contextString = keyConcepts
        .slice(0, 3) // Limit to top 3 concepts to avoid overwhelming the message
        .map(concept => `${concept.name}: ${concept.description}`)
        .join('\n');
      
      // Add the context to the message in a non-intrusive way
      enhancedMessage = `${message}\n\n[Context: ${contextString}]`;
    }
    
    return {
      originalMessage: message,
      enhancedMessage,
      knowledgeContext: enhancedContext.enhancedContext
    };
  } catch (error) {
    console.error('Error enhancing message with knowledge graph:', error);
    // Return the original message if enhancement fails
    return {
      originalMessage: message,
      enhancedMessage: message,
      knowledgeContext: null
    };
  }
}

/**
 * Extracts domain-specific entities from a message
 * @param message The message to extract entities from
 * @returns Array of extracted entities with their types
 */
export async function extractDomainEntities(message: string): Promise<Array<{
  entity: string;
  type: string;
  confidence: number;
}>> {
  try {
    // Use the knowledge graph to identify domain entities in the message
    const enhancedContext = await KnowledgeGraphService.enhanceQueryWithKnowledge(message);
    
    // Map the related concepts to entities
    return enhancedContext.enhancedContext.relatedConcepts
      .filter(concept => concept.depth === 0) // Only direct matches
      .map(concept => ({
        entity: concept.name,
        type: concept.type,
        confidence: 1.0 - (concept.depth * 0.2) // Simple confidence score based on depth
      }));
  } catch (error) {
    console.error('Error extracting domain entities:', error);
    return [];
  }
}

/**
 * Checks if a message contains domain-specific concepts
 * @param message The message to check
 * @returns Whether the message contains domain concepts and which ones
 */
export async function containsDomainConcepts(message: string): Promise<{
  hasDomainConcepts: boolean;
  concepts: string[];
}> {
  try {
    const entities = await extractDomainEntities(message);
    return {
      hasDomainConcepts: entities.length > 0,
      concepts: entities.map(e => e.entity)
    };
  } catch (error) {
    console.error('Error checking for domain concepts:', error);
    return {
      hasDomainConcepts: false,
      concepts: []
    };
  }
}
