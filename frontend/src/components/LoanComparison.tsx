import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Sparkles,
  Sliders,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Info,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { api, formatINR } from '../api';
import { LenderOffer } from '../types';

interface LoanComparisonProps {
  onBack: () => void;
  onApplyLoan?: () => void;
}

type SortOption = 'rate' | 'emi' | 'repayment' | 'fee';

export const LoanComparison: React.FC<LoanComparisonProps> = ({
  onBack,
  onApplyLoan,
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [tenureYears, setTenureYears] = useState<number>(5);
  const [loanType, setLoanType] = useState<string>('personal');
  const [sortBy, setSortBy] = useState<SortOption>('rate');

  const [offers, setOffers] = useState<LenderOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH LENDER OFFERS
  // =====================================================
  useEffect(() => {
    let active = true;

    async function fetchOffers() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.get<{ offers: LenderOffer[] }>(
          `/loan-comparison/offers?loan_amount=${loanAmount}&tenure_years=${tenureYears}&loan_type=${loanType}`
        );
        if (active) {
          setOffers(data.offers || []);
        }
      } catch (err: any) {
        console.warn('API fetch offers fallback to local computation:', err);
        // High quality fallback computation
        if (active) {
          computeLocalOffers();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const timer = setTimeout(fetchOffers, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loanAmount, tenureYears, loanType]);

  const computeLocalOffers = () => {
    const lenders = [
      {
        id: 'sbi-bank',
        bank: 'State Bank of India',
        symbol: 'SBI',
        rate: loanType === 'home' ? 8.4 : loanType === 'vehicle' ? 8.65 : 11.15,
        feePct: 0.5,
        minFee: 1000,
        maxFee: 5000,
        minScore: 680,
        highlights: ['Lowest processing fees in India', 'Sovereign public sector trust', 'No prepayment penalty'],
        partner: true,
      },
      {
        id: 'hdfc-bank',
        bank: 'HDFC Bank',
        symbol: 'HDFC',
        rate: loanType === 'home' ? 8.5 : loanType === 'vehicle' ? 8.75 : 10.5,
        feePct: 1.0,
        minFee: 1500,
        maxFee: 10000,
        minScore: 720,
        highlights: ['Instant 10-second digital disbursal', 'Zero foreclosure fee after 12 EMIs', 'Preferred corporate rates'],
        partner: true,
      },
      {
        id: 'icici-bank',
        bank: 'ICICI Bank',
        symbol: 'ICICI',
        rate: loanType === 'home' ? 8.75 : loanType === 'vehicle' ? 8.9 : 10.75,
        feePct: 1.25,
        minFee: 2000,
        maxFee: 12000,
        minScore: 700,
        highlights: ['Pre-approved limits for salary accounts', 'Flexible step-up EMI structure', '100% paperless KYC'],
        partner: true,
      },
      {
        id: 'axis-bank',
        bank: 'Axis Bank',
        symbol: 'AXIS',
        rate: loanType === 'home' ? 8.7 : loanType === 'vehicle' ? 9.1 : 10.99,
        feePct: 1.5,
        minFee: 2500,
        maxFee: 12000,
        minScore: 700,
        highlights: ['Reward points on monthly EMI payments', 'Doorstep document assistance', 'Part-prepayment allowed'],
        partner: false,
      },
      {
        id: 'kotak-bank',
        bank: 'Kotak Mahindra Bank',
        symbol: 'KOTAK',
        rate: loanType === 'home' ? 8.7 : loanType === 'vehicle' ? 8.85 : 10.9,
        feePct: 1.0,
        minFee: 1500,
        maxFee: 10000,
        minScore: 710,
        highlights: ['Special balance transfer interest rates', 'Dedicated relationship manager', 'Quick 24-hr turnaround'],
        partner: false,
      },
      {
        id: 'bajaj-finserv',
        bank: 'Bajaj Finserv',
        symbol: 'BAJAJ',
        rate: loanType === 'home' ? 9.0 : loanType === 'vehicle' ? 9.25 : 11.5,
        feePct: 2.0,
        minFee: 2500,
        maxFee: 15000,
        minScore: 680,
        highlights: ['Flexi-Hybrid overdraft limit option', 'Withdraw & repay anytime', 'Pay interest only on drawn funds'],
        partner: false,
      },
    ];

    const months = tenureYears * 12;
    const computed: LenderOffer[] = lenders.map((l) => {
      const r = l.rate / 100 / 12;
      const emi = (loanAmount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      const totalRepayment = emi * months;
      const fee = Math.max(l.minFee, Math.min(l.maxFee, (loanAmount * l.feePct) / 100));

      return {
        lender_id: l.id,
        bank_name: l.bank,
        logo_symbol: l.symbol,
        loan_type: loanType.toUpperCase(),
        interest_rate: l.rate,
        monthly_emi: Math.round(emi),
        total_interest: Math.round(totalRepayment - loanAmount),
        total_repayment: Math.round(totalRepayment),
        processing_fee: Math.round(fee),
        processing_fee_percent: l.feePct,
        tenure_years: tenureYears,
        loan_amount: loanAmount,
        min_credit_score: l.minScore,
        highlights: l.highlights,
        is_partner: l.partner,
        data_source: 'INDICATIVE_DEMO',
      };
    });

    setOffers(computed);
  };

  // =====================================================
  // SORTED OFFERS
  // =====================================================
  const sortedOffers = useMemo(() => {
    const list = [...offers];
    if (sortBy === 'rate') {
      list.sort((a, b) => a.interest_rate - b.interest_rate);
    } else if (sortBy === 'emi') {
      list.sort((a, b) => a.monthly_emi - b.monthly_emi);
    } else if (sortBy === 'repayment') {
      list.sort((a, b) => a.total_repayment - b.total_repayment);
    } else if (sortBy === 'fee') {
      list.sort((a, b) => a.processing_fee - b.processing_fee);
    }
    return list;
  }, [offers, sortBy]);

  return (
    <div className="min-h-screen bg-[#0e1511] text-[#dde4dd] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242c27] pb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#242c27] bg-[#161d19] text-[#9aa9a1] hover:text-[#4edea3] hover:border-[#4edea3]/30 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 items-center gap-1.5 rounded-full border border-[#4edea3]/30 bg-[#10b981]/10 px-3 text-[11px] font-bold text-[#4edea3]">
                  <Building2 className="h-3 w-3" />
                  INDICATIVE MULTI-BANK MARKETPLACE
                </span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight mt-1 text-[#dde4dd]">
                Bank & Lender Comparison
              </h1>
              <p className="text-xs text-[#71837a] mt-0.5">
                Compare indicative rates, EMIs, processing fees, and perks across leading Indian institutional lenders.
              </p>
            </div>
          </div>

          {onApplyLoan && (
            <button
              type="button"
              onClick={onApplyLoan}
              className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-2.5 text-xs font-bold text-[#003824] transition hover:bg-[#4edea3] shadow-lg shadow-[#10b981]/20"
            >
              Apply on LifeLoan
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* =====================================================
            CONTROLS: AMOUNT, TENURE, TYPE, SORT
        ===================================================== */}
        <div className="rounded-3xl border border-[#242c27] bg-[#161d19] p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Loan Amount */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#9aa9a1]">Loan Amount</span>
                <span className="font-mono font-bold text-[#4edea3]">
                  {formatINR(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min={50000}
                max={5000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-[#10b981] bg-[#101713] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#52625a] mt-1">
                <span>₹50K</span>
                <span>₹25L</span>
                <span>₹50L</span>
              </div>
            </div>

            {/* 2. Tenure */}
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#9aa9a1]">Tenure</span>
                <span className="font-mono font-bold text-[#4edea3]">
                  {tenureYears} Years ({tenureYears * 12} Months)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-[#10b981] bg-[#101713] h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#52625a] mt-1">
                <span>1 Year</span>
                <span>10 Years</span>
                <span>20 Years</span>
              </div>
            </div>

            {/* 3. Loan Type & Sort */}
            <div className="flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs text-[#9aa9a1] block mb-1.5">Loan Facility</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {['personal', 'home', 'vehicle', 'business'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLoanType(type)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                        loanType === type
                          ? 'bg-[#10b981] text-[#003824]'
                          : 'border border-[#242c27] bg-[#101713] text-[#71837a] hover:border-[#4edea3]/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9aa9a1]">Sort By</span>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown className="h-3.5 w-3.5 text-[#4edea3]" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="rounded-lg border border-[#242c27] bg-[#101713] px-2.5 py-1 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value="rate">Lowest Interest Rate</option>
                      <option value="emi">Lowest Monthly EMI</option>
                      <option value="repayment">Lowest Total Repayment</option>
                      <option value="fee">Lowest Processing Fee</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            OFFERS GRID
        ===================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOffers.map((offer, index) => {
            const isTopPick = index === 0;

            return (
              <div
                key={offer.lender_id}
                className={`relative rounded-3xl border p-6 flex flex-col justify-between transition hover:-translate-y-1 hover:shadow-2xl duration-200 ${
                  isTopPick
                    ? 'border-[#4edea3]/60 bg-gradient-to-b from-[#13231a] to-[#161d19] shadow-emerald-950/30'
                    : 'border-[#242c27] bg-[#161d19]'
                }`}
              >
                {/* TOP PICK BADGE */}
                {isTopPick && (
                  <div className="absolute -top-3 left-6 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#10b981] to-[#4edea3] px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003824] shadow-md">
                    <Sparkles className="h-3 w-3" />
                    Best Match for Selected Criteria
                  </div>
                )}

                <div>
                  {/* LENDER HEADER */}
                  <div className="flex items-start justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101713] border border-[#242c27] font-mono text-sm font-bold text-[#4edea3]">
                        {offer.logo_symbol}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#dde4dd]">
                          {offer.bank_name}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71837a]">
                          {offer.loan_type} LOAN
                        </span>
                      </div>
                    </div>

                    <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      INDICATIVE / DEMO
                    </span>
                  </div>

                  {/* RATE & EMI STRIP */}
                  <div className="mt-6 grid grid-cols-2 gap-3 border-y border-[#242c27] py-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                        Interest Rate
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[#4edea3]">
                        {offer.interest_rate.toFixed(2)}%
                        <span className="text-[11px] font-normal text-[#71837a] ml-1">p.a.</span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#71837a]">
                        Monthly EMI
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[#dde4dd]">
                        {formatINR(offer.monthly_emi)}
                      </p>
                    </div>
                  </div>

                  {/* DETAILS LIST */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-[#9aa9a1]">
                      <span>Total Interest</span>
                      <span className="font-mono text-[#dde4dd]">
                        {formatINR(offer.total_interest)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#9aa9a1]">
                      <span>Total Repayment</span>
                      <span className="font-mono font-semibold text-[#dde4dd]">
                        {formatINR(offer.total_repayment)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#9aa9a1]">
                      <span>Processing Fee</span>
                      <span className="font-mono text-[#dde4dd]">
                        {formatINR(offer.processing_fee)} ({offer.processing_fee_percent}%)
                      </span>
                    </div>

                    <div className="flex justify-between text-[#9aa9a1]">
                      <span>Min Credit Score</span>
                      <span className="font-mono font-bold text-[#4edea3]">
                        {offer.min_credit_score}+
                      </span>
                    </div>
                  </div>

                  {/* HIGHLIGHT PERKS */}
                  <div className="mt-5 space-y-2 border-t border-[#242c27] pt-4">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#71837a]">
                      Key Highlights
                    </p>
                    {offer.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#9aa9a1]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#4edea3] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA BUTTON */}
                <div className="mt-6 pt-4 border-t border-[#242c27]">
                  <button
                    type="button"
                    onClick={onApplyLoan || onBack}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                      isTopPick
                        ? 'bg-[#10b981] text-[#003824] hover:bg-[#4edea3]'
                        : 'border border-[#4edea3]/30 bg-[#101713] text-[#4edea3] hover:bg-[#10b981]/10'
                    }`}
                  >
                    Check Eligibility on LifeLoan
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* =====================================================
            LEGAL DISCLAIMER (REQUIRED BY MASTER SPEC)
        ===================================================== */}
        <div className="rounded-2xl border border-[#242c27] bg-[#101713] p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[#71837a] mb-2">
            <Info className="h-4 w-4 text-[#4edea3]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Marketplace Indicative Data Notice
            </span>
          </div>
          <p className="text-xs leading-6 text-[#59675f] max-w-3xl mx-auto">
            Rates, fees, eligibility criteria, and perks displayed above are indicative demo benchmarks curated for comparison
            purposes. Final credit terms, interest rates, processing fees, and disbursements will be established solely by the
            respective lending institution based upon their underwriting policy and individual credit evaluation. LifeLoan does
            not guarantee approval or rate commitments by third-party banks.
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoanComparison;
