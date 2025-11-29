export interface ProgrammaticAdvertisingKnowledgeGraph {
  // Core Entities
  retailMediaNetworks: RetailMediaNetwork[];
  campaigns: Campaign[];
  audiences: Audience[];
  creatives: Creative[];
  budgets: Budget[];
  performance: PerformanceMetric[];
  
  // Relationships
  networkCampaignMappings: NetworkCampaignMapping[];
  audienceSegmentations: AudienceSegmentation[];
  budgetAllocations: BudgetAllocation[];
}

export interface RetailMediaNetwork {
  id: string;
  name: string; // Amazon DSP, Walmart Connect, Target Roundel, etc.
  type: 'search' | 'display' | 'video' | 'sponsored_products' | 'offsite';
  apiEndpoint?: string;
  capabilities: NetworkCapability[];
  costStructure: CostStructure;
  audienceTargeting: TargetingCapability[];
  minimumSpend: number;
  currency: string;
  geoAvailability: string[];
  dataPartners: string[];
}

export interface Campaign {
  id: string;
  name: string;
  networkId: string;
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention';
  status: 'draft' | 'pending_approval' | 'active' | 'paused' | 'completed';
  budget: Budget;
  targeting: TargetingCriteria;
  creatives: string[]; // Creative IDs
  flightDates: {
    start: Date;
    end: Date;
  };
  kpis: KPITarget[];
  approvalWorkflow: ApprovalWorkflow;
}

export interface Audience {
  id: string;
  name: string;
  type: 'first_party' | 'third_party' | 'lookalike' | 'behavioral' | 'contextual';
  size: number;
  demographics: Demographics;
  interests: string[];
  purchaseBehavior: PurchaseBehavior;
  dataSource: string;
  refreshFrequency: 'daily' | 'weekly' | 'monthly';
  complianceStatus: 'gdpr_compliant' | 'ccpa_compliant' | 'pending_review';
}

export interface Creative {
  id: string;
  name: string;
  format: 'banner' | 'video' | 'native' | 'audio' | 'rich_media';
  dimensions: { width: number; height: number };
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number; // for video/audio
  callToAction: string;
  brandSafety: BrandSafetyRating;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  complianceChecks: ComplianceCheck[];
}

export interface Budget {
  id: string;
  totalBudget: number;
  dailyBudget?: number;
  currency: string;
  pacing: 'even' | 'accelerated' | 'front_loaded' | 'back_loaded';
  bidStrategy: 'cpc' | 'cpm' | 'cpa' | 'roas' | 'vcpm';
  maxBid?: number;
  spendToDate: number;
  remainingBudget: number;
}

export interface PerformanceMetric {
  campaignId: string;
  date: Date;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue?: number;
  ctr: number;
  cpc: number;
  cpa?: number;
  roas?: number;
  viewability?: number;
  brandSafetyScore?: number;
}

// Supporting Types
export interface NetworkCapability {
  type: string;
  description: string;
  available: boolean;
  betaAccess?: boolean;
}

export interface CostStructure {
  model: 'auction' | 'fixed_rate' | 'hybrid';
  minimumCPM?: number;
  platformFee: number;
  dataFee?: number;
}

export interface TargetingCapability {
  type: 'demographic' | 'behavioral' | 'contextual' | 'geographic' | 'temporal';
  granularity: 'basic' | 'advanced' | 'premium';
  dataFreshness: string;
}

export interface TargetingCriteria {
  demographics: Demographics;
  geography: GeographicTarget;
  interests: string[];
  behaviors: string[];
  contextual: ContextualTarget[];
  deviceTypes: string[];
  dayParting: DayPartingSchedule[];
}

export interface Demographics {
  ageRanges: string[];
  genders: string[];
  incomeRanges: string[];
  education: string[];
  parentalStatus: string[];
}

export interface GeographicTarget {
  countries: string[];
  regions: string[];
  cities: string[];
  postalCodes: string[];
  radius?: { lat: number; lng: number; miles: number };
}

export interface ContextualTarget {
  categories: string[];
  keywords: string[];
  urls: string[];
  excludedCategories: string[];
}

export interface DayPartingSchedule {
  dayOfWeek: number; // 0-6
  startHour: number; // 0-23
  endHour: number;
  bidModifier?: number;
}

export interface PurchaseBehavior {
  categories: string[];
  brands: string[];
  priceRanges: string[];
  frequency: 'frequent' | 'occasional' | 'rare';
  recency: 'last_7_days' | 'last_30_days' | 'last_90_days';
}

export interface BrandSafetyRating {
  overall: 'high' | 'medium' | 'low';
  categories: {
    adult: boolean;
    violence: boolean;
    illegal: boolean;
    controversial: boolean;
  };
  verification: 'ias' | 'moat' | 'doubleVerify' | 'internal';
}

export interface ComplianceCheck {
  type: 'legal_review' | 'brand_guidelines' | 'platform_policy' | 'accessibility';
  status: 'passed' | 'failed' | 'pending';
  notes?: string;
  reviewer?: string;
  timestamp: Date;
}

export interface KPITarget {
  metric: 'ctr' | 'cpc' | 'cpa' | 'roas' | 'impressions' | 'conversions';
  target: number;
  tolerance: number; // percentage
}

export interface ApprovalWorkflow {
  requiredApprovers: string[];
  currentStep: number;
  approvalHistory: ApprovalStep[];
  escalationRules: EscalationRule[];
}

export interface ApprovalStep {
  stepNumber: number;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: Date;
  comments?: string;
}

export interface EscalationRule {
  condition: 'budget_threshold' | 'time_delay' | 'rejection';
  threshold: number;
  escalateTo: string[];
}

// Relationship Types
export interface NetworkCampaignMapping {
  networkId: string;
  campaignId: string;
  externalCampaignId: string;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSync: Date;
}

export interface AudienceSegmentation {
  audienceId: string;
  segments: {
    name: string;
    criteria: any;
    size: number;
  }[];
}

export interface BudgetAllocation {
  budgetId: string;
  networkAllocations: {
    networkId: string;
    percentage: number;
    amount: number;
  }[];
}
