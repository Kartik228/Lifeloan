import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import {
  EligibilityInput,
  EligibilityResult,
} from '../types';

interface EligibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApply: () => void;
}

interface XAIExplanation {
  feature: string;
  shap_value: number;
  impact:
    | 'increases_default_risk'
    | 'decreases_default_risk';
}

export const EligibilityModal: React.FC<
  EligibilityModalProps
> = ({
  isOpen,
  onClose,
  onOpenApply,
}) => {
  // ============================================================
  // FORM DATA
  // ============================================================

  const [formData, setFormData] =
    useState<EligibilityInput>({
      annualIncome: 140000,
      monthlyDebt: 1200,
      creditScore: 750,
      requestedAmount: 400000,
      tenureYears: 15,
      employmentStatus:
        'Employed Full-Time',
      loanType: 'Mortgage',
    });

  // ============================================================
  // ADDITIONAL ML INPUTS
  // ============================================================

  const [modelInputs, setModelInputs] =
    useState({
      employmentLength: 5,
      interestRate: 12,
      revolvingBalance: 5000,
      revolvingUtilization: 30,
      openAccounts: 8,
      totalAccounts: 15,
      delinquencies: 0,
      creditInquiries: 0,
      homeOwnership: 'RENT',
      verificationStatus: 'Not Verified',
      creditHistoryYears: 10,
      publicRecords: 0,
    });

  // ============================================================
  // RESULT STATE
  // ============================================================

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<EligibilityResult | null>(
      null
    );

  const [xaiFactors, setXaiFactors] =
    useState<XAIExplanation[]>([]);

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // HUMAN-FRIENDLY FEATURE NAMES
  // ============================================================

  const formatFeatureName = (
    feature: string
  ): string => {
    const featureNames: Record<
      string,
      string
    > = {
      loan_amnt:
        'Requested Loan Amount',

      funded_amnt:
        'Funded Loan Amount',

      funded_amnt_inv:
        'Investor-Funded Loan Amount',

      term:
        'Loan Term',

      int_rate:
        'Interest Rate',

      installment:
        'Monthly Installment',

      grade:
        'Loan Grade',

      sub_grade:
        'Loan Sub-Grade',

      emp_length:
        'Employment History',

      annual_inc:
        'Annual Income',

      dti:
        'Debt-To-Income Ratio',

      delinq_2yrs:
        'Recent Delinquencies',

      fico_range_low:
        'Credit Score',

      fico_range_high:
        'Credit Score',

      inq_last_6mths:
        'Recent Credit Inquiries',

      open_acc:
        'Open Credit Accounts',

      pub_rec:
        'Public Records',

      revol_bal:
        'Revolving Credit Balance',

      revol_util:
        'Credit Utilization',

      total_acc:
        'Credit Account Profile',

      initial_list_status:
        'Loan Listing Status',

      application_type:
        'Application Type',

      credit_history_length:
        'Credit History Length',

      credit_per_year:
        'Credit Account Profile',

      inq_per_year:
        'Credit Inquiry Profile',

      delinq_per_year:
        'Delinquency Profile',

      pub_rec_per_year:
        'Public Records Profile',

      loan_to_income:
        'Loan-to-Income Ratio',

      installment_to_income:
        'Installment-to-Income Ratio',

      revol_bal_to_income:
        'Revolving Balance-to-Income',

      loan_per_open_acc:
        'Loan per Open Account',

      revol_per_open_acc:
        'Revolving Balance per Account',

      issue_year:
        'Historical Loan Information',

      issue_month:
        'Historical Loan Information',

      deferral_term:
        'Loan Deferral Information',

      mths_since_last_delinq:
        'Months Since Last Delinquency',

      mths_since_last_record:
        'Months Since Last Public Record',

      collections_12_mths_ex_med:
        'Recent Collections',

      policy_code:
        'Loan Policy Information',

      total_bc_limit:
        'Total Credit Card Limit',

      total_bc_util:
        'Credit Card Utilization',

      bc_open_to_buy:
        'Available Credit',

      bc_util:
        'Bankcard Utilization',

      acc_open_past_24mths:
        'Recently Opened Accounts',

      mo_sin_old_rev_tl_op:
        'Age of Oldest Revolving Account',

      mo_sin_rcnt_rev_tl_op:
        'Recent Revolving Account Activity',

      revol_bal_joint:
        'Joint Revolving Balance',

      annual_inc_joint:
        'Joint Annual Income',

      dti_joint:
        'Joint Debt-To-Income Ratio',

      addr_state:
        'Location Information',

      add_state:
        'Location Information',
    };

    if (featureNames[feature]) {
      return featureNames[feature];
    }

    if (
      feature.startsWith(
        'home_ownership_'
      )
    ) {
      return `Home Ownership: ${feature.replace(
        'home_ownership_',
        ''
      )}`;
    }

    if (
      feature.startsWith(
        'verification_status_'
      )
    ) {
      return `Income Verification: ${feature.replace(
        'verification_status_',
        ''
      )}`;
    }

    if (
      feature.startsWith('purpose_')
    ) {
      return `Loan Purpose: ${feature.replace(
        'purpose_',
        ''
      )}`;
    }

    return feature
      .replace(/_/g, ' ')
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ============================================================
  // USER-FRIENDLY XAI EXPLANATIONS
  // ============================================================

  const getFactorExplanation = (
    feature: string
  ): string => {
    const explanations: Record<
      string,
      string
    > = {
      loan_amnt:
        "The requested loan amount contributed to the model's assessment.",

      funded_amnt:
        "The funded loan amount contributed to the model's assessment.",

      funded_amnt_inv:
        "The investor-funded portion of the loan contributed to the model's assessment.",

      dti:
        "Your debt relative to income contributed to the model's assessment.",

      fico_range_low:
        "Your credit score contributed to the model's assessment.",

      fico_range_high:
        "Your credit score contributed to the model's assessment.",

      revol_util:
        "Your revolving credit usage contributed to the model's assessment.",

      revol_bal:
        "Your revolving credit balance contributed to the model's assessment.",

      delinq_2yrs:
        "Your recent delinquency history contributed to the model's assessment.",

      inq_last_6mths:
        "Recent credit inquiries contributed to the model's assessment.",

      open_acc:
        "The number of open credit accounts contributed to the model's assessment.",

      total_acc:
        "Your overall credit-account profile contributed to the model's assessment.",

      annual_inc:
        "Your reported income contributed to the model's assessment.",

      emp_length:
        "Your employment history contributed to the model's assessment.",

      credit_history_length:
        "The length of your credit history contributed to the model's assessment.",

      credit_per_year:
        "Your credit-account pattern contributed to the model's assessment.",

      inq_per_year:
        "Your recent credit inquiry pattern contributed to the model's assessment.",

      delinq_per_year:
        "Your delinquency pattern contributed to the model's assessment.",

      pub_rec_per_year:
        "Your public-record history contributed to the model's assessment.",

      loan_to_income:
        "The relationship between the requested loan and your income contributed to the model's assessment.",

      installment_to_income:
        "The relationship between your installment and income contributed to the model's assessment.",

      revol_bal_to_income:
        "The relationship between your revolving balance and income contributed to the model's assessment.",

      loan_per_open_acc:
        "The relationship between the requested loan and your open accounts contributed to the model's assessment.",

      revol_per_open_acc:
        "The relationship between revolving balance and open accounts contributed to the model's assessment.",

      issue_year:
        "This historical loan information reduced the model's predicted risk.",

      issue_month:
        "This historical loan information contributed to the model's risk assessment.",

      deferral_term:
        "This historical loan information reduced the model's predicted risk.",

      total_bc_limit:
        "Your total available credit limit contributed to the model's assessment.",

      total_bc_util:
        "Your overall credit-card utilization contributed to the model's assessment.",

      bc_open_to_buy:
        "Your available unused credit contributed to the model's assessment.",

      bc_util:
        "Your bankcard utilization contributed to the model's assessment.",

      acc_open_past_24mths:
        "Recently opened accounts contributed to the model's assessment.",

      addr_state:
        "This information contributed to the model's risk assessment.",

      add_state:
        "This information contributed to the model's risk assessment.",
    };

    return (
      explanations[feature] ||
      "This factor contributed to the model's risk assessment."
    );
  };

  // ============================================================
  // USER-FRIENDLY DISPLAY NAMES
  // ============================================================

  const getDisplayName = (
    feature: string
  ): string => {
    const names: Record<
      string,
      string
    > = {
      deferral_term:
        'Loan Deferral Information',

      issue_year:
        'Historical Loan Information',

      issue_month:
        'Historical Loan Information',

      addr_state:
        'Location Information',

      add_state:
        'Location Information',

      credit_per_year:
        'Credit Account Profile',

      inq_per_year:
        'Credit Inquiry Profile',

      delinq_per_year:
        'Delinquency Profile',

      funded_amnt_inv:
        'Investor-Funded Loan Amount',

      loan_amnt:
        'Requested Loan Amount',

      revol_util:
        'Credit Utilization',

      total_bc_limit:
        'Total Credit Card Limit',

      total_bc_util:
        'Credit Card Utilization',

      bc_util:
        'Bankcard Utilization',

      inq_last_6mths:
        'Recent Credit Inquiries',

      emp_length:
        'Employment History',

      fico_range_low:
        'Credit Score',

      fico_range_high:
        'Credit Score',

      dti:
        'Debt-To-Income Ratio',

      annual_inc:
        'Annual Income',

      total_acc:
        'Credit Account Profile',

      open_acc:
        'Open Credit Accounts',

      revol_bal:
        'Revolving Credit Balance',

      delinq_2yrs:
        'Recent Delinquencies',
    };

    return (
      names[feature] ||
      formatFeatureName(feature)
    );
  };

  // ============================================================
  // SUBMIT / PREDICTION
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setResult(null);
    setXaiFactors([]);

    try {
      // --------------------------------------------------------
      // Calculate DTI
      // --------------------------------------------------------

      const dti =
        (formData.monthlyDebt * 12 /
          formData.annualIncome) *
        100;

      // --------------------------------------------------------
      // Send request to FastAPI
      // --------------------------------------------------------

      const response = await fetch(
        'http://127.0.0.1:8000/predict',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            annual_inc:
              formData.annualIncome,

            loan_amnt:
              formData.requestedAmount,

            dti: dti,

            fico_range_low:
              Math.max(
                300,
                formData.creditScore - 10
              ),

            fico_range_high:
              Math.min(
                850,
                formData.creditScore + 10
              ),

            int_rate:
              modelInputs.interestRate,

            revol_bal:
              modelInputs.revolvingBalance,

            revol_util:
              modelInputs.revolvingUtilization,

            open_acc:
              modelInputs.openAccounts,

            total_acc:
              modelInputs.totalAccounts,

            pub_rec:
              modelInputs.publicRecords,

            delinq_2yrs:
              modelInputs.delinquencies,

            inq_last_6mths:
              modelInputs.creditInquiries,

            term:
              formData.tenureYears * 12,

            grade:
              'C',

            emp_length:
              `${modelInputs.employmentLength} years`,

            home_ownership:
              modelInputs.homeOwnership,

            verification_status:
              modelInputs.verificationStatus,

            purpose:
              'debt_consolidation',

            credit_history_length:
              modelInputs.creditHistoryYears *
              12,
          }),
        }
      );

      // --------------------------------------------------------
      // Check API response
      // --------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          `ML prediction failed with status ${response.status}`
        );
      }

      const prediction =
        await response.json();

      console.log(
        'LifeLoan ML prediction:',
        prediction
      );

      // --------------------------------------------------------
      // REAL XAI FACTORS
      // --------------------------------------------------------

      const realXaiFactors:
        XAIExplanation[] =
        Array.isArray(
          prediction.xai_factors
        )
          ? prediction.xai_factors
          : [];

      setXaiFactors(
        realXaiFactors
      );

      // --------------------------------------------------------
      // REAL DEFAULT PROBABILITY
      // --------------------------------------------------------

      const defaultProbability =
        Number(
          prediction.default_probability
        );

      // --------------------------------------------------------
      // APPROVAL PROBABILITY
      // --------------------------------------------------------

      const approvalProbability =
        Math.round(
          (1 - defaultProbability) *
            100
        );

      // --------------------------------------------------------
      // RISK TIER
      // --------------------------------------------------------

      let riskTier:
        | 'Low'
        | 'Moderate'
        | 'High' = 'Low';

      if (
        approvalProbability < 45
      ) {
        riskTier = 'High';
      } else if (
        approvalProbability < 75
      ) {
        riskTier = 'Moderate';
      }

      // --------------------------------------------------------
      // EMI
      // --------------------------------------------------------

      const monthlyInterestRate =
        modelInputs.interestRate /
        100 /
        12;

      const numberOfPayments =
        formData.tenureYears *
        12;

      let estimatedEMI = 0;

      if (
        monthlyInterestRate > 0
      ) {
        estimatedEMI =
          (
            formData.requestedAmount *
            monthlyInterestRate *
            Math.pow(
              1 +
                monthlyInterestRate,
              numberOfPayments
            )
          ) /
          (
            Math.pow(
              1 +
                monthlyInterestRate,
              numberOfPayments
            ) - 1
          );
      } else {
        estimatedEMI =
          formData.requestedAmount /
          numberOfPayments;
      }

      // --------------------------------------------------------
      // ACTUAL BACKEND DECISION
      // --------------------------------------------------------

      const decision:
        | 'Approved'
        | 'Rejected' =
        prediction.decision ===
        'Rejected'
          ? 'Rejected'
          : 'Approved';

      // --------------------------------------------------------
      // RESULT
      // --------------------------------------------------------

      const mlResult:
        EligibilityResult = {
        approvalProbability,

        defaultProbability,

        estimatedEMI:
          Math.round(
            estimatedEMI
          ),

        maxBorrowingCapacity:
          Math.round(
            Number(
              prediction.predicted_loan_amount
            )
          ),

        riskTier,

        dtiRatio:
          Math.round(
            dti * 10
          ) / 10,

        decision,

        aiAdvice: [
          `${
            (
              defaultProbability *
              100
            ).toFixed(1)
          }% estimated default probability`,

          `Model decision: ${decision}`,

          `Estimated borrowing capacity: $${Math.round(
            Number(
              prediction.predicted_loan_amount
            )
          ).toLocaleString()}`,
        ],

        keyFactors: [],
      };

      setResult(
        mlResult
      );

    } catch (err) {
      console.error(
        'LifeLoan ML prediction error:',
        err
      );

      alert(
        'Unable to connect to the LifeLoan ML backend. Please make sure the FastAPI server is running on port 8000.'
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/80 backdrop-blur-md">

      <div className="relative w-full max-w-2xl rounded-2xl glass-panel p-6 lg:p-8 border border-[#3c4a42] shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ====================================================
            HEADER
            ==================================================== */}

        <div className="flex items-center justify-between border-b border-[#242c27] pb-4 mb-6">

          <div className="flex items-center space-x-2.5">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/20 text-[#4edea3]">

              <Sparkles className="h-5 w-5" />

            </div>

            <div>

              <h3 className="font-serif text-xl font-bold text-[#dde4dd]">
                AI Loan Eligibility Evaluator
              </h3>

              <p className="text-xs text-[#86948a]">
                Powered by LifeLoan Predictive Neural Engine
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#86948a] hover:bg-[#1a211d] hover:text-[#dde4dd]"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* ====================================================
            FORM
            ==================================================== */}

        {!result ? (

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Loan Purpose */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Loan Purpose
                </label>

                <select
                  value={
                    formData.loanType
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loanType:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                >

                  <option>
                    Mortgage
                  </option>

                  <option>
                    Business Expansion
                  </option>

                  <option>
                    Auto / Fleet
                  </option>

                  <option>
                    Personal / Bridge
                  </option>

                </select>

              </div>

              {/* Requested Amount */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Requested Amount ($)
                </label>

                <input
                  type="number"
                  value={
                    formData.requestedAmount
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requestedAmount:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Annual Income */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Annual Income ($)
                </label>

                <input
                  type="number"
                  value={
                    formData.annualIncome
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      annualIncome:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Monthly Debt */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Existing Monthly Debt ($)
                </label>

                <input
                  type="number"
                  value={
                    formData.monthlyDebt
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyDebt:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Credit Score */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Credit Score
                </label>

                <input
                  type="number"
                  min="300"
                  max="850"
                  value={
                    formData.creditScore
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditScore:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Tenure */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Tenure (Years)
                </label>

                <select
                  value={
                    formData.tenureYears
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tenureYears:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                >

                  <option value={5}>
                    5 Years
                  </option>

                  <option value={10}>
                    10 Years
                  </option>

                  <option value={15}>
                    15 Years
                  </option>

                  <option value={20}>
                    20 Years
                  </option>

                  <option value={30}>
                    30 Years
                  </option>

                </select>

              </div>

              {/* Employment Length */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Employment Length (Years)
                </label>

                <input
                  type="number"
                  min="0"
                  max="10"
                  value={
                    modelInputs.employmentLength
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      employmentLength:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Interest Rate */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Interest Rate (%)
                </label>

                <input
                  type="number"
                  min="1"
                  max="40"
                  step="0.1"
                  value={
                    modelInputs.interestRate
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      interestRate:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Revolving Balance */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Revolving Balance ($)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.revolvingBalance
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      revolvingBalance:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Credit Utilization */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Credit Utilization (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={
                    modelInputs.revolvingUtilization
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      revolvingUtilization:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Open Accounts */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Open Credit Accounts
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.openAccounts
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      openAccounts:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Total Accounts */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Total Credit Accounts
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.totalAccounts
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      totalAccounts:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Delinquencies */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Delinquencies (Last 2 Years)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.delinquencies
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      delinquencies:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Credit Inquiries */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Credit Inquiries (Last 6 Months)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.creditInquiries
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      creditInquiries:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Home Ownership */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Home Ownership
                </label>

                <select
                  value={
                    modelInputs.homeOwnership
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      homeOwnership:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                >

                  <option value="RENT">
                    Rent
                  </option>

                  <option value="OWN">
                    Own
                  </option>

                  <option value="MORTGAGE">
                    Mortgage
                  </option>

                </select>

              </div>

              {/* Verification */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Income Verification
                </label>

                <select
                  value={
                    modelInputs.verificationStatus
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      verificationStatus:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                >

                  <option value="Verified">
                    Verified
                  </option>

                  <option value="Source Verified">
                    Source Verified
                  </option>

                  <option value="Not Verified">
                    Not Verified
                  </option>

                </select>

              </div>

              {/* Credit History */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Credit History (Years)
                </label>

                <input
                  type="number"
                  min="0"
                  max="50"
                  value={
                    modelInputs.creditHistoryYears
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      creditHistoryYears:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

              {/* Public Records */}

              <div>

                <label className="block text-xs font-semibold text-[#bbcabf] uppercase mb-1">
                  Public Records
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    modelInputs.publicRecords
                  }
                  onChange={(e) =>
                    setModelInputs({
                      ...modelInputs,
                      publicRecords:
                        Number(
                          e.target.value
                        ),
                    })
                  }
                  className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                />

              </div>

            </div>

            {/* Calculate */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center space-x-2 rounded-full bg-[#10b981] py-3 text-sm font-bold text-[#003824] hover:bg-[#4edea3] transition-all disabled:opacity-50"
            >

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  <span>
                    ANALYZING UNDERWRITING RISK...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />

                  <span>
                    CALCULATE AI ELIGIBILITY SCORE
                  </span>
                </>
              )}

            </button>

          </form>

        ) : (

          /* ==================================================
             RESULTS
             ================================================== */

          <div className="space-y-6">

            {/* ==================================================
                DECISION STATUS
                ================================================== */}

            <div
              className={`rounded-2xl border p-6 md:p-8 text-center ${
                result.decision ===
                'Approved'
                  ? 'border-[#10b981]/30 bg-[#10b981]/5'
                  : 'border-red-400/30 bg-red-400/5'
              }`}
            >

              <div
                className={`text-5xl md:text-6xl font-bold tracking-tight ${
                  result.decision ===
                  'Approved'
                    ? 'text-[#4edea3]'
                    : 'text-red-400'
                }`}
              >
                {result.decision ===
                'Approved'
                  ? 'APPROVED'
                  : 'REJECTED'}
              </div>

              <p className="mt-2 text-xs md:text-sm text-[#86948a]">
                {result.decision ===
                'Approved'
                  ? "Your application meets LifeLoan's current model approval criteria."
                  : "Your application does not meet LifeLoan's current model approval criteria."}
              </p>

            </div>

            {/* ==================================================
                TOP METRICS
                ================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Approval Probability */}

              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] text-center">

                <div className="text-[10px] text-[#86948a] uppercase">
                  Approval Probability
                </div>

                <div className="text-2xl font-bold font-mono text-[#4edea3] mt-1">
                  {result.approvalProbability}%
                </div>

                <div className="text-[10px] text-[#10b981]">
                  Model Risk: {result.riskTier}
                </div>

              </div>

              {/* EMI */}

              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] text-center">

                <div className="text-[10px] text-[#86948a] uppercase">
                  Estimated EMI
                </div>

                <div className="text-2xl font-bold font-mono text-[#dde4dd] mt-1">
                  $
                  {result.estimatedEMI.toLocaleString()}
                </div>

                <div className="text-[10px] text-[#86948a]">
                  Per Month
                </div>

              </div>

              {/* Borrowing Capacity */}

              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] text-center">

                <div className="text-[10px] text-[#86948a] uppercase">
                  Borrowing Capacity
                </div>

                <div className="text-2xl font-bold font-mono text-[#4edea3] mt-1">
                  $
                  {result.maxBorrowingCapacity.toLocaleString()}
                </div>

                <div className="text-[10px] text-[#86948a]">
                  ML Predicted Amount
                </div>

              </div>

            </div>

            {/* ==================================================
                AI UNDERWRITER RECOMMENDATIONS
                ================================================== */}

            <div className="rounded-xl bg-[#0e1511] p-5 border border-[#242c27]">

              <div className="text-sm font-bold text-[#4edea3] uppercase tracking-wider mb-4 flex items-center space-x-2">

                <Sparkles className="h-4 w-4" />

                <span>
                  AI Underwriter Recommendations
                </span>

              </div>

              <div className="space-y-4">

                {/* Default Probability */}

                <div className="flex items-start gap-3">

                  <CheckCircle className="h-4 w-4 text-[#4edea3] shrink-0 mt-0.5" />

                  <div>

                    <div className="text-sm text-[#dde4dd] font-medium">
                      {(
                        result.defaultProbability *
                        100
                      ).toFixed(1)}
                      % estimated default probability
                    </div>

                    <div className="text-xs text-[#86948a] mt-1">
                      LifeLoan's ML model estimates
                      this probability of default
                      for your application.
                    </div>

                  </div>

                </div>

                {/* Decision */}

                <div className="flex items-start gap-3">

                  <CheckCircle className="h-4 w-4 text-[#4edea3] shrink-0 mt-0.5" />

                  <div>

                    <div className="text-sm text-[#dde4dd] font-medium">
                      Model decision: {result.decision}
                    </div>

                    <div className="text-xs text-[#86948a] mt-1">
                      The predicted default
                      probability was evaluated
                      against LifeLoan's configured
                      approval threshold.
                    </div>

                  </div>

                </div>

                {/* Borrowing Capacity */}

                <div className="flex items-start gap-3">

                  <CheckCircle className="h-4 w-4 text-[#4edea3] shrink-0 mt-0.5" />

                  <div>

                    <div className="text-sm text-[#dde4dd] font-medium">
                      Estimated borrowing capacity: $
                      {result.maxBorrowingCapacity.toLocaleString()}
                    </div>

                    <div className="text-xs text-[#86948a] mt-1">
                      The loan amount model predicts
                      a borrowing capacity of
                      approximately $
                      {result.maxBorrowingCapacity.toLocaleString()}.
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                WHY THIS DECISION
                ================================================== */}

            <div className="rounded-xl bg-[#0e1511] p-5 border border-[#242c27]">

              <div className="flex items-center space-x-2 mb-2">

                <Sparkles className="h-4 w-4 text-[#4edea3]" />

                <span className="text-sm font-bold text-[#4edea3] uppercase tracking-wider">
                  Why This Decision?
                </span>

              </div>

              <p className="text-xs text-[#86948a] mb-5 leading-relaxed">
                These are the strongest factors
                influencing LifeLoan's model
                assessment.
              </p>

              {xaiFactors.length > 0 ? (

                <div className="space-y-0">

                  {xaiFactors.map(
                    (
                      item,
                      idx
                    ) => {

                      const increasesRisk =
                        item.impact ===
                        'increases_default_risk';

                      const displayName =
                        getDisplayName(
                          item.feature
                        );

                      const explanation =
                        getFactorExplanation(
                          item.feature
                        );

                      return (

                        <div
                          key={`${item.feature}-${idx}`}
                          className="flex items-start justify-between gap-4 py-4 border-b border-[#242c27] last:border-b-0"
                        >

                          {/* LEFT */}

                          <div className="flex items-start gap-3 min-w-0">

                            {/* Risk direction */}

                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                increasesRisk
                                  ? 'bg-red-400/10'
                                  : 'bg-[#4edea3]/10'
                              }`}
                            >

                              {increasesRisk ? (

                                <TrendingUp
                                  className="h-4 w-4 text-red-400"
                                />

                              ) : (

                                <TrendingDown
                                  className="h-4 w-4 text-[#4edea3]"
                                />

                              )}

                            </div>

                            {/* Factor information */}

                            <div className="min-w-0">

                              <div className="text-sm font-semibold text-[#dde4dd]">
                                {displayName}
                              </div>

                              <div
                                className={`text-xs font-medium mt-1 ${
                                  increasesRisk
                                    ? 'text-red-400'
                                    : 'text-[#4edea3]'
                                }`}
                              >
                                {increasesRisk
                                  ? 'Increased your assessed risk'
                                  : 'Pushed the prediction toward lower risk'}
                              </div>

                              <div className="text-[11px] text-[#86948a] mt-1.5 leading-relaxed">
                                {explanation}
                              </div>

                            </div>

                          </div>

                          {/* CONTRIBUTION */}

                          <div
                            className={`text-xs font-mono shrink-0 ${
                              increasesRisk
                                ? 'text-red-400'
                                : 'text-[#86948a]'
                            }`}
                          >

                            {item.shap_value >
                            0
                              ? '+'
                              : ''}

                            {item.shap_value.toFixed(
                              2
                            )}

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

              ) : (

                <div className="rounded-lg border border-[#242c27] p-4 text-center">

                  <p className="text-xs text-[#86948a]">
                    Model explanation is
                    currently unavailable.
                  </p>

                </div>

              )}

              {/* ==================================================
                  HOW TO READ THIS
                  ================================================== */}

              <div className="mt-5 rounded-lg border border-[#242c27] bg-[#111914] p-4">

                <div className="flex items-center gap-2 mb-2">

                  <span className="text-sm">
                    💡
                  </span>

                  <span className="text-xs font-bold text-[#dde4dd] uppercase tracking-wider">
                    How to read this
                  </span>

                </div>

                <p className="text-[11px] text-[#86948a] leading-relaxed">

                  <span className="text-[#4edea3] font-medium">
                    Green factors
                  </span>{' '}
                  pushed the model toward
                  lower risk.{' '}

                  <span className="text-red-400 font-medium">
                    Red factors
                  </span>{' '}
                  pushed it toward higher risk.

                  <br />

                  These factors explain the
                  model's prediction and are not
                  guarantees or direct causes of
                  loan default.

                </p>

              </div>

            </div>

            {/* ==================================================
                ACTION BUTTONS
                ================================================== */}

            <div className="flex items-center justify-between pt-2">

              <button
                onClick={() => {
                  setResult(null);
                  setXaiFactors([]);
                }}
                className="text-xs text-[#86948a] hover:text-[#dde4dd] underline"
              >
                Re-calculate
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenApply();
                }}
                className="flex items-center space-x-2 rounded-full bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3]"
              >

                <span>
                  PROCEED TO FORMAL APPLICATION
                </span>

                <ArrowRight className="h-4 w-4" />

              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};