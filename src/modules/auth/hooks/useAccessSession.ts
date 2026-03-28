import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccessSession, isBackendUnavailableError } from "@/modules/auth/api/auth.api";
import { getStoredAccessKey, subscribeToAccessKeyChanges } from "@/shared/lib/access-key-storage";

export const authQueryKeys = {
  session: ["auth", "session"] as const,
};

export function useStoredAccessKey() {
  return useSyncExternalStore(subscribeToAccessKeyChanges, getStoredAccessKey, () => null);
}

export function useAccessSession() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: fetchAccessSession,
    enabled: Boolean(accessKey),
    retry: false,
    refetchInterval: (query) => (isBackendUnavailableError(query.state.error) ? 10_000 : false),
    refetchIntervalInBackground: true,
  });
}
