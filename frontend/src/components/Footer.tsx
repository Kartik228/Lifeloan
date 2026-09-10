import React from 'react';
import { ShieldCheck, Building2, ArrowRight } from 'lucide-react';

interface FooterProps {
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
  setActiveSection: (section: string) => void;
  onNavigateTo?: (page: string) => void;
  onOpenComparison?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCheckEligibility,
  onOpenApply,
  setActiveSection,
  onNavigateTo,
  onOpenComparison,
}) => {
  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNav = (page: string, fallbackSectionId?: string) => {
    if (onNavigateTo) {
      onNavigateTo(page);
    } else if (fallbackSectionId) {
      scrollTo(fallbackSectionId);
    }
  };

  return (
    <footer className="border-t border-[#242c27] bg-[#09100c] pt-16 pb-12 text-[#86948a]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 pb-12 border-b border-[#1f2622]">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10b981] text-[#003824]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#dde4dd]">
                Life<span className="text-[#4edea3]">Loan</span>
              </span>
            </div>

            <p className="text-xs leading-relaxed max-w-sm text-[#bbcabf]">
              Empowering Indian borrowers to make smarter financial decisions through AI-driven credit risk intelligence, real-time digital twin simulations, and transparent lender comparisons.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#dde4dd] uppercase tracking-wider">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('dashboard', 'home')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Dashboard & Portfolio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenApply}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Loan Application Wizard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('loans', 'features')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Loan Tracker & EMI Manager
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('digital-twin', 'digital-twin')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Financial Digital Twin
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('comparison', 'features')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Bank Comparison Marketplace
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-[#dde4dd] uppercase tracking-wider">
              RESOURCES
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo('faq')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Documentation & FAQ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('privacy')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('terms')}
                  className="hover:text-[#4edea3] transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>

          {/* LENDING MARKETPLACE ACTION */}
          <div className="md:col-span-2 space-y-3 flex flex-col justify-start">
            <h4 className="text-xs font-bold text-[#dde4dd] uppercase tracking-wider">
              MARKETPLACE
            </h4>
            <div className="rounded-2xl border border-[#2f3632] bg-[#161d19] p-4 text-left space-y-2">
              <span className="block text-[10px] font-bold tracking-wider text-[#4edea3] uppercase">
                BANK RATES
              </span>
              <p className="text-[11px] leading-relaxed text-[#86948a]">
                Compare offers across SBI, HDFC, ICICI, Axis, Kotak & Bajaj.
              </p>
              <button
                type="button"
                onClick={onOpenComparison ? onOpenComparison : () => handleNav('comparison')}
                className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-[#10b981]/15 px-3 py-2 text-xs font-bold text-[#4edea3] hover:bg-[#10b981] hover:text-[#003824] transition-all"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Compare Banks</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#86948a] space-y-2 sm:space-y-0">
          <div>
            © 2026 LifeLoan. All rights reserved.
          </div>
          <div className="text-[11px] text-[#71837a]">
            AI-Powered Financial Intelligence Platform • Built for India
          </div>
        </div>
      </div>
    </footer>
  );
};
