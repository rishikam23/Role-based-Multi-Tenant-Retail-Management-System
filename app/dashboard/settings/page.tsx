import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { Building2, Globe, DollarSign } from "lucide-react";
import { OrgSettingsForm } from "./_components/org-settings-form";

const COMMON_CURRENCIES = [
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "INR", label: "Indian Rupee (INR)" },
  { code: "ZMW", label: "Zambian Kwacha (ZMW)" },
  { code: "ZWL", label: "Zimbabwean Dollar (ZWL)" },
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "TZS", label: "Tanzanian Shilling (TZS)" },
  { code: "NGN", label: "Nigerian Naira (NGN)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "AUD", label: "Australian Dollar (AUD)" },
  { code: "CAD", label: "Canadian Dollar (CAD)" },
  { code: "JPY", label: "Japanese Yen (JPY)" },
  { code: "CNY", label: "Chinese Yuan (CNY)" },
];

const COMMON_TIMEZONES = [
  "UTC",
  "Africa/Lusaka",
  "Africa/Harare",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default async function SettingsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organisation to view settings.</p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      companyName: true,
      email: true,
      phone: true,
      timezone: true,
      currencyCode: true,
      currencySymbol: true,
      tenantCode: true,
    },
  });

  if (!tenant) return <p>Organisation not found.</p>;

  const canEdit = isSuper || isMaster;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organisation Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your organisation profile, currency, and timezone. These settings apply globally across all reports and the POS.
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          You have read-only access. Only admins can modify organisation settings.
        </div>
      )}

      <OrgSettingsForm canEdit={canEdit}>
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            <span>Company Information</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-slate-700">Tenant Code <span className="text-slate-400 font-normal">(read-only)</span></label>
              <input disabled value={tenant.tenantCode} className="h-10 rounded-md border border-input bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="companyName" className="text-sm font-medium text-slate-700">Company Name *</label>
              <input id="companyName" name="companyName" defaultValue={tenant.companyName} required disabled={!canEdit}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Contact Email</label>
              <input id="email" name="email" type="email" defaultValue={tenant.email ?? ""} disabled={!canEdit}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</label>
              <input id="phone" name="phone" defaultValue={tenant.phone ?? ""} disabled={!canEdit}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            <span>Localisation</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="timezone" className="text-sm font-medium text-slate-700">Timezone</label>
              <select id="timezone" name="timezone" defaultValue={tenant.timezone} disabled={!canEdit}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed">
                {COMMON_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="currencyCode" className="text-sm font-medium text-slate-700">
                Currency
                <span className="ml-2 text-xs text-slate-400 font-normal">(symbol auto-derived from code)</span>
              </label>
              <select id="currencyCode" name="currencyCode" defaultValue={tenant.currencyCode} disabled={!canEdit}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed">
                {COMMON_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border p-3 flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <div className="text-sm">
              <span className="text-slate-500">Current currency symbol: </span>
              <span className="font-bold text-slate-900">{tenant.currencySymbol}</span>
              <span className="text-slate-400 ml-2">({tenant.currencyCode})</span>
              <span className="ml-3 text-slate-400">· Example: </span>
              <span className="font-medium text-slate-700">
                {tenant.currencySymbol}{new Intl.NumberFormat("en", { minimumFractionDigits: 2 }).format(1234.5)}
              </span>
            </div>
          </div>
        </div>
      </OrgSettingsForm>
    </div>
  );
}