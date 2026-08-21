import React from "react";
import {
  ShieldCheck,
  Wallet,
  TrendingUp,
  CalendarClock,
  ArrowUpRight,
  Sparkles,
  Brain,
  CreditCard,
  LogOut,
  Calculator,
} from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onLogout,
  onNavigate,
}) => {
  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

      {/* =====================================================
          TOP NAVBAR
          ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857]">

              <ShieldCheck className="h-5 w-5 text-[#003824]" />

            </div>

            <div>

              <h1 className="font-serif text-xl font-bold">
                Life<span className="text-[#4edea3]">Loan</span>
              </h1>

              <p className="text-[10px] text-[#71837a]">
                Financial Intelligence
              </p>

            </div>

          </div>


          {/* Right */}

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold">
                Welcome, User
              </p>

              <p className="text-[11px] text-[#71837a]">
                Your financial dashboard
              </p>

            </div>


            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full border border-[#3c4a42] bg-[#161d19] px-4 py-2 text-xs font-semibold text-[#bbcabf] transition hover:border-red-400/50 hover:text-red-300"
            >

              <LogOut className="h-3.5 w-3.5" />

              Logout

            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          DASHBOARD CONTENT
          ===================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Greeting */}

        <section className="mb-10">

          <p className="mb-2 text-sm font-medium text-[#4edea3]">
            FINANCIAL OVERVIEW
          </p>

          <h2 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome, User
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#819087]">
            Your LifeLoan financial intelligence dashboard gives you
            a clear view of your borrowing, repayment and financial health.
          </p>

        </section>


        {/* =====================================================
            TOP STAT CARDS
            ===================================================== */}

        <section className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {/* Financial Health */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-5 flex items-center justify-between">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

                <TrendingUp className="h-5 w-5 text-[#4edea3]" />

              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">
                Healthy
              </span>

            </div>

            <p className="text-xs text-[#71837a]">
              Financial Health
            </p>

            <p className="mt-1 text-3xl font-bold">
              82<span className="text-lg text-[#71837a]">/100</span>
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#242c27]">

              <div
                className="h-full rounded-full bg-[#10b981]"
                style={{ width: "82%" }}
              />

            </div>

          </div>


          {/* Active Loans */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CreditCard className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Active Loans
            </p>

            <p className="mt-1 text-3xl font-bold">
              2
            </p>

            <p className="mt-2 text-xs text-[#71837a]">
              Currently being managed
            </p>

          </div>


          {/* Monthly EMI */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <Wallet className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Monthly EMI
            </p>

            <p className="mt-1 text-3xl font-bold">
              ₹18,500
            </p>

            <p className="mt-2 text-xs text-[#71837a]">
              Across active loans
            </p>

          </div>


          {/* Next Payment */}

          <div className="rounded-2xl border border-[#242c27] bg-[#161d19] p-5">

            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

              <CalendarClock className="h-5 w-5 text-[#4edea3]" />

            </div>

            <p className="text-xs text-[#71837a]">
              Next EMI
            </p>

            <p className="mt-1 text-3xl font-bold">
              ₹9,250
            </p>

            <p className="mt-2 text-xs text-[#71837a]">
              Due in 8 days
            </p>

          </div>

        </section>


        {/* =====================================================
            MAIN GRID
            ===================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">


          {/* ===================================================
              LEFT - QUICK ACTIONS
              =================================================== */}

          <div className="lg:col-span-2">

            <div className="mb-4">

              <h3 className="text-lg font-bold">
                Your LifeLoan tools
              </h3>

              <p className="mt-1 text-xs text-[#71837a]">
                Intelligent tools built around your financial journey.
              </p>

            </div>


            <div className="grid gap-4 sm:grid-cols-2">


              {/* =================================================
                  MY LOANS
                  ================================================= */}

              <button
                onClick={() =>
                  onNavigate("loans")
                }
                className="group rounded-2xl border border-[#242c27] bg-[#161d19] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                    <CreditCard className="h-5 w-5 text-[#4edea3]" />

                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#52625a] transition group-hover:text-[#4edea3]" />

                </div>

                <h4 className="mt-5 font-semibold">
                  My Loans
                </h4>

                <p className="mt-2 text-xs leading-5 text-[#71837a]">
                  Track your active loans, EMIs, repayment progress
                  and payment history.
                </p>

              </button>


              {/* =================================================
                  APPLY
                  ================================================= */}

              <button
                onClick={() =>
                  onNavigate("apply")
                }
                className="group rounded-2xl border border-[#242c27] bg-[#161d19] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                    <Wallet className="h-5 w-5 text-[#4edea3]" />

                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#52625a] transition group-hover:text-[#4edea3]" />

                </div>

                <h4 className="mt-5 font-semibold">
                  Apply for a Loan
                </h4>

                <p className="mt-2 text-xs leading-5 text-[#71837a]">
                  Submit your information and get an AI-powered
                  loan risk assessment.
                </p>

              </button>


              {/* =================================================
                  EMI CALCULATOR
                  ================================================= */}

              <button
                onClick={() =>
                  onNavigate("emi")
                }
                className="group rounded-2xl border border-[#242c27] bg-[#161d19] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                    <Calculator className="h-5 w-5 text-[#4edea3]" />

                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#52625a] transition group-hover:text-[#4edea3]" />

                </div>

                <h4 className="mt-5 font-semibold">
                  EMI Calculator
                </h4>

                <p className="mt-2 text-xs leading-5 text-[#71837a]">
                  Calculate your monthly EMI, total interest
                  and total repayment before borrowing.
                </p>

              </button>


              {/* =================================================
                  DIGITAL TWIN
                  ================================================= */}

              <button
                onClick={() =>
                  onNavigate("digital-twin")
                }
                className="group rounded-2xl border border-[#242c27] bg-[#161d19] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                    <Brain className="h-5 w-5 text-[#4edea3]" />

                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#52625a] transition group-hover:text-[#4edea3]" />

                </div>

                <h4 className="mt-5 font-semibold">
                  Financial Digital Twin
                </h4>

                <p className="mt-2 text-xs leading-5 text-[#71837a]">
                  Simulate your financial future and understand
                  how borrowing decisions may affect you.
                </p>

              </button>


              {/* =================================================
                  RECOVERY PLANNER
                  ================================================= */}

              <button
                onClick={() =>
                  onNavigate("recovery")
                }
                className="group rounded-2xl border border-[#242c27] bg-[#161d19] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#4edea3]/40 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)]"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                    <Sparkles className="h-5 w-5 text-[#4edea3]" />

                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#52625a] transition group-hover:text-[#4edea3]" />

                </div>

                <h4 className="mt-5 font-semibold">
                  AI Financial Recovery
                </h4>

                <p className="mt-2 text-xs leading-5 text-[#71837a]">
                  Get intelligent recommendations to improve
                  your financial position and manage debt.
                </p>

              </button>


            </div>

          </div>


          {/* ===================================================
              RIGHT - AI INSIGHT
              =================================================== */}

          <div>

            <div className="mb-4">

              <h3 className="text-lg font-bold">
                LifeLoan AI
              </h3>

              <p className="mt-1 text-xs text-[#71837a]">
                Your financial intelligence assistant.
              </p>

            </div>


            <div className="relative overflow-hidden rounded-2xl border border-[#4edea3]/20 bg-gradient-to-br from-[#13251d] to-[#101713] p-6">


              {/* Glow */}

              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[#10b981]/10 blur-3xl" />


              <div className="relative">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/15">

                  <Sparkles className="h-5 w-5 text-[#4edea3]" />

                </div>


                <h4 className="mt-5 text-lg font-bold">
                  Financial insight
                </h4>


                <p className="mt-3 text-sm leading-6 text-[#9aa9a1]">
                  Your current EMI obligations are within a
                  manageable range based on your financial profile.
                </p>


                <div className="mt-6 rounded-xl border border-[#4edea3]/10 bg-[#0e1511]/60 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#4edea3]">
                    AI Recommendation
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#aab8b0]">
                    Consider maintaining an emergency fund before
                    taking on another major loan.
                  </p>

                </div>


                <button
                  onClick={() =>
                    onNavigate("advisor")
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] px-4 py-3 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3]"
                >

                  <Sparkles className="h-4 w-4" />

                  Ask AI Advisor

                </button>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RECENT ACTIVITY
            ===================================================== */}

        <section className="mt-8 rounded-2xl border border-[#242c27] bg-[#161d19] p-6">

          <div className="flex items-center justify-between">

            <div>

              <h3 className="font-bold">
                Recent activity
              </h3>

              <p className="mt-1 text-xs text-[#71837a]">
                Your latest LifeLoan activity.
              </p>

            </div>

            <button
              onClick={() =>
                onNavigate("loans")
              }
              className="text-xs font-semibold text-[#4edea3] hover:text-[#70efc5]"
            >
              View all →
            </button>

          </div>


          <div className="mt-5 divide-y divide-[#242c27]">


            {/* Activity 1 */}

            <div className="flex items-center justify-between py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/10">

                  <Wallet className="h-4 w-4 text-[#4edea3]" />

                </div>

                <div>

                  <p className="text-sm font-medium">
                    Personal Loan EMI
                  </p>

                  <p className="text-[11px] text-[#71837a]">
                    Payment scheduled
                  </p>

                </div>

              </div>

              <span className="text-xs text-[#71837a]">
                Today
              </span>

            </div>


            {/* Activity 2 */}

            <div className="flex items-center justify-between py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/10">

                  <TrendingUp className="h-4 w-4 text-[#4edea3]" />

                </div>

                <div>

                  <p className="text-sm font-medium">
                    Financial health updated
                  </p>

                  <p className="text-[11px] text-[#71837a]">
                    Score improved by 4 points
                  </p>

                </div>

              </div>

              <span className="text-xs text-[#71837a]">
                Yesterday
              </span>

            </div>


          </div>

        </section>

      </main>

    </div>
  );
};

export default Dashboard;