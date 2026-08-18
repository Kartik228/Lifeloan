import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BentoGrid } from './components/BentoGrid';
import { DigitalTwin } from './components/DigitalTwin';
import { HowItWorksAndFAQ } from './components/HowItWorksAndFAQ';
import { Footer } from './components/Footer';
import { EligibilityModal } from './components/EligibilityModal';
import { ApplicationModal } from './components/ApplicationModal';
import { AIChatModal } from './components/AIChatModal';
import { INITIAL_LOANS, INITIAL_RECOVERY_PLAN } from './data/mockData';
import { LoanItem } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [loans, setLoans] = useState<LoanItem[]>(INITIAL_LOANS);
  const [recoveryPlan] = useState(INITIAL_RECOVERY_PLAN);
  const [activeSection, setActiveSection] = useState('home');

  // Modals state
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handlePayEmi = (loanId: string) => {
    setLoans((prevLoans) =>
      prevLoans.map((loan) => {
        if (loan.id === loanId) {
          const newRemaining = Math.max(0, loan.remainingAmount - loan.emi);
          const newProgress = Math.round(
            ((loan.amount - newRemaining) / loan.amount) * 100
          );
          return {
            ...loan,
            remainingAmount: newRemaining,
            progressPercentage: newProgress,
            status: newRemaining === 0 ? 'completed' : loan.status,
          };
        }
        return loan;
      })
    );

    const paidLoan = loans.find((l) => l.id === loanId);
    showToast(`Successfully processed $${paidLoan?.emi.toLocaleString()} EMI payment for ${paidLoan?.title}.`);
  };

  const handleLoanSubmitted = (newLoan: LoanItem) => {
    setLoans((prev) => [newLoan, ...prev]);
    showToast(`Pre-approval granted for $${newLoan.amount.toLocaleString()} ${newLoan.type} Facility.`);
  };

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd] font-sans relative selection:bg-[#10b981] selection:text-[#003824]">
      
      {/* Navbar */}
      <Navbar
        onOpenCheckEligibility={() => setIsEligibilityOpen(true)}
        onOpenApply={() => setIsApplyOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero
          onOpenCheckEligibility={() => setIsEligibilityOpen(true)}
          onOpenApply={() => setIsApplyOpen(true)}
        />

        {/* Bento Grid Feature Modules */}
        <BentoGrid
          loans={loans}
          recoveryPlan={recoveryPlan}
          onOpenCheckEligibility={() => setIsEligibilityOpen(true)}
          onOpenApply={() => setIsApplyOpen(true)}
          onPayEmi={handlePayEmi}
        />

        {/* Financial Digital Twin Engine */}
        <DigitalTwin onOpenAIChat={() => setIsAIChatOpen(true)} />

        {/* How It Works & FAQ */}
        <HowItWorksAndFAQ />
      </main>

      {/* Footer */}
      <Footer
        onOpenCheckEligibility={() => setIsEligibilityOpen(true)}
        onOpenApply={() => setIsApplyOpen(true)}
        setActiveSection={setActiveSection}
      />

      {/* Modals */}
      <EligibilityModal
        isOpen={isEligibilityOpen}
        onClose={() => setIsEligibilityOpen(false)}
        onOpenApply={() => {
          setIsEligibilityOpen(false);
          setIsApplyOpen(true);
        }}
      />

      <ApplicationModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onLoanSubmitted={handleLoanSubmitted}
      />

      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      {/* Floating Action Badge for AI Chat */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAIChatOpen(true)}
          id="floating-ai-assistant-btn"
          className="flex items-center space-x-2 rounded-full border border-[#4edea3]/40 bg-[#161d19]/90 px-4 py-3 text-xs font-bold text-[#4edea3] shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-[#10b981] hover:text-[#003824] hover:shadow-[0_0_25px_rgba(78,222,163,0.5)]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
          </span>
          <span>ASK AI ADVISOR</span>
        </button>
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center space-x-2.5 rounded-2xl glass-panel border border-[#4edea3]/50 bg-[#161d19] px-5 py-3.5 text-xs text-[#dde4dd] shadow-2xl animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-[#4edea3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
