/**
 * Playbook Loader - YAML parsing and caching for policy-as-code playbooks
 * Loads playbooks from YAML files and converts them to PolicyEngine format
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { PlaybookSpec } from './PolicyEngine';
import { ForecastDeltaDetected } from '../events/types';

export interface PlaybookYAML {
  name: string;
  version: string;
  description: string;
  triggers: Array<{
    event_type: string;
    conditions: string[];
  }>;
  guards: {
    approvals: {
      required_roles: string[];
      threshold_conditions?: Array<{
        condition: string;
        additional_roles: string[];
      }>;
    };
  };
  parameters: Record<string, any>;
  actions: Record<string, any>;
  rationale_template: string;
  impact_assessment: {
    functions: Array<{
      name: string;
      primary_impact: string;
      confidence: number;
    }>;
  };
  knowledge_graph_queries?: Record<string, string>;
}

export class PlaybookLoader {
  private static cache: Map<string, PlaybookSpec> = new Map();
  private static playbooksDir: string = path.join(process.cwd(), 'playbooks');

  /**
   * Load a playbook by name from YAML file
   */
  static async loadPlaybook(name: string): Promise<PlaybookSpec | null> {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    try {
      const filePath = path.join(this.playbooksDir, `${name}.yaml`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`Playbook file not found: ${filePath}`);
        return null;
      }

      const yamlContent = fs.readFileSync(filePath, 'utf8');
      const playbookYAML = yaml.load(yamlContent) as PlaybookYAML;
      
      const spec = this.convertYAMLToSpec(playbookYAML);
      
      // Cache the result
      this.cache.set(name, spec);
      
      return spec;
    } catch (error) {
      console.error(`Error loading playbook ${name}:`, error);
      return null;
    }
  }

  /**
   * Load all playbooks from the playbooks directory
   */
  static async loadAllPlaybooks(): Promise<Map<string, PlaybookSpec>> {
    const playbooks = new Map<string, PlaybookSpec>();

    try {
      if (!fs.existsSync(this.playbooksDir)) {
        console.warn(`Playbooks directory not found: ${this.playbooksDir}`);
        return playbooks;
      }

      const files = fs.readdirSync(this.playbooksDir);
      const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

      for (const file of yamlFiles) {
        const name = path.basename(file, path.extname(file));
        const spec = await this.loadPlaybook(name);
        if (spec) {
          playbooks.set(name, spec);
        }
      }

      console.log(`Loaded ${playbooks.size} playbooks from ${this.playbooksDir}`);
    } catch (error) {
      console.error('Error loading playbooks:', error);
    }

    return playbooks;
  }

  /**
   * Select appropriate playbook for a forecast delta
   */
  static selectPlaybookForDelta(delta: ForecastDeltaDetected): string {
    const magnitude = Math.abs(Number((delta.delta as any)?.value ?? 0));
    const level = (delta.delta as any)?.level || 'global';
    const hasAffectedEntities = Array.isArray(delta.affected_entities) && delta.affected_entities.length > 0;

    // SKU-specific logic
    if (level === 'sku' || hasAffectedEntities) {
      if (magnitude >= 0.08) { // 8% threshold for SKU playbook
        return 'sku_demand_down';
      }
    }

    // Global/regional logic
    if (level === 'global' || level === 'region') {
      if (magnitude >= 0.02) { // 2% threshold for global playbook
        return 'global_demand_down';
      }
    }

    // Default fallback
    return magnitude >= 0.05 ? 'global_demand_down' : 'sku_demand_down';
  }

  /**
   * Convert YAML playbook to PolicyEngine PlaybookSpec format
   */
  private static convertYAMLToSpec(yamlPlaybook: PlaybookYAML): PlaybookSpec {
    return {
      playbook: yamlPlaybook.name,
      triggers: yamlPlaybook.triggers,
      guards: {
        approvals: {
          required_roles: yamlPlaybook.guards.approvals.required_roles,
        },
      },
      parameters: yamlPlaybook.parameters,
      actions: this.convertActionsToSpecs(yamlPlaybook.actions),
      // Store additional metadata for interpretation
      metadata: {
        version: yamlPlaybook.version,
        description: yamlPlaybook.description,
        rationale_template: yamlPlaybook.rationale_template,
        impact_assessment: yamlPlaybook.impact_assessment,
        knowledge_graph_queries: yamlPlaybook.knowledge_graph_queries,
      },
    };
  }

  /**
   * Convert YAML actions to action specs
   */
  private static convertActionsToSpecs(yamlActions: Record<string, any>): Array<{ function: string; type: string; params?: Record<string, any> }> {
    const actions: Array<{ function: string; type: string; params?: Record<string, any> }> = [];

    for (const [functionName, functionActions] of Object.entries(yamlActions)) {
      for (const [actionType, actionConfig] of Object.entries(functionActions as Record<string, any>)) {
        actions.push({
          function: this.capitalizeFunction(functionName),
          type: actionType,
          params: typeof actionConfig === 'object' ? actionConfig : {},
        });
      }
    }

    return actions;
  }

  /**
   * Capitalize function names to match schema expectations
   */
  private static capitalizeFunction(functionName: string): string {
    const mapping: Record<string, string> = {
      'inventory': 'Inventory',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'finance': 'Finance',
      'supply': 'Supply',
      'operations': 'Operations',
    };
    return mapping[functionName.toLowerCase()] || functionName;
  }

  /**
   * Clear the playbook cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached playbook names
   */
  static getCachedPlaybookNames(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Set custom playbooks directory
   */
  static setPlaybooksDirectory(dir: string): void {
    this.playbooksDir = dir;
    this.clearCache(); // Clear cache when directory changes
  }

  /**
   * Evaluate playbook conditions against a delta
   */
  static evaluateConditions(conditions: string[], delta: ForecastDeltaDetected): boolean {
    try {
      for (const condition of conditions) {
        if (!this.evaluateCondition(condition, delta)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn('Error evaluating playbook conditions:', error);
      return false;
    }
  }

  /**
   * Evaluate a single condition string
   */
  private static evaluateCondition(condition: string, delta: ForecastDeltaDetected): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    const deltaValue = Number((delta.delta as any)?.value ?? 0);
    const deltaLevel = (delta.delta as any)?.level || 'global';
    
    // Replace placeholders with actual values
    let evalCondition = condition
      .replace(/delta\.value/g, deltaValue.toString())
      .replace(/delta\.level/g, `"${deltaLevel}"`)
      .replace(/abs\(([^)]+)\)/g, (match, expr) => Math.abs(parseFloat(expr)).toString());

    // Basic condition evaluation (extend with proper parser for production)
    try {
      // Simple regex-based evaluation for basic conditions
      if (evalCondition.includes('<=')) {
        const [left, right] = evalCondition.split('<=').map(s => s.trim());
        return parseFloat(left) <= parseFloat(right);
      }
      if (evalCondition.includes('>=')) {
        const [left, right] = evalCondition.split('>=').map(s => s.trim());
        return parseFloat(left) >= parseFloat(right);
      }
      if (evalCondition.includes('==')) {
        const [left, right] = evalCondition.split('==').map(s => s.trim().replace(/"/g, ''));
        return left === right;
      }
      return false;
    } catch {
      return false;
    }
  }
}
