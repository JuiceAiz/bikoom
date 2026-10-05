import { useEffect, useRef, useState } from "react";

import type { Banner, Category, Product } from "../../../shared/types";
import { requireSupabase } from "./supabase";

/** All storefront tables — bump the caller's data when any changes. */
export const CATALOG_TABLES = ["products", "categories", "banners"] as const;

/**
 * Returns a counter that increments (debounced) whenever any of the given
 * tables changes anywhere — the website, this app, or a SQL edit. Pair it
 * with a load function to get instant two-way sync.
 */
export function useRealtimeVersion(
  tables: readonly string[],
  debounceMs = 350,
): number {
  const [version, setVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tablesKey = tables.join(",");

  useEffect(() => {
    const supabase = requireSupabase();
    const channel = supabase.channel(`realtime:${tablesKey}`);

    const handler = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        setVersion((v) => v + 1);
      }, debounceMs);
    };

    for (const table of tablesKey.split(",")) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        handler,
      );
    }

    void channel.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [tablesKey, debounceMs]);

  return version;
}

/**
 * Silently re-runs `refresh` whenever any of `tables` changes in the
 * database. `refresh` is kept in a ref so screens don't need to
 * memoise it, and callers should keep their loading state untouched
 * on realtime-triggered refreshes (pass silent=true to the loader).
 */
export function useRealtimeRefresh(
  tables: readonly string[],
  refresh: (silent: boolean) => void,
): void {
  const version = useRealtimeVersion(tables);
  const saved = useRef(refresh);
  saved.current = refresh;

  useEffect(() => {
    if (version > 0) saved.current(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
}
