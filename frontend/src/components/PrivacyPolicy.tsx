import React from 'react';
import { ShieldCheck, ArrowLeft, Lock, FileText, Database, Bot, UserCheck, ShieldAlert } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242c27] pb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-[#819087] hover:text-[#4edea3] transition w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to LifeLoan</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">
              <ShieldCheck className="h-5 w-5 text-[#003824]" />
            </div>
            <span className="font-serif text-xl font-bold">
              Life<span className="text-[#4edea3]">Loan</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#4edea3]/30 text-[11px] font-bold text-[#4edea3] uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            <span>Transparency & Privacy</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#dde4dd]">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#819087]">
            Last updated: September 2026 • Grounded in actual platform data practices
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">

          {/* 1. Overview */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <FileText className="h-4 w-4" />
              <h2>1. Platform Overview</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#bbcabf]">
              LifeLoan is an AI-powered financial intelligence and decision-support platform designed for Indian borrowers. This Privacy Policy details how your personal account data, financial inputs, and application records are processed to provide loan eligibility predictions, Digital Twin simulations, and AI Advisor interactions.
            </p>
          </section>

          {/* 2. Information Collected */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <Database className="h-4 w-4" />
              <h2>2. Information You Provide & We Process</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-xs text-[#bbcabf]">
              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-1.5">
                <h3 className="font-semibold text-[#dde4dd]">Account Information</h3>
                <p className="text-[11px] leading-relaxed text-[#86948a]">
                  Full name, email address, password hash, and optional contact phone number stored during registration.
                </p>
              </div>
              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-1.5">
                <h3 className="font-semibold text-[#dde4dd]">Financial Profile Inputs</h3>
                <p className="text-[11px] leading-relaxed text-[#86948a]">
                  Gross annual income, monthly expenses, existing debt liabilities, current liquid savings, credit score, and employment classification.
                </p>
              </div>
              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-1.5">
                <h3 className="font-semibold text-[#dde4dd]">Loan Application Data</h3>
                <p className="text-[11px] leading-relaxed text-[#86948a]">
                  Requested loan amount (₹), loan purpose (home, vehicle, personal, business), tenure, and applicant demographics entered in the 4-step wizard.
                </p>
              </div>
              <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-1.5">
                <h3 className="font-semibold text-[#dde4dd]">Simulation & Scenario Data</h3>
                <p className="text-[11px] leading-relaxed text-[#86948a]">
                  Hypothetical parameters adjusted in the Financial Digital Twin and EMI Calculator to forecast debt outcomes.
                </p>
              </div>
            </div>
          </section>

          {/* 3. How Data is Used */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <UserCheck className="h-4 w-4" />
              <h2>3. How We Use Your Financial Data</h2>
            </div>
            <ul className="space-y-2 text-xs text-[#bbcabf]">
              <li className="flex items-start gap-2">
                <span className="text-[#4edea3] font-bold">•</span>
                <span><strong>ML Risk Assessment:</strong> Computing your default probability score, risk decision (Approved/Attention), and AI Recommended Loan Amount via LifeLoan's trained machine learning model (<code className="text-[#4edea3] font-mono">/predict</code>).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4edea3] font-bold">•</span>
                <span><strong>Explainable AI (XAI):</strong> Generating SHAP-based feature attributions showing which financial ratios influenced your assessment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4edea3] font-bold">•</span>
                <span><strong>Digital Twin Scenario Modeling:</strong> Running what-if simulations against your baseline profile to preview cashflow changes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4edea3] font-bold">•</span>
                <span><strong>AI Advisor Context:</strong> Passing relevant financial metrics (income, debt, credit score, active loans) to LifeLoan AI to provide personalized assistance.</span>
              </li>
            </ul>
          </section>

          {/* 4. AI & Third-Party Services */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <Bot className="h-4 w-4" />
              <h2>4. AI Interactions & External AI Models</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#bbcabf]">
              When using the AI Financial Advisor or Recovery Planner, your contextual financial summaries and prompts are processed using AI models (such as Google Gemini) to generate natural language explanations. We do not sell your personal data or provide your financial records to advertisers.
            </p>
          </section>

          {/* 5. Data Security & Storage */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <Lock className="h-4 w-4" />
              <h2>5. Data Storage & Security Controls</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#bbcabf]">
              User authentication is managed via secure JWT (JSON Web Tokens) with cryptographically salted passwords (bcrypt). Active session data, temporary scenario states, and last assessment previews are stored locally in your browser's <code className="text-[#4edea3] font-mono">localStorage</code> and cleared upon logout.
            </p>
          </section>

          {/* 6. User Control */}
          <section className="rounded-2xl border border-[#242c27] bg-[#161d19] p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2.5 text-[#4edea3] font-bold text-sm">
              <ShieldAlert className="h-4 w-4" />
              <h2>6. User Responsibilities & Disclaimers</h2>
            </div>
            <p className="text-xs leading-relaxed text-[#bbcabf]">
              You are responsible for maintaining the confidentiality of your login credentials. LifeLoan assessments are algorithm-assisted estimates for personal planning and decision-support, not formal banking credit agreements.
            </p>
          </section>

        </div>

        {/* Footer CTA */}
        <div className="text-center pt-4 pb-8">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-[#10b981] px-8 py-3 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20"
          >
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
