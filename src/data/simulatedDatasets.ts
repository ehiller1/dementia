/**
 * Simulated Datasets for Contextual Retrieval Testing
 * 
 * These datasets provide realistic business scenarios for testing
 * the contextual retrieval system across different memory types.
 */

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'technical' | 'operational' | 'strategic';
  memoryType: 'working' | 'short-term' | 'long-term';
  recordCount: number;
  tags: string[];
  createdAt: string;
  lastUpdated: string;
  status: 'active' | 'archived' | 'draft';
}

export const simulatedDatasets: Dataset[] = [
  // Working Memory Datasets
  {
    id: 'ds-working-001',
    name: 'Executive Dashboard Review',
    description: 'Current Q1 performance analysis with active metrics and focus areas for executive decision-making',
    category: 'business',
    memoryType: 'working',
    recordCount: 3,
    tags: ['dashboard', 'executive', 'q1', 'performance', 'real-time'],
    createdAt: '2025-10-25T10:00:00Z',
    lastUpdated: '2025-10-25T14:30:00Z',
    status: 'active'
  },
  {
    id: 'ds-working-002',
    name: 'Critical Inventory Alerts',
    description: 'Real-time inventory alerts for SKUs below reorder points requiring immediate action',
    category: 'operational',
    memoryType: 'working',
    recordCount: 3,
    tags: ['inventory', 'alert', 'critical', 'reorder', 'supply-chain'],
    createdAt: '2025-10-25T09:15:00Z',
    lastUpdated: '2025-10-25T14:45:00Z',
    status: 'active'
  },
  {
    id: 'ds-working-003',
    name: 'Active Pricing Strategy Discussion',
    description: 'Ongoing conversation thread about competitive pricing response and margin analysis',
    category: 'business',
    memoryType: 'working',
    recordCount: 1,
    tags: ['pricing', 'strategy', 'competition', 'discussion', 'active'],
    createdAt: '2025-10-25T11:30:00Z',
    lastUpdated: '2025-10-25T14:20:00Z',
    status: 'active'
  },

  // Short-term Memory Datasets
  {
    id: 'ds-shortterm-001',
    name: 'Q4 Marketing Budget Decisions',
    description: 'Recent decision to reallocate 30% of traditional advertising to digital channels with ROI analysis',
    category: 'business',
    memoryType: 'short-term',
    recordCount: 1,
    tags: ['marketing', 'budget', 'digital', 'reallocation', 'decision'],
    createdAt: '2025-10-20T08:00:00Z',
    lastUpdated: '2025-10-23T16:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-shortterm-002',
    name: 'Holiday Season Demand Forecast',
    description: 'Seasonal demand forecast model results predicting 45% increase with inventory recommendations',
    category: 'operational',
    memoryType: 'short-term',
    recordCount: 1,
    tags: ['forecasting', 'holiday', 'demand', 'template', 'prediction'],
    createdAt: '2025-10-18T10:00:00Z',
    lastUpdated: '2025-10-22T14:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-shortterm-003',
    name: 'Product Launch Sentiment Analysis',
    description: 'Customer sentiment analysis for New Product Line Alpha with key themes and recommendations',
    category: 'business',
    memoryType: 'short-term',
    recordCount: 1,
    tags: ['sentiment', 'product-launch', 'customer', 'analysis', 'feedback'],
    createdAt: '2025-10-15T12:00:00Z',
    lastUpdated: '2025-10-20T10:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-shortterm-004',
    name: 'Supply Chain Optimization Results',
    description: 'Route optimization project results showing 18% cost reduction and delivery improvements',
    category: 'operational',
    memoryType: 'short-term',
    recordCount: 1,
    tags: ['supply-chain', 'optimization', 'logistics', 'results', 'efficiency'],
    createdAt: '2025-10-12T09:00:00Z',
    lastUpdated: '2025-10-19T15:00:00Z',
    status: 'active'
  },

  // Long-term Memory Datasets
  {
    id: 'ds-longterm-001',
    name: 'Market Expansion Decision Framework',
    description: 'Systematic framework for evaluating market entry with criteria, success patterns, and historical performance',
    category: 'strategic',
    memoryType: 'long-term',
    recordCount: 1,
    tags: ['strategy', 'expansion', 'framework', 'market-entry', 'institutional'],
    createdAt: '2024-06-15T10:00:00Z',
    lastUpdated: '2025-09-30T14:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-longterm-002',
    name: 'Crisis Management Playbook',
    description: 'Supply chain crisis response protocols with trigger conditions and lessons learned from past events',
    category: 'operational',
    memoryType: 'long-term',
    recordCount: 1,
    tags: ['crisis-management', 'supply-chain', 'playbook', 'institutional', 'risk'],
    createdAt: '2023-03-20T08:00:00Z',
    lastUpdated: '2025-08-15T12:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-longterm-003',
    name: 'Customer Behavior Patterns (5-Year)',
    description: 'Comprehensive 5-year analysis of customer behavior patterns with predictive indicators and strategic implications',
    category: 'business',
    memoryType: 'long-term',
    recordCount: 1,
    tags: ['customer-behavior', 'patterns', 'analysis', 'strategic', 'predictive'],
    createdAt: '2024-01-10T10:00:00Z',
    lastUpdated: '2025-10-01T16:00:00Z',
    status: 'active'
  },
  {
    id: 'ds-longterm-004',
    name: 'Digital Transformation Lessons',
    description: 'Enterprise-wide digitalization initiative outcomes, success factors, and failure points from 2022-2024',
    category: 'strategic',
    memoryType: 'long-term',
    recordCount: 1,
    tags: ['digital-transformation', 'organizational-learning', 'change-management', 'lessons'],
    createdAt: '2024-12-01T09:00:00Z',
    lastUpdated: '2025-09-15T14:00:00Z',
    status: 'active'
  },

  // Seasonality Knowledge Dataset
  {
    id: 'ds-knowledge-001',
    name: 'Seasonality Analysis Knowledge Base',
    description: 'Comprehensive knowledge base covering STL decomposition, pattern detection, forecasting methods, and troubleshooting',
    category: 'technical',
    memoryType: 'long-term',
    recordCount: 5,
    tags: ['seasonality', 'forecasting', 'stl-decomposition', 'analysis', 'knowledge-base'],
    createdAt: '2025-01-15T10:00:00Z',
    lastUpdated: '2025-10-20T12:00:00Z',
    status: 'active'
  }
];

/**
 * Get datasets by memory type
 */
export function getDatasetsByMemoryType(memoryType: 'working' | 'short-term' | 'long-term'): Dataset[] {
  return simulatedDatasets.filter(ds => ds.memoryType === memoryType);
}

/**
 * Get datasets by category
 */
export function getDatasetsByCategory(category: Dataset['category']): Dataset[] {
  return simulatedDatasets.filter(ds => ds.category === category);
}

/**
 * Get dataset by ID
 */
export function getDatasetById(id: string): Dataset | undefined {
  return simulatedDatasets.find(ds => ds.id === id);
}

/**
 * Get dataset statistics
 */
export function getDatasetStatistics() {
  return {
    total: simulatedDatasets.length,
    byMemoryType: {
      working: getDatasetsByMemoryType('working').length,
      'short-term': getDatasetsByMemoryType('short-term').length,
      'long-term': getDatasetsByMemoryType('long-term').length
    },
    byCategory: {
      business: getDatasetsByCategory('business').length,
      technical: getDatasetsByCategory('technical').length,
      operational: getDatasetsByCategory('operational').length,
      strategic: getDatasetsByCategory('strategic').length
    },
    byStatus: {
      active: simulatedDatasets.filter(ds => ds.status === 'active').length,
      archived: simulatedDatasets.filter(ds => ds.status === 'archived').length,
      draft: simulatedDatasets.filter(ds => ds.status === 'draft').length
    },
    totalRecords: simulatedDatasets.reduce((sum, ds) => sum + ds.recordCount, 0)
  };
}

/**
 * Search datasets by query
 */
export function searchDatasets(query: string): Dataset[] {
  const lowerQuery = query.toLowerCase();
  return simulatedDatasets.filter(ds => 
    ds.name.toLowerCase().includes(lowerQuery) ||
    ds.description.toLowerCase().includes(lowerQuery) ||
    ds.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
