import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

let channelSeq = 0;

/**
 * Returns a counter that increments (debounced) whenever any of the given
 * Postgres tables changes anywhere — the dashboard, the mobile app, or a
 * SQL edit. Pages re-run their loaders on change, which is what makes the
 * site reflect app edits instantly (and vice versa).
 *
 * Delivery respects RLS: catalog tables are public; order/delivery
 * requests are only visible to signed-in admins (see schema policies).
 */
export function useRealtimeVersion(
  tables: readonly string[],
  debounceMs = 350,
): number {
  const [version, setVersion] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = tables.join(",");

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel(`web:realtime:${key}:${channelSeq++}`);
    const handler = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        setVersion((v) => v + 1);
      }, debounceMs);
    };
    for (const table of key.split(",")) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        handler,
      );
    }
    void channel.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void supabase?.removeChannel(channel);
    };
  }, [key, debounceMs]);

  return version;
}

/**
 * Silently re-runs `refresh(true)` whenever any of `tables` changes.
 * Loaders accept a `silent` flag so a realtime refresh never flashes
 * the page's loading state.
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
  }, [version]);
}
