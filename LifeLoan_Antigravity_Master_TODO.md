**LIFELOAN --- COMPLETE PROJECT FINISHING & BUG-FIX SPECIFICATION**

**MASTER TASK LIST FOR ANTIGRAVITY**

Use this as the implementation checklist. Audit the whole project first,
identify the files actually used by the running app, preserve working
ML/AI functionality, and then implement and test every item.

# 1. CRITICAL BACKEND & AUTHENTICATION

-   Remove the duplicate POST /register route and keep one canonical
    registration implementation. Audit all routes for
    duplicates/conflicts.

-   Finish JWT authentication: protected requests must send
    Authorization: Bearer \<token\>.

-   Derive the logged-in user from JWT on the backend. Remove
    temporary/hardcoded user_id=1 behavior.

-   Prevent cross-user access to loans, applications, payments,
    predictions, and financial profiles.

-   Use Pydantic request/response schemas wherever practical; validate
    backend inputs and return useful 4xx errors.

-   Ensure passwords are securely hashed and never stored/returned as
    plaintext.

# 2. GEMINI / AI RELIABILITY

-   Keep LifeLoan AI rules: never guarantee approval, rejection,
    interest rate, loan amount, or financial outcome.

-   Add bounded exponential-backoff retries for temporary Gemini 429/5xx
    errors.

-   Never show raw Gemini/API errors to users. Show a friendly
    unavailable message plus Try Again.

-   Differentiate backend offline, Gemini unavailable, and ML/model
    errors where possible.

-   Keep AI grounded only in current LifeLoan user context.

# 3. SINGLE SOURCE OF TRUTH

-   Create/use one normalized financial profile concept shared by
    Dashboard, My Loans, Recovery Planner, Digital Twin, and AI Advisor.

-   Preferred flow: JWT → backend → database → frontend.

-   Do not let stale localStorage override database values.

-   If localStorage is retained as a cache, update/invalidate it
    consistently.

-   Remove conflicting/mock values across components.

# 4. ₹ / INDIAN FORMATTING

-   Audit the entire app for \$/USD and use ₹ with Indian number
    formatting for real LifeLoan financial data.

-   Fix Dashboard, Loan Application, My Loans, Digital Twin, Recovery
    Planner, EMI Calculator, charts, recommendations, and toast
    messages.

-   Do not use arbitrary USD→INR conversion for real user values.

# 5. LOAN APPLICATION

-   Finish Personal → Financial → Loan → Credit → Submit → ML assessment
    → Save application/prediction.

-   Validate all fields, preserve values between steps, reject
    negative/invalid inputs, and show field-level messages.

-   Persist application and prediction to the backend for the
    authenticated user.

-   Do not create a fake loan simply because a prediction was returned.

# 6. ML ASSESSMENT & XAI

-   Use the real trained ML model and existing preprocessing/feature
    pipeline.

-   Keep decision, default_probability, predicted_loan_amount, and
    xai_factors consistent.

-   Clearly distinguish predictions from guarantees.

-   Show risk/approval probability consistently and correctly.

-   Translate XAI/SHAP factors into understandable explanations without
    inventing reasons.

-   Test strong, weak, and high-loan-request profiles.

# 7. MY LOANS

-   Make My Loans fully backend/database driven; remove production
    reliance on INITIAL_LOANS/mock loans.

-   Load only the authenticated user\'s real loans.

-   Pay EMI: frontend → backend → database → refreshed UI.

-   Handle final EMI correctly and never allow negative remaining
    balance.

-   Show backend payment history and useful empty states.

-   Set status to completed when remaining balance reaches zero.

# 8. EMI CALCULATOR

-   Inputs: loan amount, interest rate, tenure. Outputs: monthly EMI,
    total interest, total repayment.

-   Add amortization schedule (month, principal, interest, remaining
    balance) if compatible with the existing design.

-   Use ₹ and Indian formatting; validate inputs and edge cases.

# 9. FINANCIAL DIGITAL TWIN --- MAJOR FEATURE

-   Remove hardcoded demo values for authenticated users (credit score,
    borrowing capacity, approval probability, etc.).

-   For logged-out visitors, label any generic demo clearly or ask them
    to log in; never imply demo values belong to the visitor.

-   Load real current income, expenses, savings, debt, credit score,
    active loans, latest prediction, and relevant profile data.

-   Keep scenario inputs separate from current state. Sliders edit a
    scenario; RUN SIMULATION performs the simulation.

-   Recommended controls: loan amount, interest rate, tenure; optionally
    income/expense changes.

-   Calculate projected EMI, monthly cash flow/surplus, debt, and other
    relevant effects.

-   Show CURRENT vs SIMULATED side-by-side.

-   Show current risk vs simulated risk and the change in percentage
    points.

-   Use the REAL ML model for simulated risk; never replace it with fake
    frontend formulas.

-   If useful, add POST /digital-twin/simulate to build a scenario and
    call the real prediction pipeline.

-   Add ASK AI WHY using current profile + simulated profile + model
    result.

-   Explain that Digital Twin results are simulations/predictions, not
    guarantees.

-   Keep the canvas animation performant, cancel requestAnimationFrame
    on unmount, and consider reduced-motion support.

# 10. AI FINANCIAL RECOVERY PLANNER

-   Use the current authenticated user\'s financial profile, not only
    stale localStorage.

-   Ensure income, expenses, savings, debt, credit score, risk, and
    prediction values are internally consistent.

-   Keep 30/60/90-day planning but make targets consistent with real
    starting values.

-   Show risk, credit score, debt, and a concise financial snapshot.

-   If feasible, add Not Started / In Progress / Completed progress
    tracking and persist it.

# 11. BANK / LOAN COMPARISON --- REQUIRED

-   Include/finish a Loan Comparison feature for comparing loan offers
    across different banks/lenders.

-   Compare at minimum: bank/lender, loan type, interest rate,
    processing fee, tenure, estimated EMI, total repayment, eligibility
    highlights, and important terms/fees when available.

-   Let users enter/select a desired loan amount and tenure so offers
    are compared consistently.

-   Add sorting such as lowest EMI, lowest interest rate, lowest total
    repayment, and lowest processing fee.

-   Clearly label whether a rate/offer is indicative, user-specific, or
    externally sourced.

-   Do not invent live bank rates. Use a verified data source/API for
    live data, or clearly label configured data as DEMO.

-   If a comparison component/API already exists, audit and connect it
    instead of duplicating it.

-   Keep comparison separate from ML prediction: ML evaluates user
    risk/outcome; comparison helps evaluate lender offers.

# 12. DASHBOARD

-   Make Dashboard the authenticated user\'s financial command center.

-   Show dynamic income, expenses, surplus, savings, debt, credit score,
    default risk, active loans, and relevant activity.

-   Remove fake/demo numbers from authenticated views.

-   Test navigation to My Loans, Apply, EMI Calculator, Digital Twin,
    Recovery Planner, AI Advisor, and Loan Comparison.

-   Fix all dead buttons, missing route handlers, loading states, empty
    states, and errors.

# 13. AI ADVISOR UX

-   Use current profile, active loans, payment history, latest
    application/prediction, recovery plan, and latest Digital Twin
    simulation where available.

-   Add quick prompts: Why was I approved? Why is my risk high? How can
    I improve? Can I afford another loan? Explain my Digital Twin. Help
    reduce debt.

-   Support Enter to send and Shift+Enter for newline; disable send
    while loading; auto-scroll; handle long responses.

-   Provide retry and friendly error states.

# 14. NAVIGATION & BROWSER BACK

-   Audit manual page/hash navigation.

-   Test landing → login → dashboard → loans/apply and every feature
    page.

-   Browser Back must behave logically and must not unexpectedly reset
    to landing/login.

-   Closing Login must clean history/hash correctly. Logout clears auth
    and returns to landing.

# 15. UI / UX POLISH

-   Preserve the premium dark-green/emerald LifeLoan aesthetic.

-   Standardize typography, cards, borders, radii, spacing, shadows, and
    button states.

-   Fix text touching edges, inconsistent alignment, overflow, awkward
    whitespace, badge wrapping, oversized buttons, inconsistent icon
    sizes, and low-contrast text.

-   Standardize loading, disabled, hover, active, focus, success, error,
    and toast states.

# 16. RESPONSIVE DESIGN

-   Test approximately 320px, 375px, 390px, 768px, 1024px, and 1440px.

-   Audit Dashboard, Loan Application, My Loans, Digital Twin, Recovery
    Planner, AI Chat, Loan Comparison, and EMI Calculator.

-   Fix horizontal overflow, clipped cards, broken grids, and mobile
    modal/layout problems.

# 17. ACCESSIBILITY

-   Add labels to form fields/sliders and aria-labels to icon-only
    buttons.

-   Ensure keyboard navigation, visible focus, semantic controls,
    adequate contrast, and sensible reduced-motion behavior.

# 18. API CONFIGURATION / DEPLOYMENT

-   Do not hardcode http://127.0.0.1:8000 throughout the frontend.

-   Use VITE_API_URL for the backend base URL.

-   Audit CORS for development/production.

-   Keep GEMINI_API_KEY in environment configuration; never commit
    secrets.

-   Document startup commands, environment variables, database setup,
    and deployment steps.

# 19. ERROR / LOADING / EMPTY STATES

-   Every API call gets loading, success, and error handling.

-   Errors should have a recovery action such as Retry or Back.

-   Add empty states for no loans, no history, no assessment, and no
    recovery plan.

-   Never expose raw stack traces/provider errors to normal users.

# 20. CODE CLEANUP

-   Remove unused imports/state, obsolete commented implementations,
    duplicate components, dead routes, and development-only logs.

-   Keep one canonical implementation per feature and avoid unnecessary
    rewrites of stable code.

# 21. BUILD / TESTING

-   Run the frontend production build and fix every TypeScript/build
    error.

-   Start the backend cleanly and verify / and /health.

-   Test register, duplicate register, login, wrong password, logout,
    invalid/expired token, prediction, loans, EMI payment, payment
    history, AI chat, recovery plan, Digital Twin simulation, and loan
    comparison.

-   Test invalid inputs, missing fields, provider outages, ML failures,
    backend failures, and cross-user authorization.

# 22. FULL END-TO-END ACCEPTANCE TEST

-   New user registers.

-   User logs in and sees only their data.

-   User completes and submits a loan application.

-   Real ML model returns assessment and XAI; application/prediction are
    persisted.

-   User asks AI to explain the result.

-   User opens My Loans, views payment history, and pays an EMI; backend
    and UI update.

-   User uses EMI Calculator.

-   User opens Loan Comparison and compares multiple lenders/offers.

-   User generates a Recovery Plan based on current data.

-   User opens Digital Twin, changes a scenario, runs simulation, sees
    current vs simulated financial impact and real ML risk change, then
    asks AI to explain it.

-   User logs out and authenticated data is cleared from the
    authenticated UI.

# 23. PRIORITY ORDER

-   P0: duplicate routes, JWT/auth, authorization, hardcoded user ID,
    database source of truth.

-   P0: Gemini/API reliability and friendly failure states.

-   P0: ₹/\$ consistency, removal of fake data from authenticated flows,
    dead navigation/buttons.

-   P1: Loan Application, My Loans, payment history, EMI Calculator.

-   P1: Recovery Planner and Bank/Loan Comparison.

-   P1: Digital Twin with REAL ML simulation and current-vs-simulated
    risk.

-   P1: AI Advisor full context.

-   P2: responsive UI, accessibility, loading/empty/error states, visual
    consistency, code cleanup, build, testing, deployment docs.

# 24. DO NOT DO THESE

-   Do not replace the trained ML model with fake rules.

-   Do not hardcode financial results or use fake user loans.

-   Do not use user_id=1 as a permanent shortcut.

-   Do not mix ₹ and \$.

-   Do not invent credit scores, probabilities, borrowing capacity, or
    bank rates.

-   Do not let stale localStorage override database data.

-   Do not expose raw Gemini errors.

-   Do not claim AI/ML results are guaranteed.

-   Do not remove existing XAI.

-   Do not create duplicate endpoints/features.

-   Do not show demo numbers as if they belong to a logged-in user.

# 25. FINAL DEFINITION OF DONE

LifeLoan is finished only when ML prediction/XAI, AI Advisor, Recovery
Planner, Digital Twin, Bank/Loan Comparison, Loan Application, My Loans,
EMI Calculator, authentication, database, and UI operate as one coherent
end-to-end product; there are no known dead buttons, contradictory
financial values, mock values in authenticated flows, duplicate routes,
or build errors; and the complete user journey passes.

# QUICK COMMAND FOR ANTIGRAVITY

Audit first → fix backend/auth/data consistency → finish loan flows →
finish Bank/Loan Comparison → make Digital Twin real and ML-connected →
connect AI everywhere → polish responsive UI → remove bugs/dead code →
run full end-to-end tests → only then declare LifeLoan finished.
