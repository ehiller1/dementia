/**
 * Playbook Loader - JavaScript version
 * YAML parsing and caching for policy-as-code playbooks
 */

import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PlaybookLoader {
  static cache = new Map();
  static playbooksDir = path.join(process.cwd(), 'playbooks');

  /**
   * Load a playbook by name from YAML file
   */
  static async loadPlaybook(name) {
    // Check cache first
    if (this.cache.has(name)) {
      console.log(`📚 [PlaybookLoader] Returning cached playbook: ${name}`);
      return this.cache.get(name);
    }

    try {
      const filePath = path.join(this.playbooksDir, `${name}.yaml`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [PlaybookLoader] Playbook file not found: ${filePath}`);
        return null;
      }

      const yamlContent = fs.readFileSync(filePath, 'utf8');
      const playbookYAML = yaml.load(yamlContent);
      
      const spec = this.convertYAMLToSpec(playbookYAML);
      
      // Cache the result
      this.cache.set(name, spec);
      
      console.log(`✅ [PlaybookLoader] Loaded playbook: ${name}`);
      return spec;
    } catch (error) {
      console.error(`❌ [PlaybookLoader] Error loading playbook ${name}:`, error);
      return null;
    }
  }

  /**
   * Load all playbooks from the playbooks directory
   */
  static async loadAllPlaybooks() {
    const playbooks = new Map();

    try {
      if (!fs.existsSync(this.playbooksDir)) {
        console.warn(`⚠️ [PlaybookLoader] Playbooks directory not found: ${this.playbooksDir}`);
        return playbooks;
      }

      const files = fs.readdirSync(this.playbooksDir);
      const yamlFiles = files.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

      console.log(`📚 [PlaybookLoader] Found ${yamlFiles.length} playbook files`);

      for (const file of yamlFiles) {
        const name = path.basename(file, path.extname(file));
        const spec = await this.loadPlaybook(name);
        if (spec) {
          playbooks.set(name, spec);
        }
      }

      console.log(`✅ [PlaybookLoader] Loaded ${playbooks.size} playbooks`);
      return playbooks;
    } catch (error) {
      console.error('❌ [PlaybookLoader] Error loading playbooks:', error);
      return playbooks;
    }
  }

  /**
   * Convert YAML format to PlaybookSpec format
   */
  static convertYAMLToSpec(yamlData) {
    const spec = {
      playbook: yamlData.name,
      version: yamlData.version,
      description: yamlData.description,
      triggers: yamlData.triggers || [],
      guards: yamlData.guards || {},
      parameters: yamlData.parameters || {},
      actions: yamlData.actions || {},
      rationale_template: yamlData.rationale_template || '',
      impact_assessment: yamlData.impact_assessment || { functions: [] },
      knowledge_graph_queries: yamlData.knowledge_graph_queries || {}
    };

    return spec;
  }

  /**
   * Select appropriate playbook based on forecast delta
   */
  static selectPlaybookForDelta(delta) {
    // Simple heuristic-based selection
    if (!delta || typeof delta.value === 'undefined') {
      return null;
    }

    const deltaValue = delta.value;
    const deltaLevel = delta.level || 'unknown';

    // Global demand down
    if (deltaLevel === 'global' && deltaValue <= -0.02) {
      return 'global_demand_down';
    }

    // SKU demand down
    if (deltaLevel === 'sku' && deltaValue <= -0.05) {
      return 'sku_demand_down';
    }

    // Could add more selection logic here based on other conditions
    return null;
  }

  /**
   * Clear the cache
   */
  static clearCache() {
    this.cache.clear();
    console.log('🧹 [PlaybookLoader] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.cache.size,
      playbooks: Array.from(this.cache.keys())
    };
  }
}
