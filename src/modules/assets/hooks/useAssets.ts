import { useQuery } from "@tanstack/react-query";
import { fetchAssetCategories, fetchAssets, fetchAssetStatuses } from "@/modules/assets/api/assets.api";
import { type AssetListParams } from "@/modules/assets/types/assets.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const assetsQueryKeys = {
  list: (params: AssetListParams) => ["assets", "list", params] as const,
  categories: ["assets", "categories"] as const,
  statuses: ["assets", "statuses"] as const,
};

export function useAssets(params: AssetListParams) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.list(params),
    queryFn: () => fetchAssets(params),
    enabled: Boolean(accessKey),
  });
}

export function useAssetCategories() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.categories,
    queryFn: fetchAssetCategories,
    enabled: Boolean(accessKey),
  });
}

export function useAssetStatuses() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.statuses,
    queryFn: fetchAssetStatuses,
    enabled: Boolean(accessKey),
    });
}
