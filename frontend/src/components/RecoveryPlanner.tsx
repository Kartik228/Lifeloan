import React, { useEffect, useState } from "react";
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
  Sparkles,
  CheckSquare,
  Clock,
  Circle,
} from "lucide-react";
import { api, formatINR } from "../api";
import { FinancialProfile } from "../types";

interface RecoveryPlannerProps {
  onBack: () => void;
  onOpenAIChat?: () => void;
}

interface PlanItem {
  action: string;
  reason: string;
  target: string;
}

interface RecoveryPlan {
  risk_level: string;
  summary: string;
  financial_snapshot: {
    annual_income: string;
    monthly_expenses: string;
    existing_debt: string;
    savings: string;
    credit_score: string;
  };
  priorities: {
    title: string;
    description: string;
    priority: string;
  }[];
  plan_30_days: PlanItem[];
  plan_60_days: PlanItem[];
  plan_90_days: PlanItem[];
  key_metrics: {
    metric: string;
    current_value: string;
    goal: string;
  }[];
}

type TaskStatus = "not_started" | "in_progress" | "completed";

const RecoveryPlanner: React.FC<RecoveryPlannerProps> = ({
  onBack,
  onOpenAIChat,
}) => {
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);

  // Persistent task progress mapping: task_id -> TaskStatus
  const [taskProgress, setTaskProgress] = useState<Record<string, TaskStatus>>({});

  // =====================================================
  // INITIAL DATA LOAD
  // =====================================================
  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, progressData] = await Promise.all([
          api.get<FinancialProfile>("/financial-profile").catch(() => null),
          api.get<{ progress: any[] }>("/recovery-plan/progress").catch(() => ({ progress: [] })),
        ]);

        if (profileData) {
          setProfile(profileData);
        }

        if (progressData?.progress) {
          const map: Record<string, TaskStatus> = {};
          progressData.progress.forEach((item: any) => {
            map[item.task_id] = item.status as TaskStatus;
          });
          setTaskProgress(map);
        }
      } catch (err) {
        console.warn("Could not load initial recovery metadata:", err);
      }
    }

    loadData();
  }, []);

  // =====================================================
  // GENERATE RECOVERY PLAN
  // =====================================================
  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      // Gather latest persisted prediction if available
      let lastPred = null;
      try {
        const saved = localStorage.getItem("lifeloan_last_prediction");
        if (saved) lastPred = JSON.parse(saved);
      } catch {}

      const payload = {
        financial_data: {
          annual_income: profile?.annual_income ?? 1200000,
          monthly_expenses: profile?.monthly_expenses ?? 45000,
          existing_debt: profile?.existing_debt ?? 150000,
          savings: profile?.savings ?? 300000,
          credit_score: profile?.credit_score ?? 740,
          decision: lastPred?.decision ?? "Evaluated",
          default_probability: `${Math.round((lastPred?.default_probability ?? 0.22) * 100)}%`,
        },
      };

      const result = await api.post<{ success: boolean; plan: RecoveryPlan }>(
        "/recovery-plan",
        payload
      );

      if (!result.success || !result.plan) {
        throw new Error("Invalid recovery plan response from server.");
      }

      setPlan(result.plan);
    } catch (err: any) {
      console.error("Recovery Planner Error:", err);
      setError(
        err.message || "Unable to generate recovery plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // TOGGLE TASK STATUS & PERSIST
  // =====================================================
  const toggleTaskStatus = async (taskId: string, tier: string) => {
    const current = taskProgress[taskId] || "not_started";
    let next: TaskStatus = "in_progress";
    if (current === "not_started") next = "in_progress";
    else if (current === "in_progress") next = "completed";
    else next = "not_started";

    setTaskProgress((prev) => ({ ...prev, [taskId]: next }));

    try {
      await api.put("/recovery-plan/progress", {
        task_id: taskId,
        plan_tier: tier,
        status: next,
      });
    } catch (e) {
      console.warn("Could not persist recovery progress:", e);
    }
  };

  // =====================================================
  // OVERALL PROGRESS METRICS
  // =====================================================
  const allTasks = plan
    ? [
        ...plan.plan_30_days.map((_, i) => `30_${i}`),
        ...plan.plan_60_days.map((_, i) => `60_${i}`),
        ...plan.plan_90_days.map((_, i) => `90_${i}`),
      ]
    : [];
  const completedCount = allTasks.filter(
    (id) => taskProgress[id] === "completed"
  ).length;
  const inProgressCount = allTasks.filter(
    (id) => taskProgress[id] === "in_progress"
  ).length;
  const progressPercent =
    allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  // =====================================================
  // INITIAL LANDING STATE (NO PLAN GENERATED YET)
  // =====================================================
  if (!plan && !loading && !error) {
    return (
      <div className="min-h-screen bg-[#0e1511] px-6 py-8 text-[#dde4dd]">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-xs text-[#86948a] hover:text-[#4edea3] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="mx-auto max-w-3xl rounded-3xl border border-[#242c27] bg-[#161d19] p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]/10 border border-[#4edea3]/20">
            <Brain className="h-7 w-7 text-[#4edea3]" />
          </div>

          <span className="mt-6 inline-block rounded-full border border-[#4edea3]/30 bg-[#10b981]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4edea3]">
            Personalized Roadmap
          </span>

          <h1 className="mt-3 font-serif text-3xl font-bold text-[#dde4dd]">
            AI Financial Recovery Planner
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-[#9aa9a1]">
            Build an actionable, 30/60/90-day financial stabilization program
            grounded in your authentic profile. Track completed action items,
            reduce credit strain, and optimize your borrowing terms.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              onClick={generatePlan}
              className="flex items-center gap-2 rounded-xl bg-[#10b981] px-7 py-3 text-xs font-bold uppercase tracking-wider text-[#003824] transition hover:bg-[#4edea3] shadow-lg shadow-[#10b981]/20"
            >
              <Sparkles className="h-4 w-4" />
              Generate My Recovery Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING STATE
  // =====================================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e1511] px-6 text-[#dde4dd]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4edea3]" />
          <h2 className="mt-4 font-serif text-xl font-bold">
            Synthesizing Your Recovery Plan...
          </h2>
          <p className="mt-2 text-xs text-[#71837a]">
            Analyzing cashflow surplus, debt service obligations, and credit utilization.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PLAN DISPLAY
  // =====================================================
  return (
    <div className="min-h-screen bg-[#0e1511] px-4 sm:px-6 lg:px-8 py-8 text-[#dde4dd]">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* TOP NAV */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-[#86948a] hover:text-[#4edea3] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          {onOpenAIChat && (
            <button
              onClick={() => {
                localStorage.setItem(
                  "lifeloan_chat_initial_prompt",
                  `I am reviewing my 30/60/90-day Financial Recovery Plan. My risk level is ${plan?.risk_level}. How can I achieve my 90-day goals fastest?`
                );
                onOpenAIChat();
              }}
              className="flex items-center gap-2 rounded-xl border border-[#4edea3]/30 bg-[#161d19] px-4 py-2 text-xs font-bold text-[#4edea3] hover:bg-[#10b981]/10 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI Advisor
            </button>
          )}
        </div>

        {/* HEADER & PROGRESS BAR */}
        <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/10 border border-[#4edea3]/20">
                <Brain className="h-6 w-6 text-[#4edea3]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-[#dde4dd]">
                  Financial Recovery Roadmap
                </h1>
                <p className="text-xs text-[#71837a]">
                  Status: {completedCount} of {allTasks.length} tasks completed ({progressPercent}%)
                </p>
              </div>
            </div>

            <button
              onClick={generatePlan}
              className="text-xs font-bold text-[#4edea3] hover:underline"
            >
              Regenerate Plan
            </button>
          </div>

          {/* PROGRESS BAR */}
          <div className="mt-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#101713]">
              <div
                className="h-full bg-gradient-to-r from-[#10b981] to-[#4edea3] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-[#71837a]">
              <span>{completedCount} Completed</span>
              <span>{inProgressCount} In Progress</span>
              <span>{allTasks.length - completedCount - inProgressCount} Pending</span>
            </div>
          </div>
        </div>

        {/* FINANCIAL SNAPSHOT STRIP */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">
            <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
              Risk Assessment
            </p>
            <p
              className={`mt-2 text-2xl font-bold ${
                plan!.risk_level === "High" || plan!.risk_level === "Critical"
                  ? "text-amber-400"
                  : "text-[#4edea3]"
              }`}
            >
              {plan!.risk_level} Risk
            </p>
          </div>

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#4edea3]" />
              <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                Credit Score
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#dde4dd]">
              {plan!.financial_snapshot.credit_score}
            </p>
          </div>

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[#4edea3]" />
              <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                Existing Debt
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#dde4dd]">
              {plan!.financial_snapshot.existing_debt}
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6">
          <h2 className="text-sm font-bold text-[#dde4dd] flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-[#4edea3]" />
            Strategic Assessment Summary
          </h2>
          <p className="mt-2 text-xs leading-6 text-[#9aa9a1]">
            {plan!.summary}
          </p>
        </div>

        {/* 30 / 60 / 90 DAY ACTION TIERS */}
        <div className="space-y-6">
          <PlanTierSection
            title="First 30 Days"
            subtitle="Immediate Cash Stabilization & Expense Audit"
            tier="30"
            items={plan!.plan_30_days}
            taskProgress={taskProgress}
            onToggleTask={toggleTaskStatus}
          />

          <PlanTierSection
            title="By 60 Days"
            subtitle="Accelerated Debt Service & Reserve Building"
            tier="60"
            items={plan!.plan_60_days}
            taskProgress={taskProgress}
            onToggleTask={toggleTaskStatus}
          />

          <PlanTierSection
            title="By 90 Days"
            subtitle="Credit Score Enhancement & Loan Re-Evaluation"
            tier="90"
            items={plan!.plan_90_days}
            taskProgress={taskProgress}
            onToggleTask={toggleTaskStatus}
          />
        </div>

        {/* KEY METRICS GOALS */}
        <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6">
          <h3 className="text-sm font-bold text-[#dde4dd] mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#4edea3]" />
            Key Measurable 90-Day Target Milestones
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {plan!.key_metrics.map((km, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#242c27] bg-[#101713] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-[#dde4dd]">{km.metric}</p>
                  <p className="text-[11px] text-[#71837a] mt-0.5">
                    Current: {km.current_value}
                  </p>
                </div>
                <span className="rounded-xl border border-[#4edea3]/30 bg-[#10b981]/10 px-3 py-1 text-xs font-mono font-bold text-[#4edea3]">
                  Goal: {km.goal}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="rounded-2xl border border-[#242c27] bg-[#101713] p-5 text-center">
          <p className="text-[11px] leading-5 text-[#59675f]">
            <strong>Educational Guidance Disclaimer:</strong> This recovery plan is generated by
            LifeLoan AI to assist borrowers in personal financial discipline. It does not guarantee
            future loan approval, exact credit score increases, or specific bank rate reductions.
          </p>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// INTERACTIVE ACTION TIER SECTION
// =========================================================
interface PlanTierSectionProps {
  title: string;
  subtitle: string;
  tier: string;
  items: PlanItem[];
  taskProgress: Record<string, TaskStatus>;
  onToggleTask: (taskId: string, tier: string) => void;
}

const PlanTierSection: React.FC<PlanTierSectionProps> = ({
  title,
  subtitle,
  tier,
  items,
  taskProgress,
  onToggleTask,
}) => {
  return (
    <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242c27] pb-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-[#dde4dd]">{title}</h3>
          <p className="text-xs text-[#4edea3] mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[10px] text-[#71837a]">
          Click status button to track completion
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const taskId = `${tier}_${idx}`;
          const status = taskProgress[taskId] || "not_started";

          return (
            <div
              key={idx}
              className={`rounded-2xl border p-4 transition ${
                status === "completed"
                  ? "border-[#4edea3]/40 bg-[#102018]"
                  : status === "in_progress"
                  ? "border-amber-500/30 bg-amber-950/10"
                  : "border-[#242c27] bg-[#0e1511]"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-bold ${
                        status === "completed"
                          ? "line-through text-[#71837a]"
                          : "text-[#dde4dd]"
                      }`}
                    >
                      {item.action}
                    </p>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#71837a]">
                    {item.reason}
                  </p>
                  {item.target && (
                    <div className="mt-2 inline-block rounded-lg bg-[#10b981]/10 px-2.5 py-1 text-[10px] font-semibold text-[#4edea3]">
                      Target: {item.target}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onToggleTask(taskId, tier)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition ${
                    status === "completed"
                      ? "border-[#4edea3]/50 bg-[#4edea3]/20 text-[#4edea3]"
                      : status === "in_progress"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                      : "border-[#3c4a42] bg-[#161d19] text-[#71837a] hover:border-[#4edea3]/30"
                  }`}
                >
                  {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                  {status === "in_progress" && <Clock className="h-3 w-3" />}
                  {status === "not_started" && <Circle className="h-3 w-3" />}
                  {status === "completed"
                    ? "Completed"
                    : status === "in_progress"
                    ? "In Progress"
                    : "Not Started"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecoveryPlanner;