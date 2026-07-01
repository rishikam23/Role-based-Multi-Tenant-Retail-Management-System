"use client";

import { useRegionCurrency } from "@/app/hooks/use-region-currency";

export function DynamicCurrencyDisplay({ amount }: { amount: number }) {
  const { currencySymbol, loading } = useRegionCurrency();

  if (loading) {
    return <span>...</span>;
  }

  const formattedAmount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return <span>{currencySymbol}{formattedAmount}</span>;
}
