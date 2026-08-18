import { LoanItem, RecoveryPlan } from '../types';

export const INITIAL_LOANS: LoanItem[] = [
  {
    id: 'LN-9082',
    title: 'Luxury Home Mortgage',
    lender: 'Apex Horizon Capital',
    type: 'Mortgage',
    amount: 1200000,
    remainingAmount: 840000,
    interestRate: 5.8,
    emi: 6450,
    nextDueDate: '2026-08-15',
    status: 'active',
    progressPercentage: 30,
  },
  {
    id: 'LN-7412',
    title: 'Commercial Expansion Line',
    lender: 'Global Private Bank',
    type: 'Business',
    amount: 500000,
    remainingAmount: 310000,
    interestRate: 6.2,
    emi: 4200,
    nextDueDate: '2026-08-20',
    status: 'active',
    progressPercentage: 38,
  },
  {
    id: 'LN-3301',
    title: 'EV Fleet Acquisition',
    lender: 'Silicon Finance Corp',
    type: 'Auto',
    amount: 150000,
    remainingAmount: 45000,
    interestRate: 4.9,
    emi: 1800,
    nextDueDate: '2026-08-10',
    status: 'upcoming',
    progressPercentage: 70,
  },
  {
    id: 'LN-1102',
    title: 'Tech Seed Bridge Loan',
    lender: 'Vanguard Credit',
    type: 'Personal',
    amount: 80000,
    remainingAmount: 0,
    interestRate: 7.1,
    emi: 0,
    nextDueDate: 'Paid',
    status: 'completed',
    progressPercentage: 100,
  },
  {
    id: 'LN-0542',
    title: 'Real Estate Mezzanine',
    lender: 'Heritage Wealth Partners',
    type: 'Mortgage',
    amount: 2500000,
    remainingAmount: 0,
    interestRate: 6.0,
    emi: 0,
    nextDueDate: 'Archived',
    status: 'history',
    progressPercentage: 100,
  }
];

export const INITIAL_RECOVERY_PLAN: RecoveryPlan = {
  currentHealthScore: 82,
  status: 'Robust & Optimizing',
  strategies: [
    {
      id: 'strat-1',
      title: 'High-Yield Debt Snowball',
      impact: '+14 pts Credit Boost',
      timeframe: '3 - 6 Months',
      description: 'Prioritize paying off the 7.1% interest unsecured debt line first to drop DTI below 28%.',
      recommendedAction: 'Allocate $1,200/mo extra from idle liquid reserves.',
    },
    {
      id: 'strat-2',
      title: 'Liquidity Ratio Rebalancing',
      impact: 'Unlocks +$250k Capacity',
      timeframe: '1 - 2 Months',
      description: 'Shift 15% of short-term treasury yields into collateral reserve to trigger lower margin rates.',
      recommendedAction: 'Automate weekly liquidity sweeps.',
    },
    {
      id: 'strat-3',
      title: 'Mortgage Refinance Window',
      impact: 'Saves $1,150/mo EMI',
      timeframe: 'Immediate',
      description: 'Current market rate dips favor refinancing Apex Horizon Mortgage from 5.8% down to 4.95%.',
      recommendedAction: 'Trigger one-click automated refinancing request.',
    },
  ]
};

export const RECENT_PORTFOLIO_ACTIVITY = [
  { id: 'act-1', type: 'Mortgage Repayment', amount: '-$6,450', date: '2 hours ago', status: 'Cleared', icon: 'home' },
  { id: 'act-2', type: 'Credit Line Auto-Pay', amount: '-$4,200', date: 'Yesterday', status: 'Cleared', icon: 'credit-card' },
  { id: 'act-3', type: 'Yield Inflow (Treasury)', amount: '+$14,200', date: '3 days ago', status: 'Received', icon: 'trending-up' },
  { id: 'act-4', type: 'Loan Pre-payment Bonus', amount: '-$10,000', date: '5 days ago', status: 'Applied', icon: 'shield-check' },
];
