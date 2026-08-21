import React, { useState } from "react";
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
} from "lucide-react";

interface LoanApplicationProps {
  onBack: () => void;
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
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  // NAVIGATION
  // ============================================================

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
      setError("");
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

      if (
        feature === "revol_util" ||
        feature === "dti"
      ) {
        return `${numberValue.toFixed(2)}%`;
      }

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

      if (
        feature.startsWith("purpose_")
      ) {
        return numberValue === 1
          ? "Yes"
          : "No";
      }

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
      const annualIncome =
        Number(formData.annualIncome) || 0;

      const monthlyExpenses =
        Number(
          formData.monthlyExpenses
        ) || 0;

      const existingDebt =
        Number(
          formData.existingDebt
        ) || 0;

      const savings =
        Number(formData.savings) || 0;

      const loanAmount =
        Number(formData.loanAmount) || 0;

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
      // FASTAPI REQUEST
      // ========================================================

      const response =
        await fetch(
          "http://127.0.0.1:8000/predict",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              payload
            ),
          }
        );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to process your application."
        );
      }

      console.log(
        "ML prediction:",
        data
      );

      // ========================================================
      // SAVE APPROVED LOAN TO DATABASE
      // ========================================================

      if (data.decision === "Approved") {

        const userId =
          localStorage.getItem("user_id") ||
          "1";

        const loanPayload = {
          title:
            formData.loanPurpose
              ? `${formData.loanPurpose.charAt(0).toUpperCase()}${formData.loanPurpose.slice(1)} Loan`
              : "Personal Loan",

          loan_type:
            formData.loanPurpose ||
            "personal",

          amount:
            loanAmount,

          remaining_amount:
            loanAmount,

          emi:
            Math.round(
              installment
            ),

          interest_rate:
            12,

          tenure_months:
            loanTerm,

          progress_percentage:
            0,

          status:
            "active",

          created_at:
            new Date()
              .toISOString()
              .split("T")[0],
        };

        console.log(
          "Saving approved loan:",
          loanPayload
        );

        const loanResponse =
          await fetch(
            `http://127.0.0.1:8000/loans?user_id=${userId}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                loanPayload
              ),
            }
          );

        const loanData =
          await loanResponse.json();

        if (!loanResponse.ok) {
          throw new Error(
            loanData.detail ||
              "Loan was approved but could not be saved."
          );
        }

        console.log(
          "Loan saved successfully:",
          loanData
        );
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

            {/* =====================================================
                LOAN AMOUNTS
            ===================================================== */}

            <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-7">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                <TrendingUp className="h-5 w-5 text-[#4edea3]" />

              </div>

              {/* REQUESTED AMOUNT */}

              <p className="mt-6 text-xs uppercase tracking-wider text-[#71837a]">
                Requested Loan Amount
              </p>

              <p className="mt-2 text-3xl font-bold text-[#dde4dd]">

                ₹
                {Number(
                  formData.loanAmount || 0
                ).toLocaleString("en-IN")}

              </p>

              {/* AI RECOMMENDED AMOUNT */}

              <div className="mt-6 border-t border-[#242c27] pt-5">

                <p className="text-xs uppercase tracking-wider text-[#71837a]">
                  AI Recommended Amount
                </p>

                <p className="mt-2 text-2xl font-bold text-[#4edea3]">

                  ₹
                  {Math.round(
                    Number(
                      prediction.predicted_loan_amount ||
                        0
                    )
                  ).toLocaleString("en-IN")}

                </p>

              </div>

              <p className="mt-4 text-xs leading-5 text-[#71837a]">
                The recommended amount is generated
                by the LifeLoan loan amount prediction
                model and may differ from the amount
                you requested.
              </p>

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
                    Personal Information
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Tell us a little about yourself.
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
                    Financial Information
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Help us understand your current finances.
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
                    Loan Details
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Tell us about the loan you're looking for.
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
                    Credit Information
                  </h2>

                  <p className="mt-1 text-xs text-[#71837a]">
                    Information about your credit history.
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

              <div className="mt-6 rounded-xl border border-[#242c27] bg-[#101713] p-4">

                <p className="text-xs leading-5 text-[#71837a]">

                  Your information will be evaluated
                  using the LifeLoan machine learning
                  system.

                </p>

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
                  Assessment failed
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
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (

                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    Analyzing...
                  </>

                ) : (

                  <>
                    Analyze Application

                    <CheckCircle2 className="h-4 w-4" />
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