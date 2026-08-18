import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, TrendingUp, Shield, CheckCircle2, ChevronRight, Activity, Smartphone, Monitor } from 'lucide-react';
import { RECENT_PORTFOLIO_ACTIVITY } from '../data/mockData';

interface HeroProps {
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCheckEligibility, onOpenApply }) => {
  return (
    <section id="home" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Radial Glow Effects */}
      <div className="pointer-events-none absolute top-10 left-1/4 h-96 w-96 rounded-full bg-[#10b981]/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-80 w-80 rounded-full bg-[#1e1b4b]/40 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column - Hero Editorial Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            {/* Overline Badge */}
            <div className="mb-6 flex items-center space-x-2">
              <span className="h-[2px] w-6 bg-[#4edea3]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#4edea3] uppercase">
                AI-Powered Loan Intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-[#dde4dd] sm:text-5xl lg:text-6xl">
              Borrow Smarter.<br />
              <span className="bg-gradient-to-r from-[#dde4dd] via-[#dde4dd] to-[#4edea3] bg-clip-text text-transparent">
                Build Your Future.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base font-normal leading-relaxed text-[#bbcabf] sm:text-lg max-w-xl">
              Predict loan eligibility, estimate borrowing capacity, and make confident financial decisions using AI-powered insights.
            </p>

            {/* Action CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenCheckEligibility}
                id="hero-check-eligibility-btn"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#10b981] px-7 py-3.5 text-sm font-bold tracking-wide text-[#003824] transition-all duration-300 hover:bg-[#4edea3] hover:shadow-[0_0_25px_rgba(78,222,163,0.5)] active:scale-95"
              >
                <span>CHECK ELIGIBILITY</span>
                <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenApply}
                id="hero-apply-btn"
                className="inline-flex items-center justify-center rounded-full border border-[#3c4a42] bg-[#161d19]/80 px-7 py-3.5 text-sm font-semibold tracking-wide text-[#dde4dd] transition-all duration-300 hover:border-[#4edea3] hover:bg-[#1a211d] hover:text-[#4edea3] active:scale-95"
              >
                <span>APPLY FOR A LOAN</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="mt-10 flex items-center space-x-6 border-t border-[#242c27] pt-6 text-xs text-[#86948a]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#4edea3]" />
                <span>Instant Pre-Approval Odds</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-[#4edea3]" />
                <span>Bank-Grade Encryption</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Floating Cards & Mockups Display */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative lg:col-span-6"
          >
            {/* Background Frame Layer */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              
              {/* Active Portfolio Card Overlay */}
              <div className="absolute -top-6 -left-2 z-20 w-64 rounded-2xl glass-panel p-5 border border-[#3c4a42]/80 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-[#4edea3]/50">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#bbcabf]">
                  <span>ACTIVE PORTFOLIO</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981]/20 text-[#4edea3]">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-2 text-2xl font-bold tracking-tight text-[#dde4dd]">
                  $14,250,000
                </div>

                <div className="mt-1 flex items-center space-x-1 text-xs font-medium text-[#4edea3]">
                  <span>+12.4% this quarter</span>
                </div>

                {/* Progress Sparkline Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#242c27]">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#10b981] to-[#4edea3] shadow-[0_0_10px_#4edea3]" />
                </div>
              </div>

              {/* Central Monitor Dashboard Mockup */}
              <div className="relative rounded-2xl border border-[#242c27] bg-[#161d19] p-4 shadow-2xl overflow-hidden glass-panel">
                {/* Window Header */}
                <div className="flex items-center justify-between border-b border-[#242c27] pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-xs font-mono text-[#86948a]">dashboard.lifeloan.ai</span>
                  <Activity className="h-3.5 w-3.5 text-[#4edea3]" />
                </div>

                {/* Dashboard Inner Grid */}
                <div className="grid grid-cols-12 gap-4">
                  
                  {/* Main Portfolio Growth Chart Simulation */}
                  <div className="col-span-12 sm:col-span-7 rounded-xl bg-[#0e1511] p-4 border border-[#2f3632]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#bbcabf]">Portfolio Growth</span>
                      <span className="text-xs font-bold text-[#4edea3] bg-[#10b981]/10 px-2 py-0.5 rounded-full">+15%</span>
                    </div>

                    {/* SVG Chart Wave */}
                    <div className="mt-4 h-32 w-full">
                      <svg className="h-full w-full overflow-visible" viewBox="0 0 200 80">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,60 Q30,50 60,35 T120,40 T180,15 T200,10"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        />
                        <path
                          d="M0,60 Q30,50 60,35 T120,40 T180,15 T200,10 L200,80 L0,80 Z"
                          fill="url(#chartGrad)"
                        />
                        <circle cx="200" cy="10" r="4" fill="#4edea3" className="animate-ping" />
                        <circle cx="200" cy="10" r="3" fill="#4edea3" />
                      </svg>
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-[#86948a] font-mono">
                      <span>Q1</span>
                      <span>Q2</span>
                      <span>Q3</span>
                      <span>Q4 (Projected)</span>
                    </div>
                  </div>

                  {/* Recent Activity Sidebar inside Mockup */}
                  <div className="col-span-12 sm:col-span-5 rounded-xl bg-[#0e1511] p-3 border border-[#2f3632]">
                    <span className="text-xs font-semibold text-[#dde4dd]">Recent Activity</span>
                    <div className="mt-2.5 space-y-2">
                      {RECENT_PORTFOLIO_ACTIVITY.slice(0, 3).map((act) => (
                        <div key={act.id} className="flex items-center justify-between text-[11px] border-b border-[#1a211d] pb-1.5 last:border-0">
                          <div>
                            <div className="font-medium text-[#dde4dd] truncate max-w-[90px]">{act.type}</div>
                            <div className="text-[9px] text-[#86948a]">{act.date}</div>
                          </div>
                          <div className={`font-mono font-semibold ${act.amount.startsWith('+') ? 'text-[#4edea3]' : 'text-[#bbcabf]'}`}>
                            {act.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Floating Mobile Phone Mockup Overlay on bottom right */}
              <div className="absolute -bottom-6 -right-2 z-20 w-48 rounded-2xl bg-[#09100c] border border-[#3c4a42] p-3 shadow-2xl glass-panel hidden sm:block">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a] mb-2 border-b border-[#242c27] pb-1">
                  <span>LifeLoan App</span>
                  <Smartphone className="h-3 w-3 text-[#4edea3]" />
                </div>
                <div className="rounded-lg bg-[#161d19] p-2 border border-[#242c27]">
                  <div className="text-[10px] text-[#bbcabf]">Borrowing Power</div>
                  <div className="text-base font-bold text-[#4edea3] font-mono">$1,250,000</div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-[#86948a]">
                    <span>Pre-Approved</span>
                    <span className="text-[#10b981]">● Active</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
