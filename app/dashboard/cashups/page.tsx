import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewCashUpModal } from "./_components/new-cashup-modal";
import { DynamicCurrencyDisplay } from "../products/_components/dynamic-currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PiggyBank,
  TrendingUp,
  CalendarRange,
  UserCheck,
  HelpCircle,
  FileCheck,
  Building
} from "lucide-react";

export default async function CashUpsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    redirect("/dashboard");
  }

  const cashups = await prisma.eodCashUp.findMany({
    where: { tenantId },
    include: {
      location: true,
      cashier: true,
    },
    orderBy: { date: "desc" },
  });

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, locationName: true, locationCode: true },
  });

  const locationOptions = locations.map((l) => ({
    id: l.id,
    name: `${l.locationName} (${l.locationCode})`,
  }));

  const totalCounted = cashups.reduce((sum, c) => sum + Number(c.actualClosing), 0);
  const netDiscrepancy = cashups.reduce((sum, c) => sum + Number(c.discrepancy), 0);
  const totalTransactionsCount = cashups.length;

  function formatAmount(amount: number) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 bg-clip-text text-transparent">
            EOD Register Cash Ups
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Reconcile physical drawers, track petty cash, and audit supervisor-verified end-of-day register entries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewCashUpModal locations={locationOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 h-32 w-32 -mr-6 -mt-6 rounded-full bg-emerald-50/50 group-hover:bg-emerald-100/40 transition-colors duration-300" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cash Counted</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                <DynamicCurrencyDisplay amount={totalCounted} />
              </h3>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className={`absolute top-0 right-0 h-32 w-32 -mr-6 -mt-6 rounded-full transition-colors duration-300 ${netDiscrepancy >= 0 ? "bg-indigo-50/50 group-hover:bg-indigo-100/40" : "bg-rose-50/50 group-hover:bg-rose-100/40"
            }`} />
          <div className="relative flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${netDiscrepancy >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"
              }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Discrepancy Balance</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${netDiscrepancy >= 0 ? "text-indigo-600" : "text-rose-600"
                }`}>
                {netDiscrepancy > 0 ? "+" : ""}
                <DynamicCurrencyDisplay amount={netDiscrepancy} />
              </h3>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="absolute top-0 right-0 h-32 w-32 -mr-6 -mt-6 rounded-full bg-amber-50/50 group-hover:bg-amber-100/40 transition-colors duration-300" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registers Closed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {totalTransactionsCount} <span className="text-xs font-medium text-slate-400">submissions</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Historical Cash Up Ledger</h3>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {cashups.length} Records Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Close Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Location</TableHead>
                <TableHead className="font-semibold text-slate-700">Cashier</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Opening Draw</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Petty Cash In/Out</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Expected Closing</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Actual Counted</TableHead>
                <TableHead className="text-right font-semibold text-slate-700">Discrepancy</TableHead>
                <TableHead className="text-center font-semibold text-slate-700">Verification Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                    No EOD registers have been closed yet. Click the "EOD Cash Up" button to finalize your first drawer counts.
                  </TableCell>
                </TableRow>
              ) : (
                cashups.map((c) => {
                  const discrepancyNum = Number(c.discrepancy);

                  return (
                    <TableRow key={`cashup-row-${c.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-900">
                        {new Date(c.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {c.location.locationName}
                        </span>
                      </TableCell>

                      <TableCell className="text-slate-600">
                        {c.cashier.firstName} {c.cashier.lastName}
                      </TableCell>

                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatAmount(Number(c.openingBalance))}
                      </TableCell>

                      <TableCell className="text-right text-slate-600 text-xs">
                        <div className="flex flex-col">
                          <span>+{formatAmount(Number(c.pettyCashIn))} In</span>
                          <span className="text-slate-400">-{formatAmount(Number(c.pettyCashOut))} Out</span>
                          {c.pettyCashNotes && (
                            <span className="text-[10px] text-indigo-600 mt-0.5 truncate max-w-[120px] ml-auto block" title={c.pettyCashNotes}>
                              "{c.pettyCashNotes}"
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium text-slate-800">
                        {formatAmount(Number(c.expectedClosing))}
                      </TableCell>

                      <TableCell className="text-right font-bold text-slate-900">
                        {formatAmount(Number(c.actualClosing))}
                      </TableCell>

                      <TableCell className="text-right">
                        {discrepancyNum === 0 ? (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-600/10">
                            Balanced
                          </span>
                        ) : discrepancyNum > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                            +{formatAmount(discrepancyNum)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/20">
                            {formatAmount(discrepancyNum)}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                            <FileCheck className="w-3.5 h-3.5" />
                            Verified
                          </span>
                          {c.otpCode && (
                            <span className="text-[10px] text-slate-400 tracking-wider">
                              OTP Sign-off: {c.otpCode}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-slate-50/50 border-t flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Dual-layered Cashier log with simulated cellular OTP Supervisor verification.</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Discrepancy logs highlight variance and update financial reports instantly.</span>
          </div>
        </div>
      </div>
    </div>
  );
}