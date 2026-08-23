import React, { useState } from "react";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingDown,
  Wallet,
  CreditCard,
  Loader2,
} from "lucide-react";

interface RecoveryPlannerProps {
  onBack: () => void;
}

interface RecoveryPlan {
  risk_level: string;
  summary: string;

  financial_snapshot: {
    income: string;
    monthly_expenses: string;
    existing_debt: string;
    credit_score: string;
    default_probability: string;
  };

  priorities: {
    title: string;
    description: string;
    priority: string;
  }[];

  plan_30_days: {
    action: string;
    reason: string;
    target: string;
  }[];

  plan_60_days: {
    action: string;
    reason: string;
    target: string;
  }[];

  plan_90_days: {
    action: string;
    reason: string;
    target: string;
  }[];

  key_metrics: {
    metric: string;
    current_value: string;
    goal: string;
  }[];
}

const RecoveryPlanner: React.FC<
  RecoveryPlannerProps
> = ({ onBack }) => {
  const [plan, setPlan] =
    useState<RecoveryPlan | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // =====================================================
  // LOAD USER DATA
  // =====================================================

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const savedApplication =
        localStorage.getItem(
          "lifeloan_last_application"
        );

      const savedPrediction =
        localStorage.getItem(
          "lifeloan_last_prediction"
        );

      const application =
        savedApplication
          ? JSON.parse(savedApplication)
          : {};

      const prediction =
        savedPrediction
          ? JSON.parse(savedPrediction)
          : {};

      // =================================================
      // BUILD FINANCIAL PROFILE
      // =================================================

      const financialData = {
        ...application,

        decision:
          prediction.decision,

        default_probability:
          prediction.default_probability,

        predicted_loan_amount:
          prediction.predicted_loan_amount,

        xai_factors:
          prediction.xai_factors,
      };

      console.log(
        "Sending financial data to Recovery Planner:",
        financialData
      );

      // =================================================
      // CALL FASTAPI
      // =================================================

      const response = await fetch(
        "http://127.0.0.1:8000/recovery-plan",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            financial_data:
              financialData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to generate recovery plan."
        );
      }

      const result =
        await response.json();

      if (
        !result.success ||
        !result.plan
      ) {
        throw new Error(
          "Invalid recovery plan received."
        );
      }

      setPlan(result.plan);
    } catch (err) {
      console.error(
        "Recovery Planner Error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL SCREEN
  // =====================================================

  if (!plan && !loading && !error) {
    return (
      <div
        className="
          min-h-screen
          bg-[#0e1511]
          px-6
          py-8
          text-[#dde4dd]
        "
      >
        <button
          onClick={onBack}
          className="
            mb-8
            flex
            items-center
            gap-2
            text-xs
            text-[#86948a]
            hover:text-[#4edea3]
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Dashboard
        </button>

        <div
          className="
            mx-auto
            max-w-4xl
            rounded-3xl
            border
            border-[#242c27]
            bg-[#161d19]
            p-10
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-[#10b981]/10
            "
          >
            <Brain
              className="
                h-8
                w-8
                text-[#4edea3]
              "
            />
          </div>

          <h1
            className="
              mt-6
              font-serif
              text-3xl
              font-bold
            "
          >
            AI Financial Recovery Planner
          </h1>

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              text-sm
              leading-6
              text-[#86948a]
            "
          >
            LifeLoan AI will analyze your latest
            financial assessment and create a
            personalized 30, 60, and 90-day
            recovery plan.
          </p>

          <button
            onClick={generatePlan}
            className="
              mt-8
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-[#10b981]
              px-7
              py-3
              text-sm
              font-bold
              text-[#003824]
              transition
              hover:bg-[#4edea3]
            "
          >
            <Brain className="h-4 w-4" />

            Generate My Recovery Plan
          </button>

          <p
            className="
              mt-4
              text-[10px]
              text-[#59675f]
            "
          >
            Uses your latest LifeLoan financial
            assessment.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#0e1511]
          text-[#dde4dd]
        "
      >
        <div className="text-center">
          <Loader2
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              text-[#4edea3]
            "
          />

          <p
            className="
              mt-5
              text-sm
              text-[#86948a]
            "
          >
            LifeLoan AI is analyzing your
            financial profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#0e1511]
          px-6
          text-[#dde4dd]
        "
      >
        <div
          className="
            max-w-md
            rounded-3xl
            border
            border-red-400/20
            bg-[#161d19]
            p-8
            text-center
          "
        >
          <AlertTriangle
            className="
              mx-auto
              h-10
              w-10
              text-red-400
            "
          />

          <h2
            className="
              mt-4
              text-lg
              font-bold
            "
          >
            Unable to Generate Plan
          </h2>

          <p
            className="
              mt-2
              text-xs
              leading-5
              text-[#86948a]
            "
          >
            {error}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onBack}
              className="
                rounded-xl
                border
                border-[#3c4a42]
                px-5
                py-2.5
                text-xs
                font-bold
                text-[#9aa9a1]
                hover:border-[#4edea3]
                hover:text-[#4edea3]
              "
            >
              Back
            </button>

            <button
              onClick={generatePlan}
              className="
                rounded-xl
                bg-[#10b981]
                px-5
                py-2.5
                text-xs
                font-bold
                text-[#003824]
                hover:bg-[#4edea3]
              "
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RECOVERY PLAN
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#0e1511]
        px-6
        py-8
        text-[#dde4dd]
      "
    >
      <div className="mx-auto max-w-6xl">

        {/* BACK */}

        <button
          onClick={onBack}
          className="
            mb-8
            flex
            items-center
            gap-2
            text-xs
            text-[#86948a]
            hover:text-[#4edea3]
          "
        >
          <ArrowLeft className="h-4 w-4" />

          Back to Dashboard
        </button>

        {/* HEADER */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-[#10b981]/10
              "
            >
              <Brain
                className="
                  h-5
                  w-5
                  text-[#4edea3]
                "
              />
            </div>

            <div>
              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.2em]
                  text-[#4edea3]
                "
              >
                LifeLoan Intelligence
              </p>

              <h1
                className="
                  font-serif
                  text-3xl
                  font-bold
                "
              >
                Financial Recovery Planner
              </h1>
            </div>
          </div>

          <p
            className="
              mt-3
              max-w-2xl
              text-sm
              leading-6
              text-[#86948a]
            "
          >
            A personalized action plan generated
            from your current LifeLoan financial
            profile.
          </p>
        </div>

        {/* =================================================
            TOP SUMMARY
        ================================================= */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-3
          "
        >

          {/* RISK */}

          <div
            className="
              rounded-2xl
              border
              border-[#242c27]
              bg-[#161d19]
              p-5
            "
          >
            <p
              className="
                text-[10px]
                uppercase
                tracking-wider
                text-[#71837a]
              "
            >
              Financial Risk
            </p>

            <p
              className={`
                mt-2
                text-2xl
                font-bold
                ${
                  plan!.risk_level ===
                  "High"
                    ? "text-orange-300"
                    : plan!.risk_level ===
                      "Critical"
                    ? "text-red-400"
                    : "text-[#4edea3]"
                }
              `}
            >
              {plan!.risk_level}
            </p>
          </div>

          {/* CREDIT SCORE */}

          <div
            className="
              rounded-2xl
              border
              border-[#242c27]
              bg-[#161d19]
              p-5
            "
          >
            <div className="flex items-center gap-2">
              <CreditCard
                className="
                  h-4
                  w-4
                  text-[#4edea3]
                "
              />

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-wider
                  text-[#71837a]
                "
              >
                Credit Score
              </p>
            </div>

            <p
              className="
                mt-2
                text-2xl
                font-bold
              "
            >
              {plan!.financial_snapshot.credit_score}
            </p>
          </div>

          {/* DEBT */}

          <div
            className="
              rounded-2xl
              border
              border-[#242c27]
              bg-[#161d19]
              p-5
            "
          >
            <div className="flex items-center gap-2">
              <Wallet
                className="
                  h-4
                  w-4
                  text-[#4edea3]
                "
              />

              <p
                className="
                  text-[10px]
                  uppercase
                  tracking-wider
                  text-[#71837a]
                "
              >
                Existing Debt
              </p>
            </div>

            <p
              className="
                mt-2
                text-2xl
                font-bold
              "
            >
              {plan!.financial_snapshot.existing_debt}
            </p>
          </div>

        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-[#242c27]
            bg-[#161d19]
            p-6
          "
        >
          <div className="flex gap-3">
            <TrendingDown
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-[#4edea3]
              "
            />

            <div>
              <h2
                className="
                  text-sm
                  font-bold
                "
              >
                Your Financial Snapshot
              </h2>

              <p
                className="
                  mt-2
                  text-xs
                  leading-6
                  text-[#9aa9a1]
                "
              >
                {plan!.summary}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            PRIORITIES
        ================================================= */}

        <section className="mt-8">
          <div className="mb-4">
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-[#4edea3]
              "
            >
              Step 01
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-2xl
                font-bold
              "
            >
              Your Priorities
            </h2>
          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-3
            "
          >
            {plan!.priorities.map(
              (priority, index) => (
                <div
                  key={index}
                  className="
                    rounded-2xl
                    border
                    border-[#242c27]
                    bg-[#161d19]
                    p-5
                  "
                >
                  <div className="flex items-center justify-between">
                    <Target
                      className="
                        h-5
                        w-5
                        text-[#4edea3]
                      "
                    />

                    <span
                      className={`
                        rounded-full
                        px-2.5
                        py-1
                        text-[9px]
                        font-bold
                        uppercase
                        ${
                          priority.priority ===
                          "High"
                            ? "bg-red-400/10 text-red-300"
                            : priority.priority ===
                              "Medium"
                            ? "bg-orange-400/10 text-orange-300"
                            : "bg-[#4edea3]/10 text-[#4edea3]"
                        }
                      `}
                    >
                      {priority.priority}
                    </span>
                  </div>

                  <h3
                    className="
                      mt-5
                      text-sm
                      font-bold
                    "
                  >
                    {priority.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      text-xs
                      leading-5
                      text-[#71837a]
                    "
                  >
                    {priority.description}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* =================================================
            30 / 60 / 90 DAY PLAN
        ================================================= */}

        <section className="mt-10">
          <div className="mb-6">
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-[#4edea3]
              "
            >
              Step 02
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-2xl
                font-bold
              "
            >
              Your Recovery Roadmap
            </h2>
          </div>

          <div className="space-y-5">

            {/* 30 DAYS */}

            <PlanCard
              title="First 30 Days"
              subtitle="Stabilize"
              items={plan!.plan_30_days}
            />

            {/* 60 DAYS */}

            <PlanCard
              title="By 60 Days"
              subtitle="Improve"
              items={plan!.plan_60_days}
            />

            {/* 90 DAYS */}

            <PlanCard
              title="By 90 Days"
              subtitle="Strengthen"
              items={plan!.plan_90_days}
            />

          </div>
        </section>

        {/* =================================================
            KEY METRICS
        ================================================= */}

        <section className="mt-10">
          <div className="mb-6">
            <p
              className="
                text-[10px]
                uppercase
                tracking-[0.2em]
                text-[#4edea3]
              "
            >
              Step 03
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-2xl
                font-bold
              "
            >
              Track Your Progress
            </h2>
          </div>

          <div
            className="
              grid
              gap-4
              md:grid-cols-3
            "
          >
            {plan!.key_metrics.map(
              (metric, index) => {

                // Small UI improvement:
                // Savings uses a more meaningful label
                // than the generic "Goal".
                const isSavingsMetric =
                  metric.metric
                    .toLowerCase()
                    .includes("saving");

                return (
                  <div
                    key={index}
                    className="
                      rounded-2xl
                      border
                      border-[#242c27]
                      bg-[#161d19]
                      p-5
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        uppercase
                        tracking-wider
                        text-[#71837a]
                      "
                    >
                      {metric.metric}
                    </p>

                    <div
                      className="
                        mt-4
                        flex
                        items-end
                        justify-between
                        gap-3
                      "
                    >
                      <div>
                        <p
                          className="
                            text-xs
                            text-[#71837a]
                          "
                        >
                          Current
                        </p>

                        <p
                          className="
                            mt-1
                            text-lg
                            font-bold
                          "
                        >
                          {metric.current_value}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className="
                            text-xs
                            text-[#71837a]
                          "
                        >
                          {isSavingsMetric
                            ? "Minimum After Debt Payoff"
                            : "Goal"}
                        </p>

                        <p
                          className="
                            mt-1
                            text-lg
                            font-bold
                            text-[#4edea3]
                          "
                        >
                          {metric.goal}
                        </p>
                      </div>
                    </div>

                    <div
                      className="
                        mt-4
                        h-1.5
                        overflow-hidden
                        rounded-full
                        bg-[#242c27]
                      "
                    >
                      <div
                        className="
                          h-full
                          w-1/3
                          rounded-full
                          bg-[#10b981]
                        "
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <div
          className="
            mt-10
            rounded-2xl
            border
            border-[#242c27]
            bg-[#101713]
            p-5
            text-center
          "
        >
          <CheckCircle2
            className="
              mx-auto
              h-5
              w-5
              text-[#4edea3]
            "
          />

          <p
            className="
              mt-3
              text-[10px]
              leading-5
              text-[#59675f]
            "
          >
            This recovery plan is generated by
            LifeLoan AI using your available
            financial information. It is an
            informational prediction and does not
            guarantee loan approval, financial
            outcomes, or credit-score changes.
          </p>
        </div>

      </div>
    </div>
  );
};

// =========================================================
// PLAN CARD
// =========================================================

interface PlanItem {
  action: string;
  reason: string;
  target: string;
}

interface PlanCardProps {
  title: string;
  subtitle: string;
  items: PlanItem[];
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  subtitle,
  items,
}) => {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#242c27]
        bg-[#161d19]
        p-6
      "
    >
      <div
        className="
          flex
          flex-col
          gap-1
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h3
            className="
              text-lg
              font-bold
            "
          >
            {title}
          </h3>

          <p
            className="
              text-xs
              text-[#4edea3]
            "
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.map(
          (item, index) => (
            <div
              key={index}
              className="
                rounded-xl
                border
                border-[#242c27]
                bg-[#0e1511]
                p-4
              "
            >
              <div className="flex gap-3">
                <CheckCircle2
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-[#4edea3]
                  "
                />

                <div className="flex-1">
                  <p
                    className="
                      text-xs
                      font-bold
                      text-[#dde4dd]
                    "
                  >
                    {item.action}
                  </p>

                  <p
                    className="
                      mt-1.5
                      text-[11px]
                      leading-5
                      text-[#71837a]
                    "
                  >
                    {item.reason}
                  </p>

                  {item.target && (
                    <div
                      className="
                        mt-3
                        inline-flex
                        rounded-lg
                        bg-[#10b981]/10
                        px-3
                        py-1.5
                        text-[10px]
                        font-semibold
                        text-[#4edea3]
                      "
                    >
                      Target: {item.target}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default RecoveryPlanner;