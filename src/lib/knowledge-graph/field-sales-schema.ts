export interface FieldSalesKnowledgeGraph {
  // Core Entities
  salesTeams: SalesTeam[];
  salesReps: SalesRep[];
  territories: Territory[];
  accounts: Account[];
  opportunities: Opportunity[];
  activities: SalesActivity[];
  quotas: SalesQuota[];
  compensation: CompensationPlan[];
  
  // Relationships
  territoryAssignments: TerritoryAssignment[];
  accountMappings: AccountMapping[];
  teamHierarchies: TeamHierarchy[];
  performanceMetrics: PerformanceMetric[];
}

export interface SalesTeam {
  id: string;
  name: string;
  region: string;
  manager: string;
  members: string[]; // SalesRep IDs
  teamType: 'inside_sales' | 'field_sales' | 'key_account' | 'channel_partner';
  focusAreas: string[];
  quotaTarget: number;
  currentQuotaAttainment: number;
  approvalLimits: ApprovalLimit[];
  meetingCadence: MeetingCadence;
}

export interface SalesRep {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  teamId: string;
  managerId: string;
  role: 'bdr' | 'sdr' | 'ae' | 'senior_ae' | 'key_account_manager' | 'channel_manager';
  hireDate: Date;
  experience: ExperienceLevel;
  skills: Skill[];
  certifications: Certification[];
  territories: string[]; // Territory IDs
  quotaTarget: number;
  currentQuotaAttainment: number;
  compensationPlan: string;
  approvalLimits: ApprovalLimit[];
  travelRequirements: TravelRequirement;
  workLocation: WorkLocation;
}

export interface Territory {
  id: string;
  name: string;
  type: 'geographic' | 'vertical' | 'named_accounts' | 'channel';
  boundaries: TerritoryBoundary;
  accountCount: number;
  totalRevenuePotential: number;
  assignedReps: string[]; // SalesRep IDs
  coverageModel: 'single_rep' | 'team_based' | 'overlay';
  quotaAllocation: number;
  travelRequirements: string;
  competitiveIntensity: 'low' | 'medium' | 'high';
}

export interface Account {
  id: string;
  name: string;
  type: 'prospect' | 'customer' | 'partner' | 'competitor';
  industry: string;
  size: 'smb' | 'mid_market' | 'enterprise' | 'strategic';
  revenue: number;
  employeeCount: number;
  location: Location;
  assignedRep: string;
  accountManager: string;
  relationship: RelationshipStatus;
  healthScore: number;
  lastActivity: Date;
  nextActivity: Date;
  contracts: Contract[];
  stakeholders: Stakeholder[];
  competitorPresence: CompetitorInfo[];
  approvalWorkflow: ApprovalWorkflow;
}

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  assignedRep: string;
  stage: OpportunityStage;
  value: number;
  probability: number;
  closeDate: Date;
  source: 'inbound' | 'outbound' | 'referral' | 'partner' | 'marketing';
  products: ProductInterest[];
  competitors: string[];
  decisionMakers: string[];
  nextSteps: string;
  riskFactors: RiskFactor[];
  approvalRequired: boolean;
  approvalWorkflow?: ApprovalWorkflow;
}

export interface SalesActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'contract_review' | 'travel';
  repId: string;
  accountId?: string;
  opportunityId?: string;
  date: Date;
  duration: number; // minutes
  outcome: 'completed' | 'no_show' | 'rescheduled' | 'cancelled';
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  location?: Location;
  attendees: string[];
  expenses?: Expense[];
}

export interface SalesQuota {
  id: string;
  repId?: string;
  teamId?: string;
  period: 'monthly' | 'quarterly' | 'annual';
  startDate: Date;
  endDate: Date;
  quotaAmount: number;
  quotaType: 'revenue' | 'units' | 'activities' | 'new_accounts';
  currentAttainment: number;
  attainmentPercentage: number;
  forecastAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CompensationPlan {
  id: string;
  name: string;
  baseSalary: number;
  commissionStructure: CommissionTier[];
  bonusTargets: BonusTarget[];
  spiffs: Spiff[];
  drawStructure?: DrawStructure;
  accelerators: Accelerator[];
  caps?: CompensationCap[];
}

// Supporting Types
export interface ApprovalLimit {
  type: 'discount' | 'deal_size' | 'contract_terms' | 'expense' | 'territory_change';
  threshold: number;
  currency?: string;
  approverRole: string;
  escalationPath: string[];
}

export interface MeetingCadence {
  oneOnOnes: 'weekly' | 'biweekly' | 'monthly';
  teamMeetings: 'weekly' | 'biweekly' | 'monthly';
  forecastReviews: 'weekly' | 'monthly' | 'quarterly';
  qbrs: 'quarterly' | 'biannual' | 'annual';
}

export interface ExperienceLevel {
  yearsInSales: number;
  yearsInIndustry: number;
  yearsWithCompany: number;
  previousRoles: string[];
  performanceRating: 'exceeds' | 'meets' | 'below' | 'new_hire';
}

export interface Skill {
  name: string;
  category: 'technical' | 'sales' | 'industry' | 'soft_skills';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lastAssessed: Date;
  certificationRequired: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  dateEarned: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'pending_renewal';
}

export interface TravelRequirement {
  percentage: number; // 0-100
  maxDaysPerMonth: number;
  preferredRadius: number; // miles
  overnightTravel: boolean;
  internationalTravel: boolean;
}

export interface WorkLocation {
  type: 'remote' | 'hybrid' | 'office_based' | 'field_based';
  homeOffice?: Location;
  assignedOffice?: Location;
  flexibilityLevel: 'high' | 'medium' | 'low';
}

export interface TerritoryBoundary {
  geographic?: {
    states: string[];
    cities: string[];
    postalCodes: string[];
    radius?: { lat: number; lng: number; miles: number };
  };
  vertical?: {
    industries: string[];
    companySize: string[];
    revenue: { min: number; max: number };
  };
  namedAccounts?: string[];
  channels?: string[];
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: { lat: number; lng: number };
}

export interface RelationshipStatus {
  level: 'cold' | 'warm' | 'hot' | 'champion' | 'detractor';
  lastInteraction: Date;
  interactionFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  satisfactionScore: number;
  npsScore?: number;
}

export interface Contract {
  id: string;
  type: 'msa' | 'sow' | 'subscription' | 'one_time';
  value: number;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  status: 'active' | 'expired' | 'pending_renewal' | 'cancelled';
  autoRenewal: boolean;
}

export interface Stakeholder {
  name: string;
  title: string;
  role: 'decision_maker' | 'influencer' | 'user' | 'gatekeeper' | 'champion';
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
  };
  relationshipLevel: 'strong' | 'moderate' | 'weak' | 'unknown';
  lastContact: Date;
}

export interface CompetitorInfo {
  name: string;
  products: string[];
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  pricing: 'higher' | 'similar' | 'lower' | 'unknown';
}

export interface OpportunityStage {
  name: string;
  probability: number;
  requiredActivities: string[];
  exitCriteria: string[];
  averageDuration: number; // days
}

export interface ProductInterest {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  priority: 'high' | 'medium' | 'low';
}

export interface RiskFactor {
  type: 'budget' | 'timeline' | 'competition' | 'decision_maker' | 'technical';
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
}

export interface Expense {
  type: 'travel' | 'meals' | 'entertainment' | 'materials' | 'other';
  amount: number;
  currency: string;
  date: Date;
  description: string;
  receiptUrl?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface CommissionTier {
  threshold: number;
  rate: number;
  type: 'flat' | 'percentage';
  product?: string;
  territory?: string;
}

export interface BonusTarget {
  metric: 'quota_attainment' | 'new_accounts' | 'activities' | 'retention';
  threshold: number;
  bonus: number;
  period: 'monthly' | 'quarterly' | 'annual';
}

export interface Spiff {
  name: string;
  product: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  eligibility: string[];
}

export interface DrawStructure {
  amount: number;
  recoverable: boolean;
  period: 'monthly' | 'quarterly';
  recoveryRate: number;
}

export interface Accelerator {
  threshold: number;
  multiplier: number;
  cap?: number;
}

export interface CompensationCap {
  type: 'commission' | 'total_variable';
  amount: number;
  period: 'monthly' | 'quarterly' | 'annual';
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
  condition: 'deal_size' | 'discount_level' | 'time_delay' | 'rejection';
  threshold: number;
  escalateTo: string[];
}

// Relationship Types
export interface TerritoryAssignment {
  repId: string;
  territoryId: string;
  startDate: Date;
  endDate?: Date;
  assignmentType: 'primary' | 'overlay' | 'backup';
  quotaAllocation: number;
}

export interface AccountMapping {
  accountId: string;
  repId: string;
  role: 'primary' | 'overlay' | 'support';
  startDate: Date;
  endDate?: Date;
}

export interface TeamHierarchy {
  managerId: string;
  reportId: string;
  level: number;
  startDate: Date;
  endDate?: Date;
}

export interface PerformanceMetric {
  repId: string;
  period: Date;
  quotaAttainment: number;
  revenue: number;
  activitiesCompleted: number;
  newAccounts: number;
  pipelineGenerated: number;
  winRate: number;
  averageDealSize: number;
  salesCycleLength: number;
}
