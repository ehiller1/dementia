/**
 * Alert Rules Configuration
 * 
 * Defines which Redis Streams to monitor, which event types trigger alerts,
 * and custom severity calculation rules for agent-generated alerts.
 */

import { CloudEventsMessage } from '../infrastructure/CloudEventsMessage';

/**
 * Redis Streams to monitor for agent alerts
 */
export const ALERT_STREAMS = [
  // Core mesh streams
  'mesh:events',
  'mesh:events:agent',
  'mesh:commands',
  
  // MCO observation streams
  'stream:mco:event:observation',
  
  // Domain-specific streams
  'stream:demand:forecast:alerts',
  'stream:inventory:alerts',
  'stream:pricing:recommendations',
  'stream:campaign:alerts',
  
  // Simulation streams (for testing)
  'stream:simulation:demand:forecast',
  'stream:simulation:inventory:position',
  'stream:simulation:pricing:updates',
];

/**
 * Event type patterns that trigger UI alerts
 * Supports wildcards (*) and regex patterns
 */
export const ALERT_EVENT_TYPES = [
  // Generic agent alert patterns
  'agent.alert',
  'agent.alert.*',
  'agent.recommendation',
  'agent.recommendation.*',
  'agent.anomaly',
  'agent.anomaly.*',
  'agent.decision',
  'agent.decision.*',
  'agent.warning',
  'agent.warning.*',
  
  // MCO event patterns
  'mco.event.observation',
  'mco.event.alert',
  'mco.event.anomaly',
  
  // Domain-specific patterns
  'demand.spike.detected',
  'demand.drop.detected',
  'inventory.stockout.warning',
  'inventory.critical',
  'pricing.anomaly.detected',
  'pricing.recommendation',
  'campaign.performance.alert',
  'campaign.budget.warning',
  
  // Simulation events (for testing)
  'simulation.*critical',
  'simulation.*high',
  'inventory_critical',
  'inventory_low',
  'demand_spike',
  'demand_drop',
  'price_war',
  'supply_disruption',
  'budget_shock',
  
  // Generic patterns
  '.*\\.alert$',
  '.*\\.warning$',
  '.*\\.anomaly\\.detected$',
  '.*\\.critical$',
];

/**
 * Custom severity calculation rules
 * Maps event types to functions that calculate severity based on event data
 */
export const SEVERITY_RULES: Record<string, (event: CloudEventsMessage) => 'critical' | 'high' | 'medium' | 'low'> = {
  // Anomaly detection
  'agent.anomaly.detected': (event) => {
    const confidence = event.data?.confidence || 0.5;
    const impact = event.data?.impact || 'medium';
    
    if (impact === 'critical' || confidence > 0.95) return 'critical';
    if (impact === 'high' || confidence > 0.85) return 'high';
    if (confidence > 0.7) return 'medium';
    return 'low';
  },

  // Recommendations
  'agent.recommendation': (event) => {
    const impact = event.data?.impact || 'medium';
    const urgency = event.data?.urgency || 'normal';
    
    if (impact === 'critical' || urgency === 'immediate') return 'critical';
    if (impact === 'high' || urgency === 'urgent') return 'high';
    if (impact === 'medium') return 'medium';
    return 'low';
  },

  // Demand spikes/drops
  'demand.spike.detected': (event) => {
    const deviationPct = Math.abs(event.data?.deviation_pct || 0);
    if (deviationPct > 500) return 'critical';
    if (deviationPct > 200) return 'high';
    if (deviationPct > 100) return 'medium';
    return 'low';
  },

  'demand.drop.detected': (event) => {
    const deviationPct = Math.abs(event.data?.deviation_pct || 0);
    if (deviationPct > 500) return 'critical';
    if (deviationPct > 200) return 'high';
    if (deviationPct > 100) return 'medium';
    return 'low';
  },

  // Inventory alerts
  'inventory.stockout.warning': (event) => {
    const daysToStockout = event.data?.days_to_stockout || 999;
    const impactRevenue = event.data?.impact_revenue || 0;
    
    if (daysToStockout <= 1 || impactRevenue > 100000) return 'critical';
    if (daysToStockout <= 3 || impactRevenue > 50000) return 'high';
    if (daysToStockout <= 7) return 'medium';
    return 'low';
  },

  'inventory.critical': () => 'critical',
  'inventory_critical': () => 'critical',

  // Pricing alerts
  'pricing.anomaly.detected': (event) => {
    const priceChangePct = Math.abs(event.data?.price_change_pct || 0);
    const competitorCount = event.data?.competitor_count || 0;
    
    if (priceChangePct > 50 || competitorCount > 5) return 'critical';
    if (priceChangePct > 25 || competitorCount > 3) return 'high';
    if (priceChangePct > 10) return 'medium';
    return 'low';
  },

  // Campaign alerts
  'campaign.performance.alert': (event) => {
    const performanceVsTarget = event.data?.performance_vs_target || 100;
    const daysRemaining = event.data?.days_remaining || 999;
    
    if (performanceVsTarget < 50 && daysRemaining < 3) return 'critical';
    if (performanceVsTarget < 70 && daysRemaining < 7) return 'high';
    if (performanceVsTarget < 85) return 'medium';
    return 'low';
  },

  // Simulation events
  'simulation_completed': (event) => {
    const confidence = event.data?.simulation_result?.confidence_score || 0.8;
    if (confidence < 0.5) return 'high';
    if (confidence < 0.7) return 'medium';
    return 'low';
  },

  'inventory_low': () => 'high',
  'demand_spike': () => 'high',
  'demand_drop': () => 'high',
  'price_war': () => 'high',
  'supply_disruption': () => 'critical',
  'budget_shock': () => 'high',
};

/**
 * Complete alert configuration
 */
export const AGENT_ALERT_CONFIG = {
  streams: ALERT_STREAMS,
  alertTypes: ALERT_EVENT_TYPES,
  severityRules: SEVERITY_RULES,
  tenantId: process.env.DEFAULT_TENANT_ID || 'default-tenant',
  consumerGroup: 'ui-alert-bridge',
  enabled: process.env.ALERT_BRIDGE_ENABLED !== 'false',
};

/**
 * Example alert event format for agents to follow
 */
export const ALERT_EVENT_TEMPLATE = {
  // CloudEvents headers
  specversion: '1.0',
  id: 'uuid-v4',
  type: 'agent.alert.anomaly_detected',
  source: 'urn:agent:demand-forecast',
  subject: 'SKU-12345',
  time: '2025-10-30T20:30:00Z',
  dataschema: 'https://schemas.mesh/Alert.json',
  
  // Alert data payload
  data: {
    '@context': {
      'alert': 'ex:Alert',
      'severity': 'ex:Severity',
      'recommendation': 'ex:Recommendation'
    },
    
    // Core alert fields
    title: 'Demand Spike Detected',
    message: 'Demand for SKU-12345 increased by 300% in the last hour',
    severity: 'high',                    // optional, will be calculated if missing
    confidence: 0.92,
    impact: 'high',                      // critical | high | medium | low
    urgency: 'urgent',                   // immediate | urgent | normal
    
    // Recommendations
    recommendations: [
      'Increase inventory allocation by 50%',
      'Alert supply chain team',
      'Review pricing strategy'
    ],
    
    // Supporting metrics
    metrics: {
      current_demand: 1500,
      expected_demand: 500,
      deviation_pct: 300,
      confidence_interval: [400, 600]
    },
    
    // Additional context
    metadata: {
      agent_version: '1.0.0',
      model_version: 'forecast-v2',
      data_sources: ['sales_history', 'market_data'],
      timestamp: '2025-10-30T20:30:00Z'
    }
  }
};
