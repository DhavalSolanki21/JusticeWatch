/* ------------------------------------------------------------------ 
   JusticeWatch — TypeScript interfaces matching the Django REST API
   ------------------------------------------------------------------ */

/* ======================== Authentication ======================== */

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'judge' | 'lawyer' | 'admin';
  full_name: string;
  district_scope?: string | null;
  is_verified: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    role: string;
    full_name: string;
    is_verified: boolean;
  };
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: 'judge' | 'lawyer';
  full_name: string;
  bar_council_id?: string;
  designation?: string;
}

/* ======================== Cases ======================== */

export type CaseCategory = 'Civil' | 'Criminal' | 'Appeal';
export type ChargesheetStatus = 'Not Filed' | 'Filed' | 'Under Review' | 'Trial';
export type CaseStatus = 'Pending' | 'Disposed' | 'Stayed';
export type DifficultyTier = 'low' | 'medium' | 'high' | 'critical';

export interface AssignedLawyer {
  id: number;
  lawyer: number;
  full_name: string;
  representing: 'Petitioner' | 'Respondent' | 'Defense' | 'Prosecution';
  assigned_date: string;
}

export interface CaseListItem {
  id: number;
  case_number: string;
  district_name: string;
  case_category: CaseCategory;
  crime_type: string | null;
  case_status: CaseStatus;
  chargesheet_status: ChargesheetStatus;
  difficulty_tier: DifficultyTier | null;
  filed_date: string;
}

export interface CaseDetail {
  id: number;
  case_number: string;
  district: number;
  district_name: string;
  court_name: string;
  judge: number | null;
  judge_name: string | null;
  case_category: CaseCategory;
  crime_type: string | null;
  applicable_sections: string;
  fir_number: string | null;
  fir_date: string | null;
  arrest_date: string | null;
  chargesheet_status: ChargesheetStatus;
  case_status: CaseStatus;
  filed_date: string;
  disposed_date: string | null;
  num_parties: number;
  case_notes: string | null;
  difficulty_score: number | null;
  difficulty_tier: DifficultyTier | null;
  assigned_lawyers: AssignedLawyer[];
  created_at: string;
  updated_at: string;
}

export interface CaseUpdatePayload {
  chargesheet_status?: ChargesheetStatus;
  case_notes?: string;
}

/* ======================== Difficulty ======================== */

export interface DifficultyBreakdown {
  difficulty_score: number | null;
  difficulty_tier: DifficultyTier | null;
  contributing_factors: string[];
  disclaimer: string;
}

/* ======================== Districts ======================== */

export type SeverityTier = 'low' | 'medium' | 'high' | 'critical';

export interface DistrictSummary {
  id: number;
  district_name: string;
  district_code: string;
  pending_count: number;
  disposed_count: number;
  disposal_rate: number;
  avg_case_age_days: number;
  severity_tier: SeverityTier;
}

export interface DistrictBreakdown {
  district: string;
  category_split: Record<string, number>;
  top_crime_types: Record<string, number>;
  chargesheet_distribution: Record<string, number>;
}

/* ======================== Analytics ======================== */

export interface SystemOverview {
  total_cases: number;
  pending_cases: number;
  status_breakdown: Record<string, number>;
  difficulty_breakdown: Record<string, number>;
  top_congested_districts: Record<string, number>;
}

/* ======================== Timeline ======================== */

export interface Hearing {
  id: number;
  case: number;
  case_number: string;
  hearing_date: string;
  purpose: string;
  outcome_notes: string | null;
  next_hearing_date: string | null;
  logged_by: number;
  logged_by_name: string;
  created_at: string;
}

export interface HearingCreatePayload {
  case: number;
  hearing_date: string;
  purpose: string;
  outcome_notes?: string;
  next_hearing_date?: string;
}
