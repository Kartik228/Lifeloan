import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  IndianRupee,
  Percent,
  CalendarDays,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface EMICalculatorProps {
  onBack: () => void;
}

const EMICalculator: React.FC<EMICalculatorProps> = ({
  onBack,
}) => {
  const [loanAmount, setLoanAmount] =
    useState("500000");

  const [interestRate, setInterestRate] =
    useState("10");

  const [tenure, setTenure] =
    useState("5");

  const [tenureType, setTenureType] =
    useState<"years" | "months">("years");

  // ============================================================
  // EMI CALCULATION
  // ============================================================

  const calculation = useMemo(() => {
    const principal =
      Number(loanAmount) || 0;

    const annualRate =
      Number(interestRate) || 0;

    const tenureValue =
      Number(tenure) || 0;

    const months =
      tenureType === "years"
        ? tenureValue * 12
        : tenureValue;

    if (
      principal <= 0 ||
      months <= 0
    ) {
      return {
        emi: 0,
        totalInterest: 0,
        totalPayment: 0,
        months: 0,
      };
    }

    const monthlyRate =
      annualRate / 12 / 100;

    let emi = 0;

    // Zero-interest loan
    if (monthlyRate === 0) {
      emi = principal / months;
    } else {
      emi =
        (principal *
          monthlyRate *
          Math.pow(
            1 + monthlyRate,
            months
          )) /
        (Math.pow(
          1 + monthlyRate,
          months
        ) - 1);
    }

    const totalPayment =
      emi * months;

    const totalInterest =
      totalPayment - principal;

    return {
      emi,
      totalInterest,
      totalPayment,
      months,
    };
  }, [
    loanAmount,
    interestRate,
    tenure,
    tenureType,
  ]);

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (
    value: number
  ) => {
    return `₹${Math.round(
      value
    ).toLocaleString("en-IN")}`;
  };

  // ============================================================
  // FORMAT TENURE
  // ============================================================

  const formatMonths = (
    months: number
  ) => {
    if (months <= 0) {
      return "0 months";
    }

    const years =
      Math.floor(months / 12);

    const remainingMonths =
      months % 12;

    if (
      years > 0 &&
      remainingMonths > 0
    ) {
      return `${years} year${
        years !== 1 ? "s" : ""
      } ${remainingMonths} month${
        remainingMonths !== 1
          ? "s"
          : ""
      }`;
    }

    if (years > 0) {
      return `${years} year${
        years !== 1 ? "s" : ""
      }`;
    }

    return `${months} month${
      months !== 1 ? "s" : ""
    }`;
  };

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd]">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-[#242c27]/70 bg-[#0e1511]/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#9aa9a1] transition hover:text-[#4edea3]"
          >

            <ArrowLeft className="h-4 w-4" />

            Back to Dashboard

          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#10b981] to-[#047857]">

              <Calculator className="h-4 w-4 text-[#003824]" />

            </div>

            <span className="font-serif text-xl font-bold">

              Life
              <span className="text-[#4edea3]">
                Loan
              </span>

            </span>

          </div>

          <div className="w-[130px]" />

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ====================================================
            TITLE
        ==================================================== */}

        <section className="mb-10 text-center">

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4edea3]">
            FINANCIAL TOOLS
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight">
            EMI Calculator
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#819087]">

            Estimate your monthly loan payment,
            total interest, and total repayment
            before you borrow.

          </p>

        </section>


        {/* ====================================================
            CALCULATOR GRID
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-5">

          {/* ==================================================
              INPUT PANEL
          ================================================== */}

          <section className="rounded-3xl border border-[#242c27] bg-[#161d19] p-7 lg:col-span-3">

            <div className="mb-7 flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#10b981]/10">

                <Calculator className="h-5 w-5 text-[#4edea3]" />

              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Loan Details
                </h2>

                <p className="mt-1 text-xs text-[#71837a]">
                  Adjust the values to see your EMI instantly.
                </p>

              </div>

            </div>


            <div className="space-y-6">

              {/* ==================================================
                  LOAN AMOUNT
              ================================================== */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-xs font-semibold">
                    Loan Amount
                  </label>

                  <span className="text-xs text-[#4edea3]">
                    ₹
                    {(
                      Number(
                        loanAmount
                      ) || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </span>

                </div>

                <div className="relative">

                  <IndianRupee className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52625a]" />

                  <input
                    type="number"
                    min="0"
                    value={loanAmount}
                    onChange={(e) =>
                      setLoanAmount(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#3c4a42] bg-[#101713] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition focus:border-[#4edea3]"
                    placeholder="500000"
                  />

                </div>

              </div>


              {/* ==================================================
                  INTEREST RATE
              ================================================== */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-xs font-semibold">
                    Annual Interest Rate
                  </label>

                  <span className="text-xs text-[#4edea3]">
                    {interestRate || "0"}%
                  </span>

                </div>

                <div className="relative">

                  <Percent className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52625a]" />

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) =>
                      setInterestRate(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#3c4a42] bg-[#101713] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition focus:border-[#4edea3]"
                    placeholder="10"
                  />

                </div>

              </div>


              {/* ==================================================
                  TENURE
              ================================================== */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-xs font-semibold">
                    Loan Tenure
                  </label>

                  <span className="text-xs text-[#71837a]">
                    {formatMonths(
                      calculation.months
                    )}
                  </span>

                </div>

                <div className="flex gap-3">

                  <div className="relative flex-1">

                    <CalendarDays className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52625a]" />

                    <input
                      type="number"
                      min="1"
                      value={tenure}
                      onChange={(e) =>
                        setTenure(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#3c4a42] bg-[#101713] py-3.5 pl-11 pr-4 text-sm text-[#dde4dd] outline-none transition focus:border-[#4edea3]"
                      placeholder="5"
                    />

                  </div>


                  <div className="flex rounded-xl border border-[#3c4a42] bg-[#101713] p-1">

                    <button
                      type="button"
                      onClick={() =>
                        setTenureType(
                          "years"
                        )
                      }
                      className={`
                        rounded-lg px-4 py-2 text-xs font-semibold transition
                        ${
                          tenureType ===
                          "years"
                            ? "bg-[#10b981] text-[#003824]"
                            : "text-[#71837a] hover:text-[#dde4dd]"
                        }
                      `}
                    >
                      Years
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTenureType(
                          "months"
                        )
                      }
                      className={`
                        rounded-lg px-4 py-2 text-xs font-semibold transition
                        ${
                          tenureType ===
                          "months"
                            ? "bg-[#10b981] text-[#003824]"
                            : "text-[#71837a] hover:text-[#dde4dd]"
                        }
                      `}
                    >
                      Months
                    </button>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                QUICK TENURE
            ================================================== */}

            <div className="mt-7 border-t border-[#242c27] pt-6">

              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#52625a]">
                QUICK TENURE
              </p>

              <div className="flex flex-wrap gap-2">

                {[
                  "1",
                  "2",
                  "3",
                  "5",
                  "7",
                  "10",
                ].map(
                  (year) => (

                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setTenureType(
                          "years"
                        );
                        setTenure(
                          year
                        );
                      }}
                      className={`
                        rounded-lg
                        border
                        px-4
                        py-2
                        text-xs
                        font-semibold
                        transition

                        ${
                          tenureType ===
                            "years" &&
                          tenure ===
                            year
                            ? "border-[#4edea3] bg-[#10b981]/10 text-[#4edea3]"
                            : "border-[#3c4a42] text-[#71837a] hover:border-[#4edea3]/40 hover:text-[#dde4dd]"
                        }
                      `}
                    >
                      {year}Y
                    </button>

                  )
                )}

              </div>

            </div>

          </section>


          {/* ==================================================
              RESULT PANEL
          ================================================== */}

          <section className="rounded-3xl border border-[#242c27] bg-[#161d19] p-7 lg:col-span-2">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/10">

                <TrendingUp className="h-5 w-5 text-[#4edea3]" />

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-[#4edea3]">
                  ESTIMATED PAYMENT
                </p>

                <p className="mt-1 text-xs text-[#71837a]">
                  Based on your inputs
                </p>

              </div>

            </div>


            {/* EMI */}

            <div className="mt-8 rounded-2xl border border-[#4edea3]/20 bg-[#10b981]/5 p-6 text-center">

              <p className="text-xs text-[#71837a]">
                Monthly EMI
              </p>

              <p className="mt-2 text-4xl font-bold text-[#4edea3]">

                {formatCurrency(
                  calculation.emi
                )}

              </p>

              <p className="mt-2 text-[10px] text-[#52625a]">
                per month
              </p>

            </div>


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="mt-5 space-y-3">

              {/* PRINCIPAL */}

              <div className="flex items-center justify-between rounded-xl bg-[#101713] p-4">

                <div className="flex items-center gap-3">

                  <Wallet className="h-4 w-4 text-[#71837a]" />

                  <span className="text-xs text-[#71837a]">
                    Loan Amount
                  </span>

                </div>

                <span className="text-sm font-bold">

                  {formatCurrency(
                    Number(
                      loanAmount
                    ) || 0
                  )}

                </span>

              </div>


              {/* INTEREST */}

              <div className="flex items-center justify-between rounded-xl bg-[#101713] p-4">

                <div className="flex items-center gap-3">

                  <Percent className="h-4 w-4 text-[#71837a]" />

                  <span className="text-xs text-[#71837a]">
                    Total Interest
                  </span>

                </div>

                <span className="text-sm font-bold">

                  {formatCurrency(
                    calculation.totalInterest
                  )}

                </span>

              </div>


              {/* TOTAL */}

              <div className="flex items-center justify-between rounded-xl border border-[#242c27] bg-[#101713] p-4">

                <div className="flex items-center gap-3">

                  <TrendingUp className="h-4 w-4 text-[#71837a]" />

                  <span className="text-xs text-[#71837a]">
                    Total Repayment
                  </span>

                </div>

                <span className="text-sm font-bold text-[#dde4dd]">

                  {formatCurrency(
                    calculation.totalPayment
                  )}

                </span>

              </div>

            </div>


            {/* TENURE */}

            <div className="mt-5 rounded-xl border border-[#242c27] bg-[#101713] p-4">

              <div className="flex items-center justify-between">

                <span className="text-xs text-[#71837a]">
                  Loan Duration
                </span>

                <span className="text-xs font-bold">
                  {formatMonths(
                    calculation.months
                  )}
                </span>

              </div>

            </div>

          </section>

        </div>


        {/* ====================================================
            INFORMATION
        ==================================================== */}

        <section className="mt-8 rounded-2xl border border-[#242c27] bg-[#121914] p-5">

          <div className="flex gap-3">

            <Calculator className="mt-0.5 h-4 w-4 shrink-0 text-[#4edea3]" />

            <div>

              <p className="text-xs font-semibold text-[#9aa9a1]">
                How is EMI calculated?
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[#52625a]">

                LifeLoan uses the standard reducing-balance
                EMI formula based on your loan amount,
                annual interest rate, and loan tenure.
                The result is an estimate and actual
                lender terms may vary.

              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
};

export default EMICalculator;