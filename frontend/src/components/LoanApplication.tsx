import React, { useState, useEffect } from "react";
import { api, formatINR } from "../api";
import {
  ArrowLeft,
  User,
  Briefcase,
  Wallet,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Target
} from "lucide-react";
import { FinancialProfile } from "../types";

interface LoanApplicationProps {
  onBack: () => void;
  onOpenAIChat?: () => void;
  /** Optional: navigate to another authenticated page (e.g. recovery, digital-twin) */
  onNavigate?: (page: string) => void;
}

interface PredictionFactor {
  feature: string;
  value: number | string | undefined;
  shap_value: number;
  impact: string;
}

interface PredictionResult {
  default_risk: boolean;
  default_probability: number;
  decision: string;
  predicted_loan_amount: number;
  xai_factors?: PredictionFactor[];
}

const LoanApplication: React.FC<LoanApplicationProps> = ({
  onBack,
  onOpenAIChat,
  onNavigate,
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [prediction, setPrediction] =
    useState<PredictionResult | null>(null);

  const [formData, setFormData] = useState({
    age: "",
    employment: "",
    education: "",
    dependents: "",

    annualIncome: "",
    monthlyExpenses: "",
    existingDebt: "",
    savings: "",

    loanAmount: "",
    loanPurpose: "",
    loanTerm: "",

    creditScore: "",
    creditHistory: "",
    previousDefault: "",
  });

  // ============================================================
  // PRE-FILL FROM AUTHENTICATED FINANCIAL PROFILE
  // ============================================================
  useEffect(() => {
    let mounted = true;
    async function prefillFromProfile() {
      try {
        const profile = await api.get<FinancialProfile>('/financial-profile');
        if (mounted && profile) {
          setFormData((prev) => ({
            ...prev,
            // Financial step pre-fill
            annualIncome: profile.annual_income > 0 ? String(profile.annual_income) : prev.annualIncome,
            monthlyExpenses: profile.monthly_expenses > 0 ? String(profile.monthly_expenses) : prev.monthlyExpenses,
            existingDebt: profile.existing_debt > 0 ? String(profile.existing_debt) : prev.existingDebt,
            savings: profile.savings > 0 ? String(profile.savings) : prev.savings,
            // Credit step pre-fill
            creditScore: profile.credit_score > 0 ? String(profile.credit_score) : prev.creditScore,
            // Employment status pre-fill
            employment: profile.employment_status ? profile.employment_status : prev.employment,
          }));
          setProfileLoaded(true);
        }
      } catch {
        // Profile not available — form stays blank, user fills manually
        if (mounted) setProfileLoaded(false);
      }
    }
    prefillFromProfile();
    return () => { mounted = false; };
  }, []);

  // ============================================================
  // UPDATE FORM
  // ============================================================

  const updateField = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateStep = (currentStep: number): boolean => {
    setError("");

    if (currentStep === 1) {
      // Step 1: Personal Information — Age, Dependents, Employment, Education
      const age = Number(formData.age);
      if (!formData.age || isNaN(age) || age < 18 || age > 80) {
        setError("Please enter a valid applicant age between 18 and 80 years.");
        return false;
      }
      if (!formData.employment) {
        setError("Please select your current employment status.");
        return false;
      }
      // NOTE: Annual Income is on Step 2 — do NOT validate it here.
    } else if (currentStep === 2) {
      // Step 2: Financial Information — Annual Income, Expenses, Debt, Savings
      const income = Number(formData.annualIncome);
      if (!formData.annualIncome || isNaN(income) || income <= 0) {
        setError("Please enter a valid gross annual income greater than ₹0.");
        return false;
      }
      const expenses = Number(formData.monthlyExpenses);
      if (formData.monthlyExpenses === "" || isNaN(expenses) || expenses < 0) {
        setError("Please enter valid monthly expenses (₹0 or greater).");
        return false;
      }
      const debt = Number(formData.existingDebt);
      if (isNaN(debt) || debt < 0) {
        setError("Existing debt cannot be a negative value.");
        return false;
      }
      const savings = Number(formData.savings);
      if (isNaN(savings) || savings < 0) {
        setError("Savings amount cannot be a negative value.");
        return false;
      }
    } else if (currentStep === 3) {
      const amount = Number(formData.loanAmount);
      if (!formData.loanAmount || isNaN(amount) || amount <= 0) {
        setError("Please enter a requested loan amount greater than ₹0.");
        return false;
      }
      if (!formData.loanPurpose) {
        setError("Please select your loan purpose.");
        return false;
      }
      const term = Number(formData.loanTerm);
      if (!formData.loanTerm || isNaN(term) || term <= 0) {
        setError("Please select a valid loan tenure.");
        return false;
      }
    } else if (currentStep === 4) {
      const score = Number(formData.creditScore);
      if (!formData.creditScore || isNaN(score) || score < 300 || score > 850) {
        setError("Please enter a valid credit score between 300 and 850.");
        return false;
      }
    }

    return true;
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
        setError("");
      }
    }
  };

  const previousStep = () => {
    setError("");

    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  // ============================================================
  // AI EXPLANATION - FEATURE NAME
  // ============================================================

  const formatFeatureName = (
    feature: string
  ) => {
    const names: Record<string, string> = {
      deferral_term: "Deferral Term",
      issue_year: "Issue Year",
      credit_per_year:
        "Credit Accounts per Year",
      funded_amnt_inv:
        "Funded Loan Amount",
      revol_util:
        "Revolving Credit Utilization",
      credit_history_length:
        "Credit History Length",

      purpose_medical:
        "Medical Loan Purpose",

      purpose_home_improvement:
        "Home Improvement Purpose",

      purpose_education:
        "Education Loan Purpose",

      purpose_business:
        "Business Loan Purpose",

      purpose_car:
        "Vehicle Loan Purpose",

      purpose_debt_consolidation:
        "Debt Consolidation Purpose",

      dti:
        "Debt-to-Income Ratio",

      fico_range_low:
        "Credit Score",

      fico_range_high:
        "Credit Score Range",

      annual_inc:
        "Annual Income",

      loan_amnt:
        "Requested Loan Amount",

      installment:
        "Monthly Installment",

      revol_bal:
        "Revolving Balance",

      open_acc:
        "Open Credit Accounts",

      total_acc:
        "Total Credit Accounts",

      pub_rec:
        "Public Records",

      delinq_2yrs:
        "Recent Delinquencies",

      inq_last_6mths:
        "Recent Credit Inquiries",

      loan_to_income:
        "Loan-to-Income Ratio",

      installment_to_income:
        "Installment-to-Income Ratio",

      revol_bal_to_income:
        "Revolving Balance-to-Income Ratio",

      loan_per_open_acc:
        "Loan per Open Account",

      revol_per_open_acc:
        "Revolving Balance per Account",

      inq_per_year:
        "Inquiries per Year",

      delinq_per_year:
        "Delinquencies per Year",

      pub_rec_per_year:
        "Public Records per Year",
    };

    return (
      names[feature] ||
      feature
        .replace(/_/g, " ")
        .replace(
          /\b\w/g,
          (char) => char.toUpperCase()
        )
    );
  };

  // ============================================================
  // AI EXPLANATION - VALUE
  // ============================================================

  const formatFeatureValue = (
    feature: string,
    value: unknown
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "Not provided";
    }

    const numberValue = Number(value);

    if (!Number.isNaN(numberValue)) {

      // Percentages
      if (
        feature === "revol_util" ||
        feature === "dti"
      ) {
        return `${numberValue.toFixed(2)}%`;
      }

      // Credit history
      if (
        feature === "credit_history_length"
      ) {
        const months = Math.round(
          numberValue
        );

        if (months >= 12) {
          const years = Math.floor(
            months / 12
          );

          const remainingMonths =
            months % 12;

          if (remainingMonths === 0) {
            return `${years} year${
              years !== 1 ? "s" : ""
            }`;
          }

          return `${years}y ${remainingMonths}m`;
        }

        return `${months} months`;
      }

      // Purpose fields
      if (
        feature.startsWith("purpose_")
      ) {
        return numberValue === 1
          ? "Yes"
          : "No";
      }

      // Currency
      if (
        feature === "annual_inc" ||
        feature === "loan_amnt" ||
        feature === "funded_amnt_inv" ||
        feature === "installment" ||
        feature === "revol_bal"
      ) {
        return `₹${Math.round(
          numberValue
        ).toLocaleString("en-IN")}`;
      }

      // Ratios
      if (
        feature === "credit_per_year" ||
        feature === "inq_per_year" ||
        feature === "delinq_per_year" ||
        feature === "pub_rec_per_year" ||
        feature === "loan_to_income" ||
        feature ===
          "installment_to_income" ||
        feature ===
          "revol_bal_to_income"
      ) {
        return numberValue.toFixed(2);
      }

      // Integers
      if (
        Number.isInteger(numberValue)
      ) {
        return numberValue.toLocaleString(
          "en-IN"
        );
      }

      return numberValue.toFixed(2);
    }

    return String(value);
  };

  // ============================================================
  // AI EXPLANATION - IMPACT
  // ============================================================

  const getImpactDisplay = (
    impact: string
  ) => {
    if (
      impact ===
      "increases_default_risk"
    ) {
      return {
        label:
          "Increases default risk",

        icon: "⚠",

        className:
          "border-orange-400/30 bg-orange-400/5 text-orange-300",
      };
    }

    return {
      label:
        "Decreases default risk",

      icon: "✓",

      className:
        "border-[#4edea3]/30 bg-[#4edea3]/5 text-[#4edea3]",
    };
  };

  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // --- Safe numeric conversion: strip commas/spaces, then parse ---
      const annualIncome = parseFloat(
        String(formData.annualIncome).replace(/[,\s₹]/g, "")
      );

      // Safety guard: annualIncome must be a positive number before we call /predict
      if (!annualIncome || isNaN(annualIncome) || annualIncome <= 0) {
        setError("Please enter a valid gross annual income greater than ₹0.");
        setLoading(false);
        return;
      }

      const monthlyExpenses = parseFloat(
        String(formData.monthlyExpenses).replace(/[,\s₹]/g, "")
      ) || 0;

      const existingDebt = parseFloat(
        String(formData.existingDebt).replace(/[,\s₹]/g, "")
      ) || 0;

      const savings = parseFloat(
        String(formData.savings).replace(/[,\s₹]/g, "")
      ) || 0;

      const loanAmount = parseFloat(
        String(formData.loanAmount).replace(/[,\s₹]/g, "")
      ) || 0;

      const age =
        Number(formData.age) || 0;

      const dependents =
        Number(
          formData.dependents
        ) || 0;

      const creditScore =
        Number(
          formData.creditScore
        ) || 0;

      const loanTerm =
        Number(formData.loanTerm) || 36;

      const monthlyIncome =
        annualIncome / 12;

      const dti =
        annualIncome > 0
          ? (existingDebt /
              annualIncome) *
            100
          : 0;

      const installment =
        loanAmount > 0 &&
        loanTerm > 0
          ? loanAmount / loanTerm
          : 0;

      const revolBal =
        Math.max(
          0,
          existingDebt
        );

      const totalAccounts =
        Math.max(
          1,
          5 + dependents
        );

      // ========================================================
      // FASTAPI PAYLOAD
      // ========================================================

      const payload = {
        loan_amnt: loanAmount,

        annual_inc:
          annualIncome,

        installment:
          installment,

        dti: dti,

        fico_range_low:
          creditScore > 0
            ? creditScore
            : 650,

        fico_range_high:
          creditScore > 0
            ? creditScore + 5
            : 655,

        loan_term:
          loanTerm,

        term:
          loanTerm,

        purpose:
          formData.loanPurpose ||
          "personal",

        emp_length:
          formData.employment ===
          "salaried"
            ? "5 years"
            : formData.employment ===
              "self-employed"
            ? "5 years"
            : "< 1 year",

        home_ownership:
          "RENT",

        verification_status:
          "Source Verified",

        grade:
          creditScore >= 750
            ? "A"
            : creditScore >= 700
            ? "B"
            : creditScore >= 650
            ? "C"
            : "D",

        sub_grade:
          creditScore >= 750
            ? "A3"
            : creditScore >= 700
            ? "B3"
            : creditScore >= 650
            ? "C3"
            : "D3",

        int_rate: 12,

        revol_bal:
          revolBal,

        revol_util:
          annualIncome > 0
            ? Math.min(
                100,
                (existingDebt /
                  Math.max(
                    annualIncome / 2,
                    1
                  )) *
                  100
              )
            : 30,

        open_acc:
          Math.max(
            3,
            totalAccounts
          ),

        total_acc:
          Math.max(
            5,
            totalAccounts
          ),

        pub_rec:
          formData.previousDefault ===
          "yes"
            ? 1
            : 0,

        delinq_2yrs:
          formData.previousDefault ===
          "yes"
            ? 1
            : 0,

        inq_last_6mths: 0,

        mort_acc: 0,

        pub_rec_bankruptcies:
          formData.previousDefault ===
          "yes"
            ? 1
            : 0,

        collections_12_mths_ex_med: 0,

        tax_liens: 0,

        acc_now_delinq:
          formData.previousDefault ===
          "yes"
            ? 1
            : 0,

        chargeoff_within_12_mths:
          formData.previousDefault ===
          "yes"
            ? 1
            : 0,

        title:
          formData.loanPurpose ||
          "Personal Loan",

        annual_income:
          annualIncome,

        monthly_income:
          monthlyIncome,

        monthly_expenses:
          monthlyExpenses,

        existing_debt:
          existingDebt,

        savings:
          savings,

        age:
          age,

        dependents:
          dependents,
      };

      console.log(
        "Sending prediction request:",
        payload
      );

      // ========================================================
      // FASTAPI REQUEST (AUTHENTICATED WITH BEARER TOKEN)
      // ========================================================

      const data = await api.post("/predict", payload);

      // Cache latest prediction and application for AI Advisor / Recovery Planner context
      try {
        const appContext = {
          ...formData,
          // resolved numeric values
          annualIncome,
          monthlyExpenses,
          existingDebt,
          savings,
          loanAmount,
          creditScore,
        };
        localStorage.setItem("lifeloan_last_application", JSON.stringify(appContext));
        localStorage.setItem("lifeloan_last_prediction", JSON.stringify(data));

        // Prime AI Advisor with assessment context so it responds immediately with relevance
        const decision = data.decision || "Unknown";
        const riskPct = data.default_probability != null
          ? Math.round(data.default_probability * 100)
          : null;
        const aiPrompt =
          `My LifeLoan assessment just completed. Decision: ${decision}. ` +
          (riskPct != null ? `Default risk: ${riskPct}%. ` : "") +
          `Requested: ₹${Math.round(loanAmount).toLocaleString("en-IN")} for ${formData.loanPurpose || "personal"} over ${loanTerm} months. ` +
          `Annual income: ₹${Math.round(annualIncome).toLocaleString("en-IN")}. ` +
          `Existing debt: ₹${Math.round(existingDebt).toLocaleString("en-IN")}. ` +
          `Credit score: ${creditScore}. ` +
          `Please explain this result and suggest how I can improve my position.`;
        localStorage.setItem("lifeloan_chat_initial_prompt", aiPrompt);
      } catch (e) {
        console.warn("Could not save to localStorage cache:", e);
      }

      setPrediction(data);
      setStep(5);

    } catch (err: any) {

      console.error(
        "Prediction error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the LifeLoan AI system."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESULT VALUES
  // ============================================================

  const probability =
    prediction
      ? Math.round(
          prediction.default_probability *
            100
        )
      : 0;

  const approvalProbability =
    prediction
      ? Math.round(
          (1 -
            prediction.default_probability) *
            100
        )
      : 0;

  const isApproved =
    prediction?.decision ===
    "Approved";

  // ============================================================
  // RESULT PAGE
  // ============================================================

  if (
    step === 5 &&
    prediction
  ) {
    return (
      <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

        {/* HEADER */}

        <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-[#9aa9a1] transition hover:text-[#4edea3]"
            >
              <ArrowLeft className="h-4 w-4" />

              Back to Dashboard
            </button>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">

                <ShieldCheck className="h-4 w-4 text-[#003824]" />

              </div>

              <span className="font-serif text-xl font-bold">
                Life
                <span className="text-[#4edea3]">
                  Loan
                </span>
              </span>

            </div>

            <div className="w-[130px]" />

          </div>

        </header>

        {/* MAIN */}

        <main className="mx-auto max-w-5xl px-6 py-10">

          {/* PAGE TITLE */}

          <div className="mb-10 text-center">

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
              AI LOAN ASSESSMENT
            </p>

            <h1 className="font-serif text-4xl font-bold">
              Your LifeLoan Assessment
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#819087]">
              Your application has been evaluated
              using the LifeLoan machine learning
              system.
            </p>

          </div>

          {/* RESULT CARDS */}

          <div className="grid gap-6 lg:grid-cols-3">

            {/* DECISION */}

            <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-7 lg:col-span-2">

              <div className="flex flex-col items-center justify-center py-6 text-center">

                <div
                  className={`
                    flex h-20 w-20
                    items-center justify-center
                    rounded-full
                    ${
                      isApproved
                        ? "bg-[#10b981]/10"
                        : "bg-red-500/10"
                    }
                  `}
                >

                  {isApproved ? (
                    <CheckCircle2 className="h-10 w-10 text-[#4edea3]" />
                  ) : (
                    <AlertCircle className="h-10 w-10 text-red-400" />
                  )}

                </div>

                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#71837a]">
                  AI Decision
                </p>

                <h2
                  className={`
                    mt-2 font-serif text-4xl font-bold
                    ${
                      isApproved
                        ? "text-[#4edea3]"
                        : "text-red-400"
                    }
                  `}
                >
                  {prediction.decision}
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-[#819087]">

                  {isApproved
                    ? "Your application shows a relatively lower predicted probability of loan default based on the information provided."
                    : "Your application shows a higher predicted probability of loan default based on the information provided."}

                </p>

              </div>

              {/* PROBABILITIES */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                {/* APPROVAL */}

                <div className="rounded-2xl border border-[#242c27] bg-[#101713] p-5">

                  <p className="text-xs text-[#71837a]">
                    Approval Probability
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#4edea3]">
                    {approvalProbability}%
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#242c27]">

                    <div
                      className="h-full rounded-full bg-[#10b981]"
                      style={{
                        width: `${approvalProbability}%`,
                      }}
                    />

                  </div>

                </div>

                {/* DEFAULT */}

                <div className="rounded-2xl border border-[#242c27] bg-[#101713] p-5">

                  <p className="text-xs text-[#71837a]">
                    Default Risk
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {probability}%
                  </p>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#242c27]">

                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{
                        width: `${probability}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* LOAN AMOUNTS — REQUESTED vs AI RECOMMENDED */}

            <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-7 space-y-5">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">
                <TrendingUp className="h-5 w-5 text-[#4edea3]" />
              </div>

              {/* Requested */}
              <div className="rounded-xl border border-[#242c27] bg-[#101713] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                  You Requested
                </p>
                <p className="mt-1 text-xl font-bold text-[#dde4dd]">
                  {formatINR(
                    Number(
                      String((() => {
                        try {
                          const app = JSON.parse(localStorage.getItem("lifeloan_last_application") || "{}");
                          return app.loanAmount || 0;
                        } catch { return 0; }
                      })()).replace(/[,\s₹]/g, "") || "0"
                    )
                  )}
                </p>
              </div>

              {/* AI Recommended */}
              <div className="rounded-xl border border-[#4edea3]/20 bg-[#10b981]/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-[#4edea3]/70">
                  AI Recommended Amount
                </p>
                <p className="mt-1 text-xl font-bold text-[#4edea3]">
                  {formatINR(Math.round(Number(prediction.predicted_loan_amount || 0)))}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#71837a]">
                  Based on LifeLoan's ML model — not a guaranteed lender offer.
                </p>
              </div>

            </div>

          </div>

          {/* =====================================================
              AI EXPLANATION
          ===================================================== */}

          <section className="mt-8 rounded-3xl border border-[#242c27] bg-[#161d19] p-7">

            {/* HEADER */}

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/10">

                <ShieldCheck className="h-5 w-5 text-[#4edea3]" />

              </div>

              <div>

                <h2 className="font-serif text-2xl font-bold">
                  AI Explanation
                </h2>

                <p className="mt-1 text-xs leading-5 text-[#71837a]">
                  Key factors that influenced your
                  LifeLoan assessment.
                </p>

              </div>

            </div>

            {/* EXPLANATION INTRO */}

            <div className="mt-6 rounded-2xl border border-[#242c27] bg-[#101713] p-5">

              <div className="flex gap-3">

                <div className="mt-0.5 text-[#4edea3]">
                  ✦
                </div>

                <div>

                  <p className="text-sm font-semibold text-[#dde4dd]">
                    Why did the AI make this decision?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#71837a]">

                    These are the strongest factors
                    identified by the machine learning
                    model. They show whether each factor
                    contributed toward higher or lower
                    predicted default risk.

                  </p>

                </div>

              </div>

            </div>

            {/* FACTORS */}

            <div className="mt-5 space-y-3">

              {prediction.xai_factors &&
              prediction.xai_factors.length > 0 ? (

                prediction.xai_factors
                  .slice(0, 7)
                  .map(
                    (
                      factor,
                      index
                    ) => {

                      const impact =
                        getImpactDisplay(
                          factor.impact
                        );

                      return (

                        <div
                          key={`${factor.feature}-${index}`}
                          className="rounded-2xl border border-[#242c27] bg-[#101713] p-5 transition-all duration-200 hover:border-[#3c4a42]"
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            {/* FEATURE */}

                            <div className="min-w-0">

                              <div className="flex items-center gap-2">

                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#161d19] text-xs font-bold text-[#71837a]">
                                  {index + 1}
                                </span>

                                <p className="text-sm font-semibold text-[#dde4dd]">

                                  {formatFeatureName(
                                    factor.feature
                                  )}

                                </p>

                              </div>

                              {/* VALUE */}

                              <div className="mt-3 flex items-center gap-2">

                                <span className="text-xs text-[#71837a]">
                                  Your value:
                                </span>

                                <span className="text-sm font-semibold text-[#dde4dd]">

                                  {formatFeatureValue(
                                    factor.feature,
                                    factor.value
                                  )}

                                </span>

                              </div>

                            </div>

                            {/* IMPACT */}

                            <div
                              className={`
                                inline-flex
                                w-fit
                                shrink-0
                                items-center
                                gap-2
                                rounded-full
                                border
                                px-3
                                py-2
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wider
                                ${impact.className}
                              `}
                            >

                              <span className="text-xs">
                                {impact.icon}
                              </span>

                              {impact.label}

                            </div>

                          </div>

                        </div>

                      );
                    }
                  )

              ) : (

                <div className="rounded-2xl border border-[#242c27] bg-[#101713] p-5">

                  <p className="text-sm text-[#71837a]">
                    No explanation factors were
                    returned by the model.
                  </p>

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="mt-5 border-t border-[#242c27] pt-5">

              <p className="text-[11px] leading-5 text-[#52625a]">

                <span className="font-semibold text-[#71837a]">
                  Note:
                </span>{" "}

                These factors explain the model's
                prediction and are not individual
                approval or rejection rules. The final
                assessment is generated from the combined
                effect of multiple financial factors.

              </p>

            </div>

          </section>

{/* =====================================================
    ASK LIFELOAN AI
===================================================== */}

<section className="mt-8 rounded-3xl border border-[#10b981]/20 bg-[#161d19] p-7">

  <div className="flex flex-col items-center text-center">

    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">
      <Sparkles className="h-5 w-5 text-[#4edea3]" />
    </div>

    <h2 className="mt-4 font-serif text-2xl font-bold">
      Have questions about your assessment?
    </h2>

    <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#71837a]">
      Ask LifeLoan AI why your application received this
      result, which factors affected your risk, or how
      you can improve your borrowing position.
    </p>

    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => {
          // AI context is already primed in localStorage — just open
          onOpenAIChat?.();
        }}
        className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3]"
      >
        <Sparkles className="h-4 w-4" />
        Ask LifeLoan AI
      </button>

      {!isApproved && (
        <>
          <button
            type="button"
            onClick={() => {
              // Go back to form step 3 (Loan Details) so user can reduce requested amount
              setPrediction(null);
              setStep(3);
              setError("");
            }}
            className="flex items-center gap-2 rounded-xl border border-[#3c4a42] bg-[#161d19] px-6 py-3 text-xs font-semibold text-[#dde4dd] transition hover:border-[#4edea3]/40 hover:text-[#4edea3]"
          >
            <RotateCcw className="h-4 w-4" />
            Try Lower Loan Amount
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('recovery')}
              className="flex items-center gap-2 rounded-xl border border-[#3c4a42] bg-[#161d19] px-6 py-3 text-xs font-semibold text-[#dde4dd] transition hover:border-[#4edea3]/40 hover:text-[#4edea3]"
            >
              <Target className="h-4 w-4" />
              View Recovery Plan
            </button>
          )}
        </>
      )}
    </div>

  </div>

</section>

          {/* REJECTION GUIDANCE */}

          {!isApproved && (
            <section className="mt-6 rounded-3xl border border-orange-400/20 bg-orange-400/5 p-7">
              <h3 className="text-sm font-bold text-orange-300">Next Steps to Improve Your Position</h3>
              <ul className="mt-4 space-y-2">
                {[
                  "Reduce your existing debt before reapplying",
                  "Increase your savings to improve your debt-to-income ratio",
                  "Build your credit score by maintaining on-time payments",
                  "Consider requesting a lower loan amount",
                  "Use the Financial Recovery Planner for a personalised action plan",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-orange-200/80">
                    <span className="mt-0.5 shrink-0 text-orange-400">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* DISCLAIMER */}

          <div className="mt-6 rounded-2xl border border-[#242c27] bg-[#121914] p-5">

            <p className="text-xs leading-5 text-[#71837a]">

              This assessment is generated by the
              LifeLoan machine learning system and should
              be treated as an AI-assisted assessment
              rather than a guaranteed lending decision.
              Final lending decisions may require
              additional verification.

            </p>

          </div>

          {/* RETURN */}

          <div className="mt-8 text-center">

            <button
              onClick={onBack}
              className="rounded-xl bg-[#10b981] px-7 py-3 text-sm font-bold text-[#003824] transition hover:bg-[#4edea3]"
            >
              Return to Dashboard
            </button>

          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // APPLICATION PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

          <button
            onClick={previousStep}
            className="flex items-center gap-2 text-sm text-[#9aa9a1] transition hover:text-[#4edea3]"
          >

            <ArrowLeft className="h-4 w-4" />

            {step === 1
              ? "Back to Dashboard"
              : "Previous"}

          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">

              <FileText className="h-4 w-4 text-[#003824]" />

            </div>

            <span className="font-serif text-xl font-bold">

              Life
              <span className="text-[#4edea3]">
                Loan
              </span>

            </span>

          </div>

          <div className="w-[130px]" />

        </div>

      </header>

      {/* MAIN */}

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* TITLE */}

        <section className="mb-10 text-center">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
            LOAN APPLICATION
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight">
            Apply for a Loan
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#819087]">

            Tell us about your financial situation.
            LifeLoan will use this information to assess
            your borrowing profile.

          </p>

        </section>

        {/* PROGRESS */}

        <div className="mb-8">

          <div className="mb-3 flex items-center justify-between">

            {[1, 2, 3, 4].map(
              (item) => (

                <div
                  key={item}
                  className="flex items-center"
                >

                  <div
                    className={`
                      flex h-9 w-9
                      items-center justify-center
                      rounded-full border
                      text-xs font-bold

                      ${
                        step >= item
                          ? "border-[#4edea3] bg-[#10b981] text-[#003824]"
                          : "border-[#3c4a42] bg-[#161d19] text-[#71837a]"
                      }
                    `}
                  >

                    {step > item ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      item
                    )}

                  </div>

                  {item < 4 && (

                    <div
                      className={`
                        mx-2 h-[2px]
                        w-10 sm:w-24

                        ${
                          step > item
                            ? "bg-[#10b981]"
                            : "bg-[#242c27]"
                        }
                      `}
                    />

                  )}

                </div>

              )
            )}

          </div>

          <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#71837a]">

            <span>Personal</span>
            <span>Financial</span>
            <span>Loan</span>
            <span>Credit</span>

          </div>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-2xl sm:p-8"
        >

          {/* ==================================================
              STEP 1
          ================================================== */}

          {step === 1 && (

            <div>

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                  <User className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Step 1 of 4 — Personal Profile
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Tell us about yourself so LifeLoan can personalise your assessment.
                  </p>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* AGE */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Age
                  </label>

                  <input
                    type="number"
                    min="18"
                    max="100"
                    placeholder="e.g. 28"
                    value={formData.age}
                    onChange={(e) =>
                      updateField(
                        "age",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* DEPENDENTS */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Number of Dependents
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2"
                    value={formData.dependents}
                    onChange={(e) =>
                      updateField(
                        "dependents",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* EMPLOYMENT */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Employment Status
                  </label>

                  <select
                    value={formData.employment}
                    onChange={(e) =>
                      updateField(
                        "employment",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  >

                    <option value="">
                      Select employment
                    </option>

                    <option value="salaried">
                      Salaried
                    </option>

                    <option value="self-employed">
                      Self-employed
                    </option>

                    <option value="business">
                      Business Owner
                    </option>

                    <option value="freelancer">
                      Freelancer
                    </option>

                    <option value="student">
                      Student
                    </option>

                    <option value="unemployed">
                      Unemployed
                    </option>

                  </select>

                </div>

                {/* EDUCATION */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Education
                  </label>

                  <select
                    value={formData.education}
                    onChange={(e) =>
                      updateField(
                        "education",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  >

                    <option value="">
                      Select education
                    </option>

                    <option value="high-school">
                      High School
                    </option>

                    <option value="graduate">
                      Graduate
                    </option>

                    <option value="post-graduate">
                      Post Graduate
                    </option>

                    <option value="professional">
                      Professional Degree
                    </option>

                  </select>

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              STEP 2
          ================================================== */}

          {step === 2 && (

            <div>

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                  <Wallet className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Step 2 of 4 — Financial Profile
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    {profileLoaded
                      ? "Pre-filled from your LifeLoan profile — edit freely for this application."
                      : "Help LifeLoan understand your current financial position."}
                  </p>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* ANNUAL INCOME */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Annual Income (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 600000"
                    value={formData.annualIncome}
                    onChange={(e) =>
                      updateField(
                        "annualIncome",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* EXPENSES */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Monthly Expenses (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={formData.monthlyExpenses}
                    onChange={(e) =>
                      updateField(
                        "monthlyExpenses",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* DEBT */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Existing Debt (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100000"
                    value={formData.existingDebt}
                    onChange={(e) =>
                      updateField(
                        "existingDebt",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* SAVINGS */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Current Savings (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    value={formData.savings}
                    onChange={(e) =>
                      updateField(
                        "savings",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              STEP 3
          ================================================== */}

          {step === 3 && (

            <div>

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                  <Briefcase className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Step 3 of 4 — Loan Request
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Tell us what you need — amount, purpose and preferred tenure.
                  </p>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* LOAN AMOUNT */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Requested Loan Amount (₹)
                  </label>

                  <input
                    type="number"
                    min="1000"
                    placeholder="e.g. 500000"
                    value={formData.loanAmount}
                    onChange={(e) =>
                      updateField(
                        "loanAmount",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  />

                </div>

                {/* TERM */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Loan Term
                  </label>

                  <select
                    value={formData.loanTerm}
                    onChange={(e) =>
                      updateField(
                        "loanTerm",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  >

                    <option value="">
                      Select term
                    </option>

                    <option value="12">
                      12 months
                    </option>

                    <option value="24">
                      24 months
                    </option>

                    <option value="36">
                      36 months
                    </option>

                    <option value="48">
                      48 months
                    </option>

                    <option value="60">
                      60 months
                    </option>

                    <option value="84">
                      84 months
                    </option>

                  </select>

                </div>

                {/* PURPOSE */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-xs font-semibold">
                    Loan Purpose
                  </label>

                  <select
                    value={formData.loanPurpose}
                    onChange={(e) =>
                      updateField(
                        "loanPurpose",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  >

                    <option value="">
                      Select purpose
                    </option>

                    <option value="personal">
                      Personal
                    </option>

                    <option value="education">
                      Education
                    </option>

                    <option value="home">
                      Home
                    </option>

                    <option value="vehicle">
                      Vehicle
                    </option>

                    <option value="business">
                      Business
                    </option>

                    <option value="medical">
                      Medical
                    </option>

                    <option value="debt_consolidation">
                      Debt Consolidation
                    </option>

                  </select>

                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              STEP 4
          ================================================== */}

          {step === 4 && (

            <div>

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10b981]/10">

                  <Briefcase className="h-5 w-5 text-[#4edea3]" />

                </div>

                <div>

                  <h2 className="text-xl font-bold">
                    Step 4 of 4 — Credit Profile
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    {profileLoaded
                      ? "Credit score pre-filled from your LifeLoan profile — confirm before submitting."
                      : "Complete your credit profile to finalise the assessment."}
                  </p>

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* CREDIT SCORE */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Credit Score
                  </label>

                  <input
                    type="number"
                    min="300"
                    max="900"
                    placeholder="e.g. 750"
                    value={formData.creditScore}
                    onChange={(e) =>
                      updateField(
                        "creditScore",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                  />

                  <p className="mt-2 text-[10px] text-[#52625a]">
                    Leave blank if you don't have a credit score.
                  </p>

                </div>

                {/* CREDIT HISTORY */}

                <div>

                  <label className="mb-2 block text-xs font-semibold">
                    Credit History
                  </label>

                  <select
                    value={formData.creditHistory}
                    onChange={(e) =>
                      updateField(
                        "creditHistory",
                        e.target.value
                      )
                    }
                    className="lifeloan-input"
                    required
                  >

                    <option value="">
                      Select history
                    </option>

                    <option value="excellent">
                      Excellent
                    </option>

                    <option value="good">
                      Good
                    </option>

                    <option value="fair">
                      Fair
                    </option>

                    <option value="poor">
                      Poor
                    </option>

                    <option value="no-history">
                      No Credit History
                    </option>

                  </select>

                </div>

                {/* DEFAULT */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-xs font-semibold">
                    Have you previously defaulted on a loan?
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "previousDefault",
                          "yes"
                        )
                      }
                      className={`
                        rounded-xl border px-4 py-3
                        text-sm transition

                        ${
                          formData.previousDefault ===
                          "yes"
                            ? "border-[#4edea3] bg-[#10b981]/10 text-[#4edea3]"
                            : "border-[#3c4a42] bg-[#101713] text-[#9aa9a1]"
                        }
                      `}
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          "previousDefault",
                          "no"
                        )
                      }
                      className={`
                        rounded-xl border px-4 py-3
                        text-sm transition

                        ${
                          formData.previousDefault ===
                          "no"
                            ? "border-[#4edea3] bg-[#10b981]/10 text-[#4edea3]"
                            : "border-[#3c4a42] bg-[#101713] text-[#9aa9a1]"
                        }
                      `}
                    >
                      No
                    </button>

                  </div>

                </div>

              </div>

              <div className="mt-6 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-4">

                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />
                  <p className="text-xs leading-5 text-[#71837a]">
                    <span className="font-semibold text-[#4edea3]">Ready for AI Assessment. </span>
                    Clicking "Run AI Assessment" will send your data to LifeLoan's trained
                    machine learning model. The model evaluates default risk and recommends
                    an appropriate loan amount based on your financial profile.
                  </p>
                </div>

              </div>

            </div>

          )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

              <div>

                <p className="text-xs font-semibold text-red-300">
                  {step === 5 ? "Assessment failed" : "Please correct the following"}
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300/70">
                  {error}
                </p>

              </div>

            </div>

          )}

          {/* ==================================================
              NAVIGATION
          ================================================== */}

          <div className="mt-10 flex items-center justify-between border-t border-[#242c27] pt-6">

            <button
              type="button"
              onClick={previousStep}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#3c4a42] px-5 py-3 text-xs font-semibold text-[#9aa9a1] transition hover:border-[#4edea3]/40 hover:text-[#dde4dd] disabled:opacity-50"
            >

              <ChevronLeft className="h-4 w-4" />

              Back

            </button>

            {step < 4 ? (

              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3]"
              >

                Continue

                <ChevronRight className="h-4 w-4" />

              </button>

            ) : (

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3] disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-[#10b981]/20"
              >

                {loading ? (

                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running AI Assessment...
                  </>

                ) : (

                  <>
                    <Sparkles className="h-4 w-4" />
                    Run AI Assessment
                  </>

                )}

              </button>

            )}

          </div>

        </form>

      </main>

    </div>
  );
};

export default LoanApplication;