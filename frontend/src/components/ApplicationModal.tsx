import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, ArrowRight, ArrowLeft, Building2, User, FileCheck } from 'lucide-react';
import { LoanItem } from '../types';

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
    fullName: 'Alexander Vance',
    email: 'a.vance@apexcapital.io',
    phone: '+1 (555) 234-5678',
    employer: 'Quantum Dynamics Inc.',
    jobTitle: 'Principal Systems Architect',
    income: 185000,
    requestedAmount: 500000,
    loanType: 'Mortgage' as 'Mortgage' | 'Personal' | 'Auto' | 'Business',
    lenderPreference: 'Apex Horizon Capital',
    tenureYears: 15,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const calculatedEmi = Math.round(
      (formData.requestedAmount * 0.058) / 12 + (formData.requestedAmount / (formData.tenureYears * 12))
    );

    const newLoan: LoanItem = {
      id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `${formData.loanType} Facility (${formData.lenderPreference})`,
      lender: formData.lenderPreference,
      type: formData.loanType,
      amount: formData.requestedAmount,
      remainingAmount: formData.requestedAmount,
      interestRate: 5.8,
      emi: calculatedEmi,
      nextDueDate: '2026-09-01',
      status: 'active',
      progressPercentage: 5,
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
              <h3 className="font-serif text-xl font-bold text-[#dde4dd]">Digital Loan Application</h3>
              <p className="text-xs text-[#86948a]">Step {step} of 3 • Automated AI Underwriting</p>
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
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Employer / Institution</label>
                    <input
                      type="text"
                      value={formData.employer}
                      onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Gross Annual Compensation ($)</label>
                    <input
                      type="number"
                      value={formData.income}
                      onChange={(e) => setFormData({ ...formData, income: Number(e.target.value) })}
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
                    <span>NEXT: LOAN FACILITY</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Loan Requirements */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                  Facility Specifications
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Facility Category</label>
                    <select
                      value={formData.loanType}
                      onChange={(e) => setFormData({ ...formData, loanType: e.target.value as any })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value="Mortgage">Mortgage / Real Estate</option>
                      <option value="Business">Business Capital Line</option>
                      <option value="Auto">Auto / EV Acquisition</option>
                      <option value="Personal">Personal / Bridge Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Requested Capital ($)</label>
                    <input
                      type="number"
                      value={formData.requestedAmount}
                      onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs font-mono text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Preferred Lending Partner</label>
                    <select
                      value={formData.lenderPreference}
                      onChange={(e) => setFormData({ ...formData, lenderPreference: e.target.value })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option>Apex Horizon Capital</option>
                      <option>Global Private Bank</option>
                      <option>Silicon Credit Union</option>
                      <option>Vanguard Institutional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#bbcabf] mb-1">Desired Tenure</label>
                    <select
                      value={formData.tenureYears}
                      onChange={(e) => setFormData({ ...formData, tenureYears: Number(e.target.value) })}
                      className="w-full rounded-xl bg-[#0e1511] border border-[#242c27] px-3.5 py-2.5 text-xs text-[#dde4dd] focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value={5}>5 Years</option>
                      <option value={10}>10 Years</option>
                      <option value={15}>15 Years</option>
                      <option value={30}>30 Years</option>
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

            {/* Step 3: Review & Terms */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#4edea3] uppercase tracking-wider">
                  Underwriting Terms & Confirmation
                </div>

                <div className="rounded-xl bg-[#0e1511] p-4 border border-[#242c27] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Applicant:</span>
                    <span className="font-semibold text-[#dde4dd]">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Requested Amount:</span>
                    <span className="font-mono font-bold text-[#4edea3]">${formData.requestedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Facility Type:</span>
                    <span className="text-[#dde4dd]">{formData.loanType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86948a]">Lender:</span>
                    <span className="text-[#dde4dd]">{formData.lenderPreference}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#242c27] pt-2">
                    <span className="text-[#86948a]">Estimated Rate:</span>
                    <span className="font-mono font-semibold text-[#4edea3]">5.8% APR (Pre-approved)</span>
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
                    <span>SUBMIT FOR INSTANT PRE-APPROVAL</span>
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
              Application Approved!
            </h4>
            <p className="text-xs text-[#bbcabf] max-w-md mx-auto">
              Your requested facility of <strong className="text-[#4edea3]">${formData.requestedAmount.toLocaleString()}</strong> has been pre-approved and added to your active Loan Tracker dashboard.
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
