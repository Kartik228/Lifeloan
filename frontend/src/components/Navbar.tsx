import React, { useState } from 'react';
import { ShieldCheck, User, Sparkles, FileText, ChevronRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
  onOpenAIChat: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCheckEligibility,
  onOpenApply,
  onOpenAIChat,
  activeSection,
  setActiveSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'digital-twin', label: 'Digital Twin' },
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'insights', label: 'Insights' },
    { id: 'faq', label: 'FAQ' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#242c27]/60 bg-[#0e1511]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex cursor-pointer items-center space-x-2.5 group"
          id="navbar-logo"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857] p-2 shadow-lg shadow-[#10b981]/20 transition-transform duration-300 group-hover:scale-105">
            <ShieldCheck className="h-5 w-5 text-[#003824]" />
            <div className="absolute inset-0 rounded-lg bg-[#4edea3] opacity-0 blur-sm transition-opacity group-hover:opacity-40" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[#dde4dd]">
            Life<span className="text-[#4edea3]">Loan</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center space-x-8 md:flex" id="desktop-nav-links">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-[#4edea3]'
                    : 'text-[#bbcabf] hover:text-[#dde4dd]'
                }`}
                id={`nav-link-${item.id}`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions & User Controls */}
        <div className="hidden items-center space-x-3.5 md:flex" id="navbar-actions">
          {/* Ask AI Pill */}
          <button
            onClick={onOpenAIChat}
            className="flex items-center space-x-1.5 rounded-full border border-[#4edea3]/30 bg-[#161d19] px-3.5 py-1.5 text-xs font-semibold tracking-wider text-[#4edea3] transition-all hover:border-[#4edea3] hover:bg-[#1a211d] hover:shadow-[0_0_15px_rgba(78,222,163,0.2)]"
            id="ask-ai-button"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI ASSISTANT</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenApply}
            title="Loan Profile / Apply"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3c4a42] bg-[#1a211d] text-[#dde4dd] transition-all hover:border-[#4edea3] hover:text-[#4edea3]"
            id="user-profile-button"
          >
            <User className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#bbcabf] hover:bg-[#1a211d] hover:text-[#dde4dd]"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#242c27] bg-[#0e1511] px-6 py-4 md:hidden" id="mobile-menu-drawer">
          <div className="flex flex-col space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left text-base font-medium ${
                  activeSection === item.id ? 'text-[#4edea3]' : 'text-[#bbcabf]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <hr className="border-[#242c27] my-2" />
            <div className="flex flex-col space-y-2 pt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckEligibility();
                }}
                className="w-full rounded-full bg-[#10b981] px-4 py-2 text-center text-sm font-semibold text-[#003824]"
              >
                Check Eligibility
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenApply();
                }}
                className="w-full rounded-full border border-[#3c4a42] px-4 py-2 text-center text-sm font-semibold text-[#dde4dd]"
              >
                Apply For a Loan
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
