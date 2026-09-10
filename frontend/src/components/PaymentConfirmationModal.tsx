import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CreditCard,
  Building2,
  Lock,
} from 'lucide-react';
import { api, formatINR, formatDateIN } from '../api';
import { BackendLoan, LoanItem } from '../types';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  loan: BackendLoan | LoanItem | null;
  onClose: () => void;
  onPaymentSuccess: (updatedLoan: any) => void;
  onViewHistory?: () => void;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  loan,
  onClose,
  onPaymentSuccess,
  onViewHistory,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    amountPaid: number;
    remainingBalance: number;
    status: string;
  } | null>(null);

  if (!isOpen || !loan) return null;

  // Normalize properties whether loan is BackendLoan or LoanItem
  const loanId = typeof loan.id === 'string' && loan.id.startsWith('LN-') ? loan.id.replace('LN-', '') : String(loan.id);
  const loanTitle = (loan as any).title || 'Loan Facility';
  const loanLender = (loan as any).lender || 'LifeLoan Lending Partner';
  const emiAmount = Number((loan as any).emi || 0);
  const currentRemaining = Number(
    (loan as any).remaining_amount !== undefined
      ? (loan as any).remaining_amount
      : (loan as any).remainingAmount || 0
  );

  const paymentAmount = Math.min(emiAmount > 0 ? emiAmount : currentRemaining, currentRemaining);
  const remainingAfterPayment = Math.max(0, currentRemaining - paymentAmount);
  const todayStr = new Date().toISOString().split('T')[0];

  const handleClose = () => {
    if (isProcessing) return;
    setStep(1);
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  const handleExecutePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.post(`/loans/${loanId}/pay-emi`, {
        amount: paymentAmount,
      });

      const updatedRemaining = response.remaining_amount !== undefined
        ? response.remaining_amount
        : response.remainingAmount !== undefined
        ? response.remainingAmount
        : remainingAfterPayment;

      setSuccessResult({
        amountPaid: paymentAmount,
        remainingBalance: updatedRemaining,
        status: response.status || (updatedRemaining <= 0 ? 'completed' : 'active'),
      });

      setStep(3);
      onPaymentSuccess(response);
    } catch (err: any) {
      console.error('Payment API execution error:', err);
      setError(err.message || 'Payment could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09100c]/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-[#3c4a42] shadow-2xl bg-[#161d19]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#242c27] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#dde4dd]">
                {step === 1
                  ? 'Review EMI Payment'
                  : step === 2
                  ? 'Confirm EMI Recording'
                  : 'Payment Recorded'}
              </h3>
              <p className="text-[11px] text-[#86948a]">
                {step === 1
                  ? 'Step 1 of 2 • Pre-Payment Verification'
                  : step === 2
                  ? 'Step 2 of 2 • Final Confirmation'
                  : 'EMI recorded in LifeLoan • Demo mode'}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-[#86948a] hover:bg-[#242c27] hover:text-[#dde4dd] transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">Payment Failed</p>
              <p className="mt-0.5 text-red-200/80">{error}</p>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 1: REVIEW PAYMENT DETAILS
        ============================================================ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#0e1511] p-5 border border-[#242c27] space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#1f2622]">
                <span className="text-[#86948a]">Loan Facility:</span>
                <span className="font-semibold text-[#dde4dd] text-right">{loanTitle}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1f2622]">
                <span className="text-[#86948a]">Lending Partner:</span>
                <span className="font-semibold text-[#dde4dd]">{loanLender}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1f2622]">
                <span className="text-[#86948a]">Payment Amount (EMI):</span>
                <span className="font-mono text-base font-bold text-[#4edea3]">
                  {formatINR(paymentAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1f2622]">
                <span className="text-[#86948a]">Current Remaining Balance:</span>
                <span className="font-mono font-semibold text-[#dde4dd]">
                  {formatINR(currentRemaining)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#1f2622]">
                <span className="text-[#86948a]">Payment Date:</span>
                <span className="text-[#dde4dd]">{formatDateIN(todayStr)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-[#86948a]">Balance After Payment:</span>
                <span className="font-mono font-bold text-[#4edea3]">
                  {formatINR(remainingAfterPayment)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#10b981]/20 bg-[#10b981]/5 p-3.5 flex items-start gap-2.5 text-[11px] text-[#86948a]">
              <Lock className="h-4 w-4 text-[#4edea3] shrink-0 mt-0.5" />
              <span>
                Clicking <strong>Continue to Confirm</strong> will advance to final confirmation. No payment is recorded until you click <strong>Confirm Recording</strong>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-[#3c4a42] px-5 py-2.5 text-xs font-semibold text-[#9aa9a1] hover:text-[#dde4dd] hover:border-[#4edea3]/40 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20"
              >
                <span>Continue to Confirm</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 2: FINAL CONFIRMATION (API CALL ONLY HERE)
        ============================================================ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Confirm this EMI recording</span>
              </div>
              <p className="text-xs text-[#bbcabf] leading-relaxed">
                You are about to <strong className="text-[#dde4dd]">record</strong> an EMI payment of{' '}
                <strong className="text-[#4edea3] font-mono">{formatINR(paymentAmount)}</strong> toward your{' '}
                <strong className="text-[#dde4dd]">{loanTitle}</strong>.
              </p>
              <div className="rounded-xl bg-[#0e1511] p-3.5 border border-[#242c27] text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Authorized Amount:</span>
                  <span className="font-mono font-bold text-[#4edea3]">{formatINR(paymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">New Remaining Balance:</span>
                  <span className="font-mono font-bold text-[#dde4dd]">{formatINR(remainingAfterPayment)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!isProcessing) setStep(1);
                }}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-xl border border-[#3c4a42] px-5 py-2.5 text-xs font-semibold text-[#9aa9a1] hover:text-[#dde4dd] transition disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-[#10b981] px-6 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Recording Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Confirm Recording</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            STEP 3: SUCCESS STATE
        ============================================================ */}
        {step === 3 && successResult && (
          <div className="text-center py-4 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#10b981]/20 text-[#4edea3]">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h4 className="font-serif text-2xl font-bold text-[#dde4dd]">
                Payment Recorded
              </h4>
              <p className="mt-1 text-xs text-[#86948a]">
                {formatINR(successResult.amountPaid)} EMI payment recorded in LifeLoan.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0e1511] p-5 border border-[#242c27] text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[#86948a]">Amount Recorded:</span>
                <span className="font-mono font-bold text-[#4edea3]">{formatINR(successResult.amountPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86948a]">Loan:</span>
                <span className="font-semibold text-[#dde4dd]">{loanTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86948a]">New Remaining Balance:</span>
                <span className="font-mono font-bold text-[#dde4dd]">
                  {formatINR(successResult.remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86948a]">Payment Date:</span>
                <span className="text-[#dde4dd]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#1f2622]">
                <span className="text-[#86948a]">Loan Status:</span>
                <span className="capitalize font-bold text-[#4edea3]">
                  {successResult.status}
                </span>
              </div>
            </div>

            {/* Demo disclaimer */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2.5 text-[11px] text-amber-300/80">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Demo mode</strong> — no real money was transferred. This action only updated the LifeLoan internal database record.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onViewHistory && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onViewHistory();
                  }}
                  className="rounded-xl border border-[#3c4a42] bg-[#161d19] px-5 py-2.5 text-xs font-semibold text-[#dde4dd] hover:border-[#4edea3]/40 transition"
                >
                  View Payment History
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-[#10b981] px-7 py-2.5 text-xs font-bold text-[#003824] hover:bg-[#4edea3] transition shadow-lg shadow-[#10b981]/20"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
