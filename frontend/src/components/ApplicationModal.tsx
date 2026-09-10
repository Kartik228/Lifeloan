import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, ArrowRight, ArrowLeft, FileCheck } from 'lucide-react';
import { LoanItem, FinancialProfile } from '../types';
import { api, formatINR } from '../api';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanSubmitted: (newLoan: LoanItem) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onLoanSubmitted,
}) => {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    employer: '',
    jobTitle: '',
    income: 600000,
    requestedAmount: 500000,
    loanType: 'Personal' as 'Mortgage' | 'Personal' | 'Auto' | 'Business',
    lenderPreference: 'HDFC Bank',
    tenureYears: 5,
  });

  useEffect(() => {
    if (!isOpen) return;

    // Load authenticated user data
    try {
      const storedUser = localStorage.getItem('lifeloan_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          fullName: u.full_name || u.name || prev.fullName,
          email: u.email || prev.email,
        }));
      }
    } catch (e) {
      console.warn('Could not read stored user for ApplicationModal:', e);
    }

    // Load financial profile if available
    api
      .get<FinancialProfile>('/financial-profile')
      .then((profile) => {
        if (profile) {
          setFormData((prev) => ({
            ...prev,
            income: profile.annual_income > 0 ? profile.annual_income : prev.income,
          }));
        }
      })
      .catch(() => {
        // Fallback silently if unauthenticated or error
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const calculatedEmi = Math.round(
      (formData.requestedAmount * 0.105) / 12 +
        formData.requestedAmount / (formData.tenureYears * 12)
    );

    const newLoan: LoanItem = {
      id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${formData.loanType} Facility (${formData.lenderPreference})`,
      lender: formData.lenderPreference,
      type: formData.loanType,
      amount: formData.requestedAmount,
      remainingAmount: formData.requestedAmount,
      interestRate: 10.5,
      emi: calculatedEmi,
      nextDueDate: '2026-10-01',
      status: 'active',
      progressPercentage: 0,
    };

    onLoanSubmitted(newLoan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel p-6 lg:p-8 border border-[#3c4a42] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242c27] pb-4 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981]/20 text-[#4edea3]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#dde4dd]">
                LifeLoan Application
              </h3>
              <p className="text-xs text-[#86948a]">
                Step {step} of 3 • AI Financial Assessment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#86948a] hover:bg-[#1a211d] hover:text-[#dde4dd]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal & Employment */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                  Applicant Profile
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kartik"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. user@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Employer / Business
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Technology Solutions Ltd."
                      value={formData.employer}
                      onChange={(e) =>
                        setFormData({ ...formData, employer: e.target.value })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Gross Annual Income (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.income}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          income: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center space-x-2 rounded-full bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3]"
                  >
                    <span>NEXT: LOAN DETAILS</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Loan Requirements */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                  Loan Specifications
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Loan Category
                    </label>
                    <select
                      value={formData.loanType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          loanType: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value="Personal">Personal Loan</option>
                      <option value="Mortgage">Home Loan</option>
                      <option value="Auto">Vehicle Loan</option>
                      <option value="Business">Business Loan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Requested Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      value={formData.requestedAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requestedAmount: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Preferred Lending Partner
                    </label>
                    <select
                      value={formData.lenderPreference}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lenderPreference: e.target.value,
                        })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option>HDFC Bank</option>
                      <option>State Bank of India</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">
                      Tenure
                    </label>
                    <select
                      value={formData.tenureYears}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tenureYears: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value={1}>1 Year (12 months)</option>
                      <option value={2}>2 Years (24 months)</option>
                      <option value={3}>3 Years (36 months)</option>
                      <option value={5}>5 Years (60 months)</option>
                      <option value={7}>7 Years (84 months)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center space-x-1 text-xs text-[#86948a] hover:text-[#dde4dd]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex items-center space-x-2 rounded-full bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3]"
                  >
                    <span>NEXT: REVIEW & SUBMIT</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                  Application Review
                </div>

                <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Applicant:</span>
                    <span className="font-semibold text-[#dde4dd]">
                      {formData.fullName || 'Valued User'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Requested Amount:</span>
                    <span className="font-mono font-bold text-[#4edea3]">
                      {formatINR(formData.requestedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Loan Type:</span>
                    <span className="text-[#dde4dd]">{formData.loanType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Preferred Bank:</span>
                    <span className="text-[#dde4dd]">
                      {formData.lenderPreference}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#242c27] pt-2">
                    <span className="text-[#86948a]">Annual Income:</span>
                    <span className="font-mono font-semibold text-[#dde4dd]">
                      {formatINR(formData.income)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center space-x-1 text-xs text-[#86948a] hover:text-[#dde4dd]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center space-x-2 rounded-full bg-[#10b981] px-7 py-3 text-sm font-bold text-[#003824] hover:bg-[#4edea3]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>SUBMIT APPLICATION</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#10b981]/20 text-[#4edea3]">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h4 className="font-serif text-2xl font-bold text-[#dde4dd]">
              Application Submitted!
            </h4>
            <p className="text-xs text-[#bbcabf] max-w-md mx-auto">
              Your requested loan of{' '}
              <strong className="text-[#4edea3]">
                {formatINR(formData.requestedAmount)}
              </strong>{' '}
              has been recorded in your active Loan Tracker.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="rounded-full bg-[#10b981] px-8 py-3 text-xs font-bold text-[#003824] hover:bg-[#4edea3]"
              >
                RETURN TO DASHBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
