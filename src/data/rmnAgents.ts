/**
 * RMN Agents and Crews Registry
 * Business-focused retail media network agents
 */

export interface RMNAgent {
  id: string;
  name: string;
  crew: string;
  skills: string[];
  status: 'idle' | 'running' | 'paused' | 'completed';
  confidence?: number;
  description: string;
}

export interface RMNCrew {
  id: string;
  name: string;
  retailer: string;
  manager: string;
  workers: string[];
  description: string;
  capabilities: string[];
}

// RMN Crews from registry
export const RMN_CREWS: RMNCrew[] = [
  {
    id: 'amazon-rmn',
    name: 'Amazon RMN Crew',
    retailer: 'Amazon',
    manager: 'amazon-rmn-manager',
    workers: ['catalog-sync', 'audience-sync', 'portfolio-optimizer', 'attribution'],
    description: 'Amazon Retail Media Network optimization (300M+ customers, AMC analytics)',
    capabilities: ['ASIN mapping', 'Prime targeting', 'Sponsored Products/Brands/Display', 'DSP', 'AMC attribution']
  },
  {
    id: 'walmart-rmn',
    name: 'Walmart Connect Crew',
    retailer: 'Walmart',
    manager: 'walmart-rmn-manager',
    workers: ['catalog-sync', 'audience-sync', 'portfolio-optimizer', 'attribution'],
    description: 'Walmart Connect optimization (omnichannel, 30-day attribution)',
    capabilities: ['Item ID/UPC mapping', 'Walmart+ targeting', 'BOPIS', 'Omnichannel attribution']
  },
  {
    id: 'target-rmn',
    name: 'Target Roundel Crew',
    retailer: 'Target',
    manager: 'target-rmn-manager',
    workers: ['catalog-sync', 'audience-sync', 'portfolio-optimizer', 'attribution'],
    description: 'Target Roundel optimization (RedCard/Circle loyalty)',
    capabilities: ['TCIN/DPCI mapping', 'RedCard targeting', 'Circle rewards', 'Drive Up/Shipt']
  },
  {
    id: 'instacart-rmn',
    name: 'Instacart Ads Crew',
    retailer: 'Instacart',
    manager: 'instacart-rmn-manager',
    workers: ['catalog-sync', 'audience-sync', 'portfolio-optimizer', 'attribution'],
    description: 'Instacart Ads optimization (multi-retailer, rapid delivery)',
    capabilities: ['Multi-retailer catalog', 'Rapid delivery targeting', '1-2 hour fulfillment', '7-day attribution']
  }
];

// RMN Agents from registry
export const RMN_AGENTS: RMNAgent[] = [
  // Amazon RMN Crew
  {
    id: 'amazon-catalog-sync',
    name: 'Amazon Catalog Sync',
    crew: 'amazon-rmn',
    skills: ['ASIN_mapping', 'brand_registry', 'feed_optimization'],
    status: 'idle',
    description: 'Syncs product catalogs to Amazon with ASIN mapping and feed optimization'
  },
  {
    id: 'amazon-audience-sync',
    name: 'Amazon Audience Sync',
    crew: 'amazon-rmn',
    skills: ['AMC_audiences', 'prime_targeting', 'in_market_segments'],
    status: 'running',
    confidence: 92,
    description: 'Translates audience segments to Amazon-specific targeting (AMC, Prime, in-market)'
  },
  {
    id: 'amazon-portfolio-optimizer',
    name: 'Amazon Portfolio Optimizer',
    crew: 'amazon-rmn',
    skills: ['sponsored_products', 'sponsored_brands', 'sponsored_display', 'DSP'],
    status: 'running',
    confidence: 88,
    description: 'Optimizes budget allocation across Amazon ad products for maximum ROAS'
  },
  {
    id: 'amazon-attribution',
    name: 'Amazon Attribution Worker',
    crew: 'amazon-rmn',
    skills: ['14_day_click', '1_day_view', 'AMC_multi_touch', 'incrementality'],
    status: 'idle',
    description: 'Measures incremental lift and attribution for Amazon campaigns'
  },
  
  // Walmart Connect Crew
  {
    id: 'walmart-catalog-sync',
    name: 'Walmart Catalog Sync',
    crew: 'walmart-rmn',
    skills: ['item_id_mapping', 'UPC_mapping', 'feed_optimization'],
    status: 'idle',
    description: 'Syncs product catalogs to Walmart with Item ID/UPC mapping'
  },
  {
    id: 'walmart-audience-sync',
    name: 'Walmart Audience Sync',
    crew: 'walmart-rmn',
    skills: ['walmart_plus', 'BOPIS', 'omnichannel_targeting'],
    status: 'idle',
    description: 'Translates audience segments to Walmart+ and BOPIS targeting'
  },
  {
    id: 'walmart-portfolio-optimizer',
    name: 'Walmart Portfolio Optimizer',
    crew: 'walmart-rmn',
    skills: ['search_ads', 'display_ads', 'sponsored_products'],
    status: 'paused',
    description: 'Optimizes budget allocation across Walmart Connect ad products'
  },
  {
    id: 'walmart-attribution',
    name: 'Walmart Attribution Worker',
    crew: 'walmart-rmn',
    skills: ['30_day_click', 'omnichannel_attribution', 'incrementality'],
    status: 'idle',
    description: 'Measures incremental lift with 30-day attribution window'
  },
  
  // Target Roundel Crew
  {
    id: 'target-catalog-sync',
    name: 'Target Catalog Sync',
    crew: 'target-rmn',
    skills: ['TCIN_mapping', 'DPCI_mapping', 'feed_optimization'],
    status: 'idle',
    description: 'Syncs product catalogs to Target with TCIN/DPCI mapping'
  },
  {
    id: 'target-audience-sync',
    name: 'Target Audience Sync',
    crew: 'target-rmn',
    skills: ['redcard_targeting', 'circle_rewards', 'drive_up'],
    status: 'running',
    confidence: 85,
    description: 'Translates audience segments to RedCard and Circle targeting'
  },
  {
    id: 'target-portfolio-optimizer',
    name: 'Target Portfolio Optimizer',
    crew: 'target-rmn',
    skills: ['sponsored_products', 'display_ads', 'roundel_premium'],
    status: 'idle',
    description: 'Optimizes budget allocation across Target Roundel ad products'
  },
  {
    id: 'target-attribution',
    name: 'Target Attribution Worker',
    crew: 'target-rmn',
    skills: ['multi_channel', 'drive_up_attribution', 'incrementality'],
    status: 'idle',
    description: 'Measures incremental lift across Target channels'
  },
  
  // Instacart Ads Crew
  {
    id: 'instacart-catalog-sync',
    name: 'Instacart Catalog Sync',
    crew: 'instacart-rmn',
    skills: ['multi_retailer', 'catalog_mapping', 'feed_optimization'],
    status: 'idle',
    description: 'Syncs catalogs across multiple retailers (Costco, Kroger, Albertsons)'
  },
  {
    id: 'instacart-audience-sync',
    name: 'Instacart Audience Sync',
    crew: 'instacart-rmn',
    skills: ['rapid_delivery', '1_2_hour_targeting', 'multi_retailer_segments'],
    status: 'running',
    confidence: 90,
    description: 'Translates audience segments for rapid delivery targeting'
  },
  {
    id: 'instacart-portfolio-optimizer',
    name: 'Instacart Portfolio Optimizer',
    crew: 'instacart-rmn',
    skills: ['featured_products', 'shoppable_ads', 'sponsored_products'],
    status: 'idle',
    description: 'Optimizes budget allocation across Instacart ad products'
  },
  {
    id: 'instacart-attribution',
    name: 'Instacart Attribution Worker',
    crew: 'instacart-rmn',
    skills: ['7_day_click', 'rapid_delivery_attribution', 'incrementality'],
    status: 'idle',
    description: 'Measures incremental lift with 7-day attribution window'
  }
];

// Platform Agents (Google, Meta, TikTok, LinkedIn, Pinterest, Snapchat)
export const PLATFORM_AGENTS: RMNAgent[] = [
  {
    id: 'google-ads-agent',
    name: 'Google Ads Specialist',
    crew: 'platform',
    skills: ['search_ads', 'display_ads', 'youtube_video', 'shopping_ads', 'performance_max'],
    status: 'running',
    confidence: 94,
    description: 'Optimizes Google Ads campaigns across Search, Display, Video, and Shopping'
  },
  {
    id: 'meta-ads-agent',
    name: 'Meta Ads Specialist',
    crew: 'platform',
    skills: ['facebook_ads', 'instagram_ads', 'messenger_ads', 'advantage_plus'],
    status: 'running',
    confidence: 91,
    description: 'Optimizes Meta advertising across Facebook, Instagram, and Messenger'
  },
  {
    id: 'tiktok-ads-agent',
    name: 'TikTok Ads Specialist',
    crew: 'platform',
    skills: ['in_feed_ads', 'topview', 'branded_hashtags', 'spark_ads'],
    status: 'idle',
    description: 'Optimizes TikTok campaigns for Gen Z and Millennial audiences'
  },
  {
    id: 'linkedin-ads-agent',
    name: 'LinkedIn Ads Specialist',
    crew: 'platform',
    skills: ['sponsored_content', 'lead_gen_forms', 'InMail', 'B2B_targeting'],
    status: 'idle',
    description: 'Optimizes LinkedIn campaigns for B2B audiences and lead generation'
  }
];

// Business focus areas (replacing church groups)
export const BUSINESS_GROUPS = [
  { id: 'analytics', name: 'Analytics', icon: 'BarChart' },
  { id: 'campaigns', name: 'Campaigns', icon: 'Target' },
  { id: 'optimization', name: 'Optimization', icon: 'TrendingUp' },
  { id: 'attribution', name: 'Attribution', icon: 'GitBranch' },
  { id: 'audiences', name: 'Audiences', icon: 'Users' },
  { id: 'creative', name: 'Creative', icon: 'Palette' },
  { id: 'reporting', name: 'Reporting', icon: 'FileText' },
  { id: 'strategy', name: 'Strategy', icon: 'Lightbulb' }
];

// Business modules (replacing church modules)
export const BUSINESS_MODULES = [
  { id: 'rmn-core', name: 'RMN Core Platform', group: 'analytics', type: 'Platform' },
  { id: 'amazon-ads', name: 'Amazon Advertising', group: 'campaigns', type: 'RMN Pack' },
  { id: 'walmart-connect', name: 'Walmart Connect', group: 'campaigns', type: 'RMN Pack' },
  { id: 'target-roundel', name: 'Target Roundel', group: 'campaigns', type: 'RMN Pack' },
  { id: 'instacart-ads', name: 'Instacart Ads', group: 'campaigns', type: 'RMN Pack' },
  { id: 'attribution-suite', name: 'Attribution & Incrementality', group: 'attribution', type: 'Analytics Pack' },
  { id: 'audience-sync', name: 'Audience Synchronization', group: 'audiences', type: 'Operational Pack' },
  { id: 'catalog-mgmt', name: 'Catalog Management', group: 'optimization', type: 'Operational Pack' },
  { id: 'portfolio-optimizer', name: 'Portfolio Optimizer', group: 'optimization', type: 'Analytics Pack' },
  { id: 'creative-studio', name: 'Creative Studio', group: 'creative', type: 'Operational Pack' },
  { id: 'performance-dashboard', name: 'Performance Dashboard', group: 'reporting', type: 'Analytics Pack' },
  { id: 'strategy-planner', name: 'Strategy Planner', group: 'strategy', type: 'Planning Pack' }
];
