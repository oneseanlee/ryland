export type PipelineStage = 
  | 'Onboarding' 
  | 'Analysis' 
  | 'Kickoff Call' 
  | 'Remediation' 
  | 'Post-Audit Check' 
  | 'Funding Execution' 
  | 'Closed/Funded' 
  | 'Inquiry Removal';

export const PIPELINE_STAGES: PipelineStage[] = [
  'Onboarding',
  'Analysis',
  'Kickoff Call',
  'Remediation',
  'Post-Audit Check',
  'Funding Execution',
  'Closed/Funded',
  'Inquiry Removal',
];

export interface FundingClient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  ssn_encrypted: string | null;
  mothers_maiden_name: string | null;
  home_address: Record<string, unknown> | null;
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: Record<string, unknown> | null;
  ein: string | null;
  duns: string | null;
  website: string | null;
  personal_income: number | null;
  business_revenue: number | null;
  monthly_deposits: number | null;
  funding_goal: string | null;
  current_stage: PipelineStage;
  stage_entered_at: string;
  mfsn_credentials: Record<string, unknown> | null;
  nav_credentials: Record<string, unknown> | null;
  existing_checking_accounts: Record<string, unknown> | null;
  existing_credit_cards: Record<string, unknown> | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientAssignment {
  id: string;
  client_id: string;
  user_id: string;
  assigned_at: string;
  is_primary: boolean;
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

export interface ClientActivityLog {
  id: string;
  client_id: string;
  user_id: string | null;
  action_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ClientWithDetails extends FundingClient {
  assignments: ClientAssignment[];
  last_activity: ClientActivityLog | null;
  days_in_stage: number;
  next_action?: string | null;
  has_paused_bureau?: boolean;
}

export interface StageData {
  stage: PipelineStage;
  clients: ClientWithDetails[];
  count: number;
  overdueCount: number;
}

export interface PipelineData {
  stages: Record<PipelineStage, StageData>;
  totalActiveClients: number;
  totalOverdue: number;
  totalFundedThisMonth: number;
}

export type ClientStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Blocked';

export interface RepOption {
  id: string;
  name: string;
  email: string;
}
