export interface LoanItem {
  id: string;
  title: string;
  lender: string;
  type: 'Mortgage' | 'Personal' | 'Auto' | 'Business';
  amount: number;
  remainingAmount: number;
  interestRate: number; // e.g., 6.5%
  emi: number;
  nextDueDate: string;
  status: 'active' | 'upcoming' | 'completed' | 'history';
  progressPercentage: number;
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

export interface DigitalTwinSim {
  incomeChange: number; // percentage change -20% to +50%
  extraMonthlyPayment: number;
  savingsRate: number; // 0% to 50%
}

export interface RecoveryPlan {
  currentHealthScore: number; // e.g. 82
  status: string;
  strategies: {
    id: string;
    title: string;
    impact: string;
    timeframe: string;
    description: string;
    recommendedAction: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
