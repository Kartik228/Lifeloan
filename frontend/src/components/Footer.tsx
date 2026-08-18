import React from 'react';
import { ShieldCheck, Globe, Shield, Landmark } from 'lucide-react';

interface FooterProps {
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
  setActiveSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCheckEligibility,
  onOpenApply,
  setActiveSection,
}) => {
  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
              Helping individuals make smarter borrowing decisions through intelligent financial analysis, predictive credit modeling, and real-time digital twin simulations.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-[#dde4dd] uppercase tracking-wider">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => scrollTo('home')} className="hover:text-[#4edea3] transition-colors">
                  Dashboard & Portfolio
                </button>
              </li>
              <li>
                <button onClick={onOpenApply} className="hover:text-[#4edea3] transition-colors">
                  Loan Application Wizard
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('features')} className="hover:text-[#4edea3] transition-colors">
                  Loan Tracker & EMI Manager
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('digital-twin')} className="hover:text-[#4edea3] transition-colors">
                  Financial Digital Twin
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
                <button onClick={() => scrollTo('faq')} className="hover:text-[#4edea3] transition-colors">
                  Documentation & FAQ
                </button>
              </li>
              <li>
                <a href="#privacy" className="hover:text-[#4edea3] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#4edea3] transition-colors">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Partner Badge (matching image) */}
          <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
            <div className="rounded-full border border-[#2f3632] bg-[#161d19] px-4 py-2 text-center">
              <span className="block text-[9px] font-bold tracking-widest text-[#4edea3] uppercase mb-1">
                INSTITUTIONAL PARTNER
              </span>
              <div className="flex justify-center space-x-3 text-[#bbcabf] pt-0.5">
                <Globe className="h-4 w-4 hover:text-[#4edea3] cursor-pointer" />
                <Shield className="h-4 w-4 hover:text-[#4edea3] cursor-pointer" />
                <Landmark className="h-4 w-4 hover:text-[#4edea3] cursor-pointer" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#86948a] space-y-2 sm:space-y-0">
          <div>
            © 2024 LifeLoan. Private & Confidential.
          </div>
          <div>
            Member of Global Finance Alliance
          </div>
        </div>

      </div>
    </footer>
  );
};
