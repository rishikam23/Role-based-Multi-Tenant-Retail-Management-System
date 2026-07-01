"use client";

import { useState, useEffect } from "react";

export function useRegionCurrency() {
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/settings")
      .then((res) => res.json())
      .then((data) => {
        setCurrencyCode(data.currencyCode || "USD");
        setCurrencySymbol(data.currencySymbol || "$");
        setLoading(false);
      })
      .catch(() => {
        setCurrencyCode("USD");
        setCurrencySymbol("$");
        setLoading(false);
      });
  }, []);

  return { currencySymbol, currencyCode, loading };
}
