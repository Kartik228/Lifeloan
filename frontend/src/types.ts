export interface LoanItem {
  id: string;
  title: string;
  lender?: string;
  type: string;
  amount: number;
  remainingAmount: number;
  interestRate: number; // e.g. 10.5%
  emi: number;
  nextDueDate?: string;
  status: 'active' | 'upcoming' | 'completed' | 'history' | string;
  progressPercentage: number;
  createdAt?: string;
}

export interface BackendPayment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
  due_date?: string | null;
  status: string;
}

export interface BackendLoan {
  id: number;
  user_id: number;
  title: string;
  loan_type: string;
  amount: number;
  remaining_amount: number;
  emi: number;
  interest_rate: number;
  tenure_months: number;
  progress_percentage: number;
  status: string;
  created_at: string;
  next_due_date?: string | null;
  payments?: BackendPayment[];
}

export interface ScheduleItem {
  installment_number: number;
  due_date: string;
  amount: number;
  status: "paid" | "upcoming";
  payment_date?: string | null;
}


export interface FinancialProfile {
  id: number;
  user_id: number;
  annual_income: number;
  monthly_expenses: number;
  existing_debt: number;
  savings: number;
  credit_score: number;
  employment_status: string;
  updated_at?: string;

  // Computed dashboard fields
  monthly_income: number;
  monthly_surplus: number;
  debt_to_income: number;
  active_loan_count: number;
  total_active_loan_amount: number;
  total_monthly_emi: number;
  health_score: number;
}

export interface DigitalTwinSim {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
}

export interface MetricDelta {
  current: number;
  simulated: number;
  delta: number;
  unit: string;
}

export interface DigitalTwinXAIFactor {
  feature: string;
  label?: string;
  description?: string;
  value: any;
  shap_value: number;
  impact: 'increases_default_risk' | 'decreases_default_risk' | string;
}

export interface DigitalTwinSimulationResult {
  current_default_probability: number;
  simulated_default_probability: number;
  current_risk_level: string;
  simulated_risk_level: string;
  current_decision: string;
  simulated_decision: string;
  simulated_emi: number;
  simulated_dti: number;
  simulated_monthly_surplus: number;
  risk_change: number;
  risk_change_percentage_points: number;
  is_favorable: boolean;
  summary: string;
  current_financial_metrics: {
    annual_income: number;
    monthly_income: number;
    monthly_expenses: number;
    monthly_emi: number;
    monthly_surplus: number;
    debt_to_income: number;
    total_debt: number;
    credit_score: number;
    default_probability: number;
    risk_level?: string;
    decision: string;
  };
  simulated_financial_metrics: {
    annual_income: number;
    monthly_income: number;
    monthly_expenses: number;
    new_loan_amount?: number;
    new_loan_emi?: number;
    monthly_emi: number;
    monthly_surplus: number;
    debt_to_income: number;
    total_debt: number;
    credit_score: number;
    default_probability: number;
    risk_level?: string;
    decision: string;
  };
  current_metrics: {
    annual_income: number;
    monthly_income: number;
    monthly_expenses: number;
    monthly_emi: number;
    monthly_surplus: number;
    debt_to_income: number;
    total_debt: number;
    credit_score: number;
    default_probability: number;
    risk_level?: string;
    decision: string;
  };
  simulated_metrics: {
    annual_income: number;
    monthly_income: number;
    monthly_expenses: number;
    new_loan_amount?: number;
    new_loan_emi?: number;
    monthly_emi: number;
    monthly_surplus: number;
    debt_to_income: number;
    total_debt: number;
    credit_score: number;
    default_probability: number;
    risk_level?: string;
    decision: string;
  };
  monthly_emi: MetricDelta;
  monthly_surplus: MetricDelta;
  debt_to_income: MetricDelta;
  total_debt: MetricDelta;
  credit_score: MetricDelta;
  default_probability: MetricDelta;
  ml_decision: string;
  xai_factors?: DigitalTwinXAIFactor[];
  scenario_parameters?: {
    loan_amount: number;
    interest_rate: number;
    tenure_years: number;
    tenure_months: number;
    income_change_percent: number;
    expense_change_percent: number;
  };
}

export interface LenderOffer {
  lender_id: string;
  bank_name: string;
  logo_symbol: string;
  loan_type: string;
  interest_rate: number;
  monthly_emi: number;
  total_interest: number;
  total_repayment: number;
  processing_fee: number;
  processing_fee_percent: number;
  tenure_years: number;
  loan_amount: number;
  min_credit_score: number;
  highlights: string[];
  is_partner: boolean;
  data_source: string;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface RecoveryPlanStrategy {
  id: string;
  title: string;
  impact: string;
  timeframe: string;
  description: string;
  recommendedAction: string;
}

export interface RecoveryPlan {
  currentHealthScore: number;
  status: string;
  strategies: RecoveryPlanStrategy[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  context?: any;
}

export interface EligibilityInput {
  annualIncome: number;
  monthlyDebt: number;
  creditScore: number;
  requestedAmount: number;
  tenureYears: number;
  employmentStatus: string;
  loanType: string;
}

export interface EligibilityResult {
  approvalProbability: number;
  defaultProbability: number;
  estimatedEMI: number;
  maxBorrowingCapacity: number;
  riskTier: 'Low' | 'Moderate' | 'High';
  dtiRatio: number;
  decision: 'Approved' | 'Rejected';
  aiAdvice: string[];
  keyFactors: any[];
}
