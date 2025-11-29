// Mock data for Decision Stack

export const mockCommonTerms = [
  { id: 'ct-1', name: 'ROAS', definition: 'Return on Ad Spend', formula: 'Revenue / Ad Spend', owner: 'Marketing', category: 'KPI', dataSource: 'metrics.csv', sourceConnected: true },
  { id: 'ct-2', name: 'CAC', definition: 'Customer Acquisition Cost', formula: 'Spend / New Customers', owner: 'Finance', category: 'KPI', dataSource: null, sourceConnected: false },
  { id: 'ct-3', name: 'LTV', definition: 'Lifetime Value', formula: 'Avg Value × Frequency × Lifespan', owner: 'Finance', category: 'KPI', dataSource: 'DB: analytics', sourceConnected: true },
];

export const mockEventPatterns = [
  { id: 'ep-1', name: 'Prime Day Spike', description: 'Traffic surge', dataSource: 'API: Amazon', triggerCondition: 'Impressions > 2x', threshold: '200%', alertLevel: 'high' as const, sourceConnected: true },
  { id: 'ep-2', name: 'Post-Promo Dip', description: 'Sales decline', dataSource: 'DB: sales', triggerCondition: 'Sales < 70%', threshold: '70%', alertLevel: 'medium' as const, sourceConnected: true },
  { id: 'ep-3', name: 'Inventory Alert', description: 'Low stock', dataSource: null, triggerCondition: 'Units < Safety', threshold: 'Variable', alertLevel: 'high' as const, sourceConnected: false },
];

export const mockTunedModels = [
  { id: 'tm-1', name: 'Budget Allocation', type: 'Optimization', accuracy: 0.87, lastTrained: '2025-10-10', dataset: 'campaigns.csv', datasetConnected: true, status: 'active' as const },
  { id: 'tm-2', name: 'Incrementality', type: 'Regression', accuracy: 0.82, lastTrained: '2025-10-08', dataset: 'DB: tests', datasetConnected: true, status: 'active' as const },
  { id: 'tm-3', name: 'Demand Forecast', type: 'Time Series', accuracy: 0.91, lastTrained: '2025-10-15', dataset: null, datasetConnected: false, status: 'training' as const },
];
