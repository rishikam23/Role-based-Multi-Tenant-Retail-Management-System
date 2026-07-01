"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegionCurrency } from "@/app/hooks/use-region-currency";
import { getExpectedSales, submitCashUp } from "../actions";
import { 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Coins, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Building2, 
  Info,
  DollarSign
} from "lucide-react";

type Option = { id: number; name: string };

export function NewCashUpForm({ locations, onSuccess }: { locations: Option[], onSuccess: () => void }) {
  const { currencySymbol } = useRegionCurrency();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Location & Date
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Step 2: System expected sales (fetched from DB)
  const [expectedData, setExpectedData] = useState({
    cashSales: 0,
    momoSales: 0,
    cardSales: 0,
    refunds: 0,
  });

  // Step 3: Counted & Petty Cash inputs
  const [openingBalance, setOpeningBalance] = useState("0");
  const [actualClosing, setActualClosing] = useState("0");
  const [pettyCashIn, setPettyCashIn] = useState("0");
  const [pettyCashOut, setPettyCashOut] = useState("0");
  const [pettyCashNotes, setPettyCashNotes] = useState("");
  const [notes, setNotes] = useState("");

  // Step 4: OTP Verification
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Computed expected closing balance & variance
  const numOpeningBalance = parseFloat(openingBalance || "0");
  const numActualClosing = parseFloat(actualClosing || "0");
  const numPettyCashIn = parseFloat(pettyCashIn || "0");
  const numPettyCashOut = parseFloat(pettyCashOut || "0");
  
  const expectedClosing = 
    numOpeningBalance + 
    expectedData.cashSales + 
    numPettyCashIn - 
    numPettyCashOut - 
    expectedData.refunds;

  const variance = numActualClosing - expectedClosing;

  // Format currency helper
  function formatAmount(amount: number) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Handle loading expected sales
  async function handleLoadExpectedSales() {
    if (!locationId) {
      setError("Please select a store location first.");
      return;
    }
    if (!date) {
      setError("Please select a valid date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getExpectedSales(parseInt(locationId), date);
      if ("error" in result) {
        setError(result.error || "Failed to load expected sales.");
      } else {
        setExpectedData({
          cashSales: result.cashSales || 0,
          momoSales: result.momoSales || 0,
          cardSales: result.cardSales || 0,
          refunds: result.refunds || 0,
        });
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // Trigger simulated OTP
  function triggerOtpSend() {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setError("");
  }

  // Form submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enteredOtp !== generatedOtp) {
      setError("Incorrect Supervisor OTP code. Please enter the correct authorization code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("locationId", locationId);
      formData.append("date", date);
      formData.append("openingBalance", openingBalance);
      formData.append("pettyCashIn", pettyCashIn);
      formData.append("pettyCashOut", pettyCashOut);
      formData.append("pettyCashNotes", pettyCashNotes);
      formData.append("actualClosing", actualClosing);
      formData.append("notes", notes);
      formData.append("otpCode", enteredOtp);

      const result = await submitCashUp(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Step Indicator */}
      <div className="mb-6 flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={`step-indicator-${s}`} className="flex items-center flex-1 last:flex-none">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              step === s 
                ? "bg-indigo-600 text-white ring-4 ring-indigo-100" 
                : step > s 
                  ? "bg-emerald-600 text-white" 
                  : "bg-slate-100 text-slate-400"
            }`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                step > s ? "bg-emerald-600" : "bg-slate-100"
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT LOCATION & DATE */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-indigo-900 text-xs">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
            <div>
              <p className="font-semibold mb-0.5">End of Day Cash Up assistant</p>
              <p className="text-indigo-700">Select a branch and business date. The system will compile all invoices logged in real-time to compute the register cash expectation.</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationSelect" className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" /> Store / Branch Location
            </Label>
            <select
              id="locationSelect"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-none hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              <option value="">-- Select Register Store --</option>
              {locations.map((loc) => (
                <option key={`loc-opt-${loc.id}`} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateSelect" className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" /> Closeout Business Date
            </Label>
            <Input
              id="dateSelect"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="hover:border-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleLoadExpectedSales}
              disabled={loading || !locationId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2"
            >
              {loading ? "Loading Invoices..." : "Load expected Sales"} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: SHOW EXPECTED SALES METRICS */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-slate-500" /> Compiled System Invoice Sales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-slate-100 rounded-lg flex flex-col">
                <span className="text-xs text-slate-500">Cash Sales (Expected)</span>
                <span className="text-lg font-bold text-emerald-600 mt-1">
                  {currencySymbol}{formatAmount(expectedData.cashSales)}
                </span>
              </div>
              
              <div className="p-3 bg-white border border-slate-100 rounded-lg flex flex-col">
                <span className="text-xs text-slate-500">Mobile Money Sales</span>
                <span className="text-lg font-bold text-indigo-600 mt-1">
                  {currencySymbol}{formatAmount(expectedData.momoSales)}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-lg flex flex-col">
                <span className="text-xs text-slate-500">Cards / Other Payments</span>
                <span className="text-lg font-bold text-blue-600 mt-1">
                  {currencySymbol}{formatAmount(expectedData.cardSales)}
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-lg flex flex-col">
                <span className="text-xs text-slate-500">Approved Cash Refunds</span>
                <span className="text-lg font-bold text-rose-600 mt-1">
                  {currencySymbol}{formatAmount(expectedData.refunds)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Note: Only payment logged as "Cash" (minus Cash Refunds) impacts physical register drawer expected totals.
            </p>
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Change Store / Date
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2"
            >
              Proceed to counts <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PHYSICAL COUNTS AND PETTY CASH */}
      {step === 3 && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="openingBalance" className="text-xs font-semibold text-slate-700">
                Opening Cash Balance ({currencySymbol})
              </Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-1.5">
              <Label htmlFor="actualClosing" className="text-xs font-semibold text-slate-700">
                Physical Cash counted ({currencySymbol})
              </Label>
              <Input
                id="actualClosing"
                type="number"
                step="0.01"
                min="0"
                value={actualClosing}
                onChange={(e) => setActualClosing(e.target.value)}
                required
                className="font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Petty Cash Sub-form */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Petty Cash Reconciliation</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="pettyCashIn" className="text-xs text-slate-600">
                  Petty Cash IN (+)
                </Label>
                <Input
                  id="pettyCashIn"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pettyCashIn}
                  onChange={(e) => setPettyCashIn(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="pettyCashOut" className="text-xs text-slate-600">
                  Petty Cash OUT (-)
                </Label>
                <Input
                  id="pettyCashOut"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pettyCashOut}
                  onChange={(e) => setPettyCashOut(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="pettyCashNotes" className="text-xs text-slate-600">
                Petty Cash details / Reason
              </Label>
              <Input
                id="pettyCashNotes"
                placeholder="e.g. Purchased fuel, office supplies or stationery..."
                value={pettyCashNotes}
                onChange={(e) => setPettyCashNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
              General Cash Up Remarks / Notes
            </Label>
            <Input
              id="notes"
              placeholder="Any comments regarding discrepancies or receipts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* LIVE DISCREPANCY COMPARISON */}
          <div className="pt-2 border-t">
            <div className="p-4 bg-indigo-950 text-white rounded-xl space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs text-indigo-200">
                <span>Opening Cash Balance:</span>
                <span>{currencySymbol}{formatAmount(numOpeningBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-indigo-200">
                <span>System Cash Sales (Confirmed):</span>
                <span>+{currencySymbol}{formatAmount(expectedData.cashSales)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-indigo-200">
                <span>Net Petty Cash (In - Out):</span>
                <span>{(numPettyCashIn - numPettyCashOut) >= 0 ? "+" : ""}{currencySymbol}{formatAmount(numPettyCashIn - numPettyCashOut)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-indigo-200">
                <span>Cash Refunds Processed:</span>
                <span>-{currencySymbol}{formatAmount(expectedData.refunds)}</span>
              </div>

              <div className="h-px bg-indigo-800" />

              <div className="flex justify-between items-center font-semibold text-sm">
                <span>Expected Closing Cash:</span>
                <span>{currencySymbol}{formatAmount(expectedClosing)}</span>
              </div>
              <div className="flex justify-between items-center font-semibold text-sm">
                <span>Physical Closing Cash Counted:</span>
                <span className="text-yellow-400 text-base">{currencySymbol}{formatAmount(numActualClosing)}</span>
              </div>

              <div className="pt-1.5 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Variance:</span>
                {variance === 0 ? (
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 font-bold text-slate-300">
                    BALANCED
                  </span>
                ) : variance > 0 ? (
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-900 border border-emerald-700 font-bold text-emerald-300">
                    SURPLUS (+{currencySymbol}{formatAmount(variance)})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs bg-rose-900 border border-rose-700 font-bold text-rose-300">
                    DEFICIT ({currencySymbol}{formatAmount(variance)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> System expected
            </Button>
            <Button
              onClick={() => setStep(4)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2"
            >
              Verify & Sign-off <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SUPERVISOR SIGN-OFF & OTP */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 space-y-2">
            <div className="flex gap-2 text-xs font-bold items-center">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Supervisor Authorization Required</span>
            </div>
            <p className="text-xs text-amber-800">
              Submitting registers with discrepancies or closing EOD requires supervisor verification. Click "Request OTP" to dispatch a secure passcode to the branch manager's dashboard.
            </p>
          </div>

          {!otpSent ? (
            <div className="p-6 bg-slate-50 border rounded-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Trigger Manager OTP Code</p>
                <p className="text-xs text-slate-500 mt-0.5">Clicking below simulates a secure cellular dispatch of an OTP.</p>
              </div>
              <Button
                type="button"
                onClick={triggerOtpSend}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Send OTP to Supervisor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mock SMS Overlay Toast */}
              <div className="p-3 bg-indigo-900 text-white border border-indigo-950 rounded-xl flex items-start gap-2.5 shadow-lg animate-bounce">
                <span className="text-base">🔔</span>
                <div className="text-xs">
                  <span className="font-bold text-indigo-300 block mb-0.5">SMS Dispatch simulation</span>
                  <span className="text-slate-100">
                    Supervisor OTP Code dispatched to Manager: <strong className="text-yellow-300 text-sm tracking-wider font-extrabold">{generatedOtp}</strong>
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5 pt-2">
                <Label htmlFor="otpCode" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  Enter supervisor Authorization Code
                </Label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="Enter 4-digit code e.g. 7492"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  maxLength={4}
                  required
                  className="text-center font-extrabold text-lg tracking-widest focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* SUMMARY OF VARIANCE */}
          <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Reconciliation Variance:</span>
            {variance === 0 ? (
              <span className="font-bold text-slate-700">Perfect Balance</span>
            ) : variance > 0 ? (
              <span className="font-bold text-emerald-600">+{currencySymbol}{formatAmount(variance)} Surplus</span>
            ) : (
              <span className="font-bold text-rose-600">{currencySymbol}{formatAmount(variance)} Deficit</span>
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setStep(3)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Recount cash
            </Button>
            <Button
              type="submit"
              disabled={loading || !otpSent || enteredOtp.length !== 4}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2"
            >
              {loading ? "Filing ledger..." : "Confirm & Submit EOD"} <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
