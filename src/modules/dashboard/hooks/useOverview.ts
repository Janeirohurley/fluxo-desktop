import { useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/modules/dashboard/api/overview.api";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const overviewQueryKeys = {
  root: ["overview"] as const,
};

export function useOverview() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: overviewQueryKeys.root,
    queryFn: fetchOverview,
    enabled: Boolean(accessKey),
    retry: 1,
  });
}
