import React, { useEffect, useState } from "react";
import RecoveryPlanner from "./components/RecoveryPlanner";
import Dashboard from "./components/Dashboard";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { BentoGrid } from "./components/BentoGrid";
import { DigitalTwin } from "./components/DigitalTwin";
import { HowItWorksAndFAQ } from "./components/HowItWorksAndFAQ";
import { Footer } from "./components/Footer";

import MyLoans from "./components/MyLoans";
import LoanApplication from "./components/LoanApplication";
import EMICalculator from "./components/EMICalculator";
import LoanComparison from "./components/LoanComparison";

import { EligibilityModal } from "./components/EligibilityModal";
import { ApplicationModal } from "./components/ApplicationModal";
import { AIChatModal } from "./components/AIChatModal";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsAndConditions } from "./components/TermsAndConditions";

import {
  INITIAL_LOANS,
  INITIAL_RECOVERY_PLAN,
} from "./data/mockData";

import { LoanItem } from "./types";
import { CheckCircle2 } from "lucide-react";
import Login from "./components/LoginPage";
import { clearAuthSession } from "./api";

export default function App() {
  // =====================================================
  // PAGE / LOGIN STATE
  // =====================================================
  const [currentPage, setCurrentPage] = useState("landing");
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("lifeloan_logged_in") === "true"
  );

  const navigateTo = (page: string) => {
    if (page === "faq") {
      setCurrentPage("landing");
      setTimeout(() => {
        const el = document.getElementById("faq");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }
    setCurrentPage(page);
    try {
      window.history.pushState({ page }, "", "");
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =====================================================
  // BROWSER BACK BUTTON & UNAUTHORIZED LISTENER
  // =====================================================
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const target = event.state?.page || (isLoggedIn ? "dashboard" : "landing");
      setShowLogin(false);
      setCurrentPage(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleUnauthorized = () => {
      setIsLoggedIn(false);
      setCurrentPage("landing");
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("lifeloan-unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("lifeloan-unauthorized", handleUnauthorized);
    };
  }, [isLoggedIn]);


  // =====================================================
  // APP STATE
  // =====================================================

  const [loans, setLoans] =
    useState<LoanItem[]>(
      INITIAL_LOANS
    );

  const [recoveryPlan] =
    useState(
      INITIAL_RECOVERY_PLAN
    );

  const [activeSection, setActiveSection] =
    useState("home");


  // =====================================================
  // MODALS
  // =====================================================

  const [
    isEligibilityOpen,
    setIsEligibilityOpen,
  ] = useState(false);

  const [
    isApplyOpen,
    setIsApplyOpen,
  ] = useState(false);

  const [
    isAIChatOpen,
    setIsAIChatOpen,
  ] = useState(false);


  // =====================================================
  // TOAST
  // =====================================================

  const [
    toastMessage,
    setToastMessage,
  ] = useState<string | null>(null);


  const showToast = (
    msg: string
  ) => {

    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

  };


  // =====================================================
  // LOGIN SUCCESS
  // =====================================================

  const handleLoginSuccess = () => {

    setIsLoggedIn(true);

    setShowLogin(false);

    setCurrentPage("dashboard");


    if (
      window.location.hash ===
      "#login"
    ) {

      window.history.replaceState(
        { page: "dashboard" },
        "",
        window.location.pathname
      );

    }


    showToast(
      "Welcome to LifeLoan!"
    );

  };


  // =====================================================
  // OPEN LOGIN
  // =====================================================

  const handleOpenLogin = () => {

    if (
      window.location.hash !==
      "#login"
    ) {

      window.history.pushState(
        { page: "login" },
        "",
        "#login"
      );

    }

    setShowLogin(true);

  };


  // =====================================================
  // CLOSE LOGIN
  // =====================================================

  const handleCloseLogin = () => {

    setShowLogin(false);

    if (
      window.location.hash ===
      "#login"
    ) {

      window.history.back();

    }

  };


  // =====================================================
  // REQUIRE LOGIN
  // =====================================================

  const requireLogin = (
    action: () => void
  ) => {

    if (!isLoggedIn) {

      handleOpenLogin();

      return;

    }

    action();

  };


  // =====================================================
  // CHECK ELIGIBILITY
  // =====================================================

  const handleCheckEligibility = () => {

    requireLogin(() => {

      setIsEligibilityOpen(true);

    });

  };


  // =====================================================
  // APPLY FOR LOAN
  // =====================================================

  const handleApplyLoan = () => {
    requireLogin(() => {
      navigateTo("apply");
    });
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    // Clear all auth session data (token, user, lifeloan_logged_in, user_id)
    clearAuthSession();


    setIsLoggedIn(false);

    setShowLogin(false);

    setCurrentPage("landing");

    setIsEligibilityOpen(false);

    setIsApplyOpen(false);

    setIsAIChatOpen(false);


    if (
      window.location.hash
    ) {

      window.history.replaceState(
        { page: "landing" },
        "",
        window.location.pathname
      );

    }


    showToast(
      "You have been logged out successfully."
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };



  // =====================================================
  // LOAN SUBMITTED
  // =====================================================

  const handleLoanSubmitted =
    (
      newLoan: LoanItem
    ) => {

      setLoans(
        (prev) => [
          newLoan,
          ...prev,
        ]
      );


      showToast(
        `Pre-approval granted for ₹${newLoan.amount.toLocaleString(
          "en-IN"
        )} ${newLoan.type} Facility.`
      );

    };


  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (showLogin) {

    return (

      <Login
        onLoginSuccess={
          handleLoginSuccess
        }
      />

    );

  }


  // =====================================================
  // DASHBOARD
  // =====================================================

  if (
    isLoggedIn &&
    currentPage ===
      "dashboard"
  ) {

    return (

      <>

        <Dashboard
          onLogout={handleLogout}
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onNavigate={(page) => {
            if (page === "advisor" || page === "ai-chat") {
              setIsAIChatOpen(true);
              return;
            }
            navigateTo(page);
          }}
        />

        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </>
    );
  }

  // =====================================================
  // MY LOANS
  // =====================================================
  if (isLoggedIn && currentPage === "loans") {
    return (
      <MyLoans
        onBack={() => navigateTo("dashboard")}
        onApplyLoan={() => navigateTo("apply")}
      />
    );
  }

  // =====================================================
  // LOAN APPLICATION
  // =====================================================
  if (isLoggedIn && currentPage === "apply") {
    return (
      <>
        <LoanApplication
          onBack={() => navigateTo("dashboard")}
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onNavigate={navigateTo}
        />
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </>
    );
  }

  // =====================================================
  // FINANCIAL RECOVERY PLANNER
  // =====================================================
  if (isLoggedIn && currentPage === "recovery") {
    return (
      <>
        <RecoveryPlanner
          onBack={() => navigateTo("dashboard")}
          onOpenAIChat={() => setIsAIChatOpen(true)}
        />
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </>
    );
  }

  // =====================================================
  // FINANCIAL DIGITAL TWIN
  // =====================================================
  if (isLoggedIn && currentPage === "digital-twin") {
    return (
      <>
        <DigitalTwin
          onBack={() => navigateTo("dashboard")}
          onOpenAIChat={() => setIsAIChatOpen(true)}
        />
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </>
    );
  }

  // =====================================================
  // EMI CALCULATOR
  // =====================================================
  if (currentPage === "emi") {
    return (
      <EMICalculator
        onBack={() => navigateTo(isLoggedIn ? "dashboard" : "landing")}
      />
    );
  }

  // =====================================================
  // BANK / LOAN COMPARISON
  // =====================================================
  if (currentPage === "comparison") {
    return (
      <>
        <LoanComparison
          onBack={() => navigateTo(isLoggedIn ? "dashboard" : "landing")}
          onApplyLoan={() => {
            if (isLoggedIn) {
              navigateTo("apply");
            } else {
              setShowLogin(true);
            }
          }}
        />
        <AIChatModal
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
        />
      </>
    );
  }

  // =====================================================
  // PRIVACY POLICY
  // =====================================================
  if (currentPage === "privacy") {
    return (
      <PrivacyPolicy
        onBack={() => navigateTo(isLoggedIn ? "dashboard" : "landing")}
      />
    );
  }

  // =====================================================
  // TERMS & CONDITIONS
  // =====================================================
  if (currentPage === "terms") {
    return (
      <TermsAndConditions
        onBack={() => navigateTo(isLoggedIn ? "dashboard" : "landing")}
      />
    );
  }


  // =====================================================
  // LANDING PAGE
  // =====================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#0e1511]
        text-[#dde4dd]
        font-sans
        relative
        selection:bg-[#10b981]
        selection:text-[#003824]
      "
    >

      {/* =================================================
          NAVBAR
          ================================================= */}

      <Navbar

        onOpenCheckEligibility={
          handleCheckEligibility
        }

        onOpenApply={
          handleApplyLoan
        }

        onOpenAIChat={() =>
          setIsAIChatOpen(
            true
          )
        }

        onOpenLogin={
          handleOpenLogin
        }

        onLogout={
          handleLogout
        }

        isLoggedIn={
          isLoggedIn
        }

        activeSection={
          activeSection
        }

        setActiveSection={
          setActiveSection
        }

        onOpenComparison={() =>
          navigateTo('comparison')
        }

        onNavigateTo={navigateTo}

      />


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main>

        <Hero

          onOpenCheckEligibility={
            handleCheckEligibility
          }

          onOpenApply={
            handleApplyLoan
          }

        />


        <BentoGrid

          loans={
            loans
          }

          recoveryPlan={
            recoveryPlan
          }

          onOpenCheckEligibility={
            handleCheckEligibility
          }

          onOpenApply={
            handleApplyLoan
          }

          onOpenLogin={handleOpenLogin}
          isLoggedIn={isLoggedIn}
          onNavigateTo={navigateTo}

        />


        {/* =================================================
            LANDING PAGE DIGITAL TWIN PREVIEW
            ================================================= */}

        <DigitalTwin

          onOpenAIChat={() =>
            setIsAIChatOpen(
              true
            )
          }

        />


        <HowItWorksAndFAQ />

      </main>


      {/* =================================================
          FOOTER
          ================================================= */}

      <Footer
        onOpenCheckEligibility={
          handleCheckEligibility
        }
        onOpenApply={
          handleApplyLoan
        }
        setActiveSection={
          setActiveSection
        }
        onNavigateTo={
          navigateTo
        }
        onOpenComparison={() =>
          navigateTo("comparison")
        }
      />


      {/* =================================================
          ELIGIBILITY MODAL
          ================================================= */}

      <EligibilityModal

        isOpen={
          isEligibilityOpen
        }

        onClose={() =>
          setIsEligibilityOpen(
            false
          )
        }

        onOpenApply={() => {

          setIsEligibilityOpen(
            false
          );

          handleApplyLoan();

        }}

      />


      {/* =================================================
          APPLICATION MODAL
          ================================================= */}

      <ApplicationModal

        isOpen={
          isApplyOpen
        }

        onClose={() =>
          setIsApplyOpen(
            false
          )
        }

        onLoanSubmitted={
          handleLoanSubmitted
        }

      />


      {/* =================================================
          AI CHAT
          ================================================= */}

      <AIChatModal

        isOpen={
          isAIChatOpen
        }

        onClose={() =>
          setIsAIChatOpen(
            false
          )
        }

      />


      {/* =================================================
          FLOATING AI ASSISTANT
          ================================================= */}

      <div
        className="
          fixed
          bottom-6
          right-6
          z-40
        "
      >

        <button

          onClick={() =>
            setIsAIChatOpen(
              true
            )
          }

          id="floating-ai-assistant-btn"

          className="
            flex
            items-center
            space-x-2
            rounded-full
            border
            border-[#4edea3]/40
            bg-[#161d19]/90
            px-4
            py-3
            text-xs
            font-bold
            text-[#4edea3]
            shadow-2xl
            backdrop-blur-xl
            transition-all
            duration-300
            hover:scale-105
            hover:bg-[#10b981]
            hover:text-[#003824]
            hover:shadow-[0_0_25px_rgba(78,222,163,0.5)]
          "
        >

          <span
            className="
              relative
              flex
              h-2.5
              w-2.5
            "
          >

            <span
              className="
                animate-ping
                absolute
                inline-flex
                h-full
                w-full
                rounded-full
                bg-[#4edea3]
                opacity-75
              "
            />

            <span
              className="
                relative
                inline-flex
                rounded-full
                h-2.5
                w-2.5
                bg-[#10b981]
              "
            />

          </span>


          <span>
            ASK AI ADVISOR
          </span>

        </button>

      </div>


      {/* =================================================
          TOAST
          ================================================= */}

      {toastMessage && (

        <div
          className="
            fixed
            bottom-6
            left-6
            z-50
            flex
            items-center
            space-x-2.5
            glass-panel
            border
            border-[#4edea3]/50
            bg-[#161d19]
            px-5
            py-3.5
            text-xs
            text-[#dde4dd]
            shadow-2xl
            animate-bounce
          "
        >

          <CheckCircle2
            className="
              h-4
              w-4
              text-[#4edea3]
              shrink-0
            "
          />

          <span>
            {toastMessage}
          </span>

        </div>

      )}

    </div>

  );

}