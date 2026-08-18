import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu, CheckCircle2, ChevronDown, HelpCircle, Lock, Sparkles, Layers } from 'lucide-react';

export const HowItWorksAndFAQ: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeFaqCategory, setActiveFaqCategory] = useState<'All' | 'Eligibility' | 'Digital Twin' | 'Security'>('All');

  const steps = [
    {
      num: '01',
      title: 'Financial Digital Twin Creation',
      desc: 'Connect your financial accounts with bank-grade 256-bit encryption. Our AI constructs a dynamic neural replica of your cash flows, assets, and liabilities.',
      icon: Cpu,
    },
    {
      num: '02',
      title: 'AI Risk & Capacity Modeling',
      desc: 'Machine learning algorithms continuously evaluate DTI, repayment history, and liquidity buffers to project your exact borrowing ceiling and approval odds.',
      icon: Sparkles,
    },
    {
      num: '03',
      title: 'Smarter Execution & Monitoring',
      desc: 'Unlock pre-approved lending facilities with zero manual paperwork, track active EMIs, and receive automated refinancing alerts when rates drop.',
      icon: ShieldCheck,
    },
  ];

  const faqs = [
    {
      category: 'Eligibility',
      q: 'How does LifeLoan predict my loan eligibility before I apply?',
      a: 'LifeLoan utilizes an explainable machine learning underwriting model that analyzes your Debt-to-Income (DTI) ratio, credit utilization, employment stability, and liquid asset reserves. It simulates lender risk guidelines in real-time without impacting your credit score.',
    },
    {
      category: 'Digital Twin',
      q: 'What is a Financial Digital Twin and how is it maintained?',
      a: 'Your Financial Digital Twin is a secure, real-time virtual replica of your wealth footprint. It continuously simulates future financial scenarios—such as interest rate shifts, income increases, or debt prepayments—to show how your borrowing capacity evolves over time.',
    },
    {
      category: 'Security',
      q: 'Is my financial data secure on LifeLoan?',
      a: 'Yes. LifeLoan employs hardware-level AES-256 encryption, zero-knowledge architectural privacy, and SOC2 Type II compliance. Your credentials are never stored in plain text, and data is only processed for underwriting insights.',
    },
    {
      category: 'Eligibility',
      q: 'Can I apply for multiple loan facilities simultaneously?',
      a: 'Yes. Your borrowing capacity covers a holistic limit. You can split your capital allocation across mortgages, business lines, and personal facilities while maintaining optimal DTI parameters.',
    },
    {
      category: 'Digital Twin',
      q: 'How does the Financial Recovery Planner help if my score drops?',
      a: 'If your credit score or liquidity changes, the Financial Recovery Planner generates a prioritized step-by-step roadmap (such as targeted debt snowballing or sweep rebalancing) to restore your financial health score back above 80%.',
    },
  ];

  const filteredFaqs = activeFaqCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === activeFaqCategory);

  return (
    <section id="how-it-works" className="relative py-20 lg:py-28 bg-[#0e1511]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        
        {/* HOW IT WORKS SECTION */}
        <div className="mb-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 text-xs font-bold tracking-[0.2em] text-[#4edea3] uppercase mb-3">
              <Layers className="h-4 w-4" />
              <span>THE ARCHITECTURE</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#dde4dd] sm:text-4xl lg:text-5xl">
              How LifeLoan Intelligence Works.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => {
              const IconComp = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="glass-panel rounded-2xl p-6 lg:p-8 relative border border-[#242c27] glass-panel-hover"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-bold text-[#4edea3]/40">{step.num}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
                      <IconComp className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#dde4dd] mb-3">
                    {step.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-[#bbcabf]">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* FAQ SECTION */}
        <div id="faq" className="pt-10 border-t border-[#242c27]">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 text-xs font-bold tracking-[0.2em] text-[#4edea3] uppercase mb-3">
              <HelpCircle className="h-4 w-4" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#dde4dd] sm:text-4xl">
              Everything You Need to Know.
            </h2>

            {/* Category Filters */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {(['All', 'Eligibility', 'Digital Twin', 'Security'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFaqCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    activeFaqCategory === cat
                      ? 'bg-[#10b981] text-[#003824] shadow-md shadow-[#10b981]/20'
                      : 'border border-[#2f3632] bg-[#161d19] text-[#bbcabf] hover:text-[#dde4dd]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          <div className="mx-auto max-w-3xl space-y-4">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl glass-panel border border-[#242c27] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-[#dde4dd] hover:text-[#4edea3]"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#4edea3] transition-transform duration-300 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#bbcabf] leading-relaxed border-t border-[#1a211d] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
