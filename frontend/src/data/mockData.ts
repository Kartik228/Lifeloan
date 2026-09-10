import { LoanItem, RecoveryPlan } from '../types';

export const INITIAL_LOANS: LoanItem[] = [
  {
    id: 'LN-9082',
    title: 'Home Loan (HDFC Bank)',
    lender: 'HDFC Bank',
    type: 'Mortgage',
    amount: 2500000,
    remainingAmount: 1840000,
    interestRate: 8.5,
    emi: 24500,
    nextDueDate: '2026-09-15',
    status: 'active',
    progressPercentage: 26,
  },
  {
    id: 'LN-7412',
    title: 'Business Expansion Credit Line',
    lender: 'State Bank of India',
    type: 'Business',
    amount: 1000000,
    remainingAmount: 620000,
    interestRate: 10.2,
    emi: 18500,
    nextDueDate: '2026-09-20',
    status: 'active',
    progressPercentage: 38,
  },
  {
    id: 'LN-3301',
    title: 'Vehicle Loan (ICICI Bank)',
    lender: 'ICICI Bank',
    type: 'Auto',
    amount: 450000,
    remainingAmount: 135000,
    interestRate: 9.4,
    emi: 9200,
    nextDueDate: '2026-09-10',
    status: 'upcoming',
    progressPercentage: 70,
  },
  {
    id: 'LN-1102',
    title: 'Personal Bridge Credit',
    lender: 'Axis Bank',
    type: 'Personal',
    amount: 150000,
    remainingAmount: 0,
    interestRate: 11.5,
    emi: 0,
    nextDueDate: 'Paid',
    status: 'completed',
    progressPercentage: 100,
  },
  {
    id: 'LN-0542',
    title: 'Commercial Property Facility',
    lender: 'Kotak Mahindra Bank',
    type: 'Mortgage',
    amount: 5000000,
    remainingAmount: 0,
    interestRate: 8.8,
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
      title: 'High-Interest Debt Snowball',
      impact: '+14 pts Credit Boost',
      timeframe: '3 - 6 Months',
      description: 'Prioritize paying off the 11.5% interest personal loan first to drop your DTI ratio below 28%.',
      recommendedAction: 'Allocate ₹15,000/month extra from liquid savings.',
    },
    {
      id: 'strat-2',
      title: 'Liquidity Ratio Rebalancing',
      impact: 'Unlocks +₹2,50,000 Capacity',
      timeframe: '1 - 2 Months',
      description: 'Shift 15% of short-term fixed deposit yields into emergency savings to trigger lower risk ratings.',
      recommendedAction: 'Automate monthly recurring deposits.',
    },
    {
      id: 'strat-3',
      title: 'Home Loan Refinancing Window',
      impact: 'Saves ₹4,200/month EMI',
      timeframe: 'Immediate',
      description: 'Current market repo rates favor refinancing home loan from 9.8% down to 8.5%.',
      recommendedAction: 'Trigger one-click bank rate comparison.',
    },
  ]
};

export const RECENT_PORTFOLIO_ACTIVITY = [
  { id: 'act-1', type: 'Home Loan EMI Repayment', amount: '-₹24,500', date: '2 hours ago', status: 'Cleared', icon: 'home' },
  { id: 'act-2', type: 'Vehicle Loan Auto-Pay', amount: '-₹9,200', date: 'Yesterday', status: 'Cleared', icon: 'credit-card' },
  { id: 'act-3', type: 'Fixed Deposit Yield Inflow', amount: '+₹18,500', date: '3 days ago', status: 'Received', icon: 'trending-up' },
  { id: 'act-4', type: 'Loan Pre-payment Installment', amount: '-₹50,000', date: '5 days ago', status: 'Applied', icon: 'shield-check' },
];
