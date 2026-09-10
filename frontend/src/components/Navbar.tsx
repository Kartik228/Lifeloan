import React, { useState, useRef, useEffect } from 'react';

import {
  ShieldCheck,
  User,
  Sparkles,
  Menu,
  X,
  LogOut,
  Briefcase,
  Wallet,
  CreditCard,
  TrendingUp,
  ChevronDown,
  FileText,
  Loader2,
} from 'lucide-react';

import { api, formatINR, getStoredUser } from '../api';
import { FinancialProfile } from '../types';


// ============================================================
// PROPS
// ============================================================

interface NavbarProps {
  onOpenCheckEligibility: () => void;
  onOpenApply: () => void;
  onOpenAIChat: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenComparison?: () => void;
  /** Navigate to an authenticated page (loans, apply, dashboard, etc.) */
  onNavigateTo?: (page: string) => void;
}


// ============================================================
// PROFILE DROPDOWN
// ============================================================

interface ProfileDropdownProps {
  onLogout: () => void;
  onNavigateTo?: (page: string) => void;
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onLogout,
  onNavigateTo,
  onClose,
}) => {
  const storedUser = getStoredUser();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [user, setUser] = useState<{ id?: number; full_name?: string; email?: string; phone?: string } | null>(storedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [meData, profileData] = await Promise.all([
          api.get('/me').catch(() => null),
          api.get<FinancialProfile>('/financial-profile').catch(() => null),
        ]);
        if (mounted) {
          if (meData) setUser(meData);
          if (profileData) setProfile(profileData);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const navigate = (page: string) => {
    onClose();
    onNavigateTo?.(page);
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  // ── helpers ──────────────────────────────────────────────
  const initials = user?.full_name
    ? user.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const employmentLabel = profile?.employment_status
    ? profile.employment_status.charAt(0).toUpperCase() + profile.employment_status.slice(1).replace(/-/g, ' ')
    : '—';

  return (
    <div
      className="absolute right-0 top-full mt-3 w-80 rounded-2xl border border-[#2d3d33] bg-[#111a14] shadow-2xl shadow-black/60 z-50 overflow-hidden"
      id="profile-dropdown"
      role="dialog"
      aria-label="Account profile"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#10b981]/15 to-[#047857]/10 px-5 py-4 border-b border-[#242c27]">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#10b981] to-[#047857] text-[#003824] text-sm font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-[#71837a]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[#dde4dd] truncate">{user?.full_name || '—'}</p>
                <p className="text-[11px] text-[#71837a] truncate">{user?.email || '—'}</p>
                {user?.phone && (
                  <p className="text-[10px] text-[#4e5e52] truncate">{user.phone}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Financial snapshot ────────────────────────────── */}
      {!loading && profile && (
        <div className="px-5 py-3 border-b border-[#242c27]">
          <p className="mb-2.5 text-[10px] font-semibold tracking-widest text-[#4e5e52] uppercase">
            Financial Profile
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <ProfileStat
              icon={<Wallet className="h-3 w-3 text-[#4edea3]" />}
              label="Annual Income"
              value={formatINR(profile.annual_income)}
            />
            <ProfileStat
              icon={<TrendingUp className="h-3 w-3 text-[#4edea3]" />}
              label="Credit Score"
              value={String(profile.credit_score)}
            />
            <ProfileStat
              icon={<Briefcase className="h-3 w-3 text-[#4edea3]" />}
              label="Employment"
              value={employmentLabel}
            />
            <ProfileStat
              icon={<CreditCard className="h-3 w-3 text-[#4edea3]" />}
              label="Existing Debt"
              value={formatINR(profile.existing_debt)}
            />
            <ProfileStat
              icon={<Wallet className="h-3 w-3 text-[#71837a]" />}
              label="Monthly Expenses"
              value={formatINR(profile.monthly_expenses)}
            />
            <ProfileStat
              icon={<TrendingUp className="h-3 w-3 text-[#71837a]" />}
              label="Savings"
              value={formatINR(profile.savings)}
            />
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="p-2">
        <DropdownItem
          icon={<User className="h-4 w-4" />}
          label="Dashboard"
          onClick={() => navigate('dashboard')}
          id="profile-dropdown-dashboard"
        />
        <DropdownItem
          icon={<FileText className="h-4 w-4" />}
          label="My Loans"
          onClick={() => navigate('loans')}
          id="profile-dropdown-loans"
        />
        <DropdownItem
          icon={<Sparkles className="h-4 w-4" />}
          label="Apply for Loan"
          onClick={() => navigate('apply')}
          id="profile-dropdown-apply"
        />
        <div className="my-1 border-t border-[#242c27]" />
        <DropdownItem
          icon={<LogOut className="h-4 w-4" />}
          label="Logout"
          onClick={handleLogout}
          variant="danger"
          id="profile-dropdown-logout"
        />
      </div>
    </div>
  );
};


// ── Small stat cell ───────────────────────────────────────
const ProfileStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-start gap-1.5">
    <span className="mt-0.5">{icon}</span>
    <div>
      <p className="text-[9px] text-[#4e5e52] leading-none">{label}</p>
      <p className="text-[11px] font-semibold text-[#dde4dd] leading-tight truncate max-w-[95px]">{value}</p>
    </div>
  </div>
);


// ── Dropdown action item ──────────────────────────────────
const DropdownItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  id?: string;
}> = ({ icon, label, onClick, variant = 'default', id }) => (
  <button
    type="button"
    onClick={onClick}
    id={id}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
      variant === 'danger'
        ? 'text-red-300 hover:bg-red-500/10 hover:text-red-200'
        : 'text-[#bbcabf] hover:bg-[#1a2c1f] hover:text-[#dde4dd]'
    }`}
  >
    {icon}
    {label}
  </button>
);


// ============================================================
// NAVBAR
// ============================================================

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCheckEligibility,
  onOpenApply,
  onOpenAIChat,
  onOpenLogin,
  onLogout,
  isLoggedIn,
  activeSection,
  setActiveSection,
  onOpenComparison,
  onNavigateTo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Close dropdown when clicking outside ─────────────────
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // ── Close dropdown on Escape ──────────────────────────────
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [profileOpen]);

  // =====================================================
  // NAVIGATION ITEMS
  // =====================================================
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'digital-twin', label: 'Digital Twin' },
    { id: 'comparison', label: 'Compare Banks' },
    { id: 'how-it-works', label: 'How it Works' },
    { id: 'faq', label: 'FAQ' },
  ];

  // =====================================================
  // NAVIGATION
  // =====================================================
  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    setProfileOpen(false);

    // Authenticated users get routed to their full pages for digital twin & comparison
    if (isLoggedIn && onNavigateTo) {
      if (id === 'digital-twin') {
        onNavigateTo('digital-twin');
        return;
      }
      if (id === 'comparison') {
        onNavigateTo('comparison');
        return;
      }
    }

    if (id === 'comparison' && onOpenComparison) {
      onOpenComparison();
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogoutClick = () => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
    onLogout();
  };


  return (

    <header
      className="
        sticky
        top-0
        z-50
        w-full
        border-b
        border-[#242c27]/60
        bg-[#0e1511]/85
        backdrop-blur-xl
      "
    >

      <div
        className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-6
          py-4
          lg:px-10
        "
      >


        {/* =================================================
            BRAND
            ================================================= */}

        <div

          onClick={() => {
            if (isLoggedIn && onNavigateTo) {
              // Authenticated: navigate to landing page
              onNavigateTo('landing');
            } else {
              handleNavClick('home');
            }
          }}

          className="
            flex
            cursor-pointer
            items-center
            space-x-2.5
            group
          "

          id="navbar-logo"
        >

          <div
            className="
              relative
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-gradient-to-br
              from-[#10b981]
              to-[#047857]
              p-2
              shadow-lg
              shadow-[#10b981]/20
              transition-transform
              duration-300
              group-hover:scale-105
            "
          >

            <ShieldCheck
              className="
                h-5
                w-5
                text-[#003824]
              "
            />

          </div>


          <span
            className="
              font-serif
              text-2xl
              font-bold
              tracking-tight
              text-[#dde4dd]
            "
          >

            Life
            <span className="text-[#4edea3]">
              Loan
            </span>

          </span>

        </div>


        {/* =================================================
            DESKTOP NAVIGATION
            ================================================= */}

        <nav
          className="
            hidden
            items-center
            space-x-8
            md:flex
          "
          id="desktop-nav-links"
        >

          {navItems.map((item) => {

            const isActive =
              activeSection === item.id;

            return (

              <button

                key={item.id}

                onClick={() =>
                  handleNavClick(item.id)
                }

                className={`
                  relative
                  py-1
                  text-sm
                  font-medium
                  transition-colors
                  duration-200

                  ${
                    isActive
                      ? 'text-[#4edea3]'
                      : 'text-[#bbcabf] hover:text-[#dde4dd]'
                  }
                `}

                id={`nav-link-${item.id}`}
              >

                {item.label}

                {isActive && (

                  <span
                    className="
                      absolute
                      bottom-0
                      left-0
                      h-[2px]
                      w-full
                      rounded-full
                      bg-[#4edea3]
                      shadow-[0_0_8px_#4edea3]
                    "
                  />

                )}

              </button>

            );

          })}

        </nav>


        {/* =================================================
            DESKTOP ACTIONS
            ================================================= */}

        <div
          className="
            hidden
            items-center
            space-x-3.5
            md:flex
          "
          id="navbar-actions"
        >


          {/* AI ASSISTANT */}

          <button

            onClick={onOpenAIChat}

            className="
              flex
              items-center
              space-x-1.5
              rounded-full
              border
              border-[#4edea3]/30
              bg-[#161d19]
              px-3.5
              py-1.5
              text-xs
              font-semibold
              tracking-wider
              text-[#4edea3]
              transition-all
              hover:border-[#4edea3]
              hover:bg-[#1a211d]
              hover:shadow-[0_0_15px_rgba(78,222,163,0.2)]
            "

            id="ask-ai-button"
          >

            <Sparkles
              className="
                h-3.5
                w-3.5
              "
            />

            <span>
              AI ASSISTANT
            </span>

          </button>


          {/* =================================================
              ACCOUNT / PROFILE — authenticated
              ================================================= */}

          {isLoggedIn ? (

            /* ── Profile trigger + dropdown ── */
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
                title="Account & Profile"
                id="user-profile-button"
                className={`
                  flex
                  h-9
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  px-2.5
                  text-xs
                  font-semibold
                  transition-all
                  duration-200
                  ${profileOpen
                    ? 'border-[#4edea3] bg-[#10b981]/15 text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.25)]'
                    : 'border-[#3c4a42] bg-[#1a211d] text-[#dde4dd] hover:border-[#4edea3] hover:text-[#4edea3]'
                  }
                `}
              >
                <User className="h-4 w-4" />
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {profileOpen && (
                <ProfileDropdown
                  onLogout={onLogout}
                  onNavigateTo={onNavigateTo}
                  onClose={() => setProfileOpen(false)}
                />
              )}
            </div>

          ) : (

            /* ── Sign in button ── */
            <button
              onClick={onOpenLogin}
              title="Sign in to LifeLoan"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-[#3c4a42]
                bg-[#1a211d]
                text-[#dde4dd]
                transition-all
                hover:border-[#4edea3]
                hover:text-[#4edea3]
              "
              id="user-profile-button"
            >
              <User className="h-4 w-4" />
            </button>

          )}


          {/* =================================================
              LOGOUT (only when logged in, desktop)
              ================================================= */}

          {isLoggedIn && (

            <button

              onClick={
                handleLogoutClick
              }

              title="Logout"

              className="
                flex
                items-center
                justify-center
                rounded-full
                border
                border-[#3c4a42]
                bg-[#1a211d]
                px-3
                py-2
                text-xs
                font-semibold
                text-[#bbcabf]
                transition-all
                hover:border-red-400/60
                hover:text-red-300
              "
            >

              <LogOut
                className="
                  mr-1.5
                  h-3.5
                  w-3.5
                "
              />

              Logout

            </button>

          )}

        </div>


        {/* =================================================
            MOBILE MENU BUTTON
            ================================================= */}

        <div className="flex md:hidden">

          <button

            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }

            className="
              rounded-lg
              p-2
              text-[#bbcabf]
              hover:bg-[#1a211d]
              hover:text-[#dde4dd]
            "

            id="mobile-menu-toggle"
          >

            {mobileMenuOpen
              ? <X className="h-6 w-6" />
              : <Menu className="h-6 w-6" />
            }

          </button>

        </div>

      </div>


      {/* =================================================
          MOBILE DRAWER
          ================================================= */}

      {mobileMenuOpen && (

        <div
          className="
            border-b
            border-[#242c27]
            bg-[#0e1511]
            px-6
            py-4
            md:hidden
          "
          id="mobile-menu-drawer"
        >

          <div
            className="
              flex
              flex-col
              space-y-3
            "
          >


            {/* Navigation */}

            {navItems.map((item) => (

              <button

                key={item.id}

                onClick={() =>
                  handleNavClick(item.id)
                }

                className={`
                  text-left
                  text-base
                  font-medium

                  ${
                    activeSection === item.id
                      ? 'text-[#4edea3]'
                      : 'text-[#bbcabf]'
                  }
                `}
              >

                {item.label}

              </button>

            ))}


            <hr
              className="
                my-2
                border-[#242c27]
              "
            />


            {/* AI */}

            <button

              onClick={() => {

                setMobileMenuOpen(false);

                onOpenAIChat();

              }}

              className="
                w-full
                rounded-full
                border
                border-[#4edea3]/30
                px-4
                py-2
                text-center
                text-sm
                font-semibold
                text-[#4edea3]
              "
            >

              AI Assistant

            </button>


            {/* Eligibility */}

            <button

              onClick={() => {

                setMobileMenuOpen(false);

                onOpenCheckEligibility();

              }}

              className="
                w-full
                rounded-full
                bg-[#10b981]
                px-4
                py-2
                text-center
                text-sm
                font-semibold
                text-[#003824]
              "
            >

              Check Eligibility

            </button>


            {/* Apply */}

            <button

              onClick={() => {

                setMobileMenuOpen(false);

                onOpenApply();

              }}

              className="
                w-full
                rounded-full
                border
                border-[#3c4a42]
                px-4
                py-2
                text-center
                text-sm
                font-semibold
                text-[#dde4dd]
              "
            >

              Apply For a Loan

            </button>


            {/* Account — authenticated mobile items */}

            {isLoggedIn && (
              <>
                <hr className="my-1 border-[#242c27]" />

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateTo?.('dashboard');
                  }}
                  className="
                    w-full
                    rounded-full
                    border
                    border-[#4edea3]/40
                    px-4
                    py-2
                    text-center
                    text-sm
                    font-semibold
                    text-[#4edea3]
                  "
                >
                  Dashboard
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateTo?.('loans');
                  }}
                  className="
                    w-full
                    rounded-full
                    border
                    border-[#3c4a42]
                    px-4
                    py-2
                    text-center
                    text-sm
                    font-semibold
                    text-[#dde4dd]
                  "
                >
                  My Loans
                </button>
              </>
            )}


            {/* Account — unauthenticated */}

            {!isLoggedIn && (

              <button

                onClick={() => {

                  setMobileMenuOpen(false);

                  onOpenLogin();

                }}

                className="
                  w-full
                  rounded-full
                  border
                  border-[#4edea3]/40
                  px-4
                  py-2
                  text-center
                  text-sm
                  font-semibold
                  text-[#4edea3]
                "
              >

                Sign In

              </button>

            )}


            {/* Logout */}

            {isLoggedIn && (

              <button

                onClick={
                  handleLogoutClick
                }

                className="
                  w-full
                  rounded-full
                  border
                  border-red-400/30
                  px-4
                  py-2
                  text-center
                  text-sm
                  font-semibold
                  text-red-300
                "
              >

                Logout

              </button>

            )}

          </div>

        </div>

      )}

    </header>

  );
};