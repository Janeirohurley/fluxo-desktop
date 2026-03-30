import { useQuery } from "@tanstack/react-query";
import {
  fetchAssetById,
  fetchAssetCategories,
  fetchAssets,
  fetchAssetStatuses,
  fetchEmployeeOptions,
  fetchInterventionTypes,
  fetchLocationOptions,
} from "@/modules/assets/api/assets.api";
import { type AssetListParams } from "@/modules/assets/types/assets.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

export const assetsQueryKeys = {
  list: (params: AssetListParams) => ["assets", "list", params] as const,
  detail: (assetId: string) => ["assets", "detail", assetId] as const,
  categories: ["assets", "categories"] as const,
  statuses: ["assets", "statuses"] as const,
  interventionTypes: ["assets", "intervention-types"] as const,
  employeeOptions: ["assets", "employee-options"] as const,
  locationOptions: ["assets", "location-options"] as const,
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

export function useAssetDetail(assetId: string) {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.detail(assetId),
    queryFn: () => fetchAssetById(assetId),
    enabled: Boolean(accessKey && assetId),
  });
}

export function useInterventionTypes() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.interventionTypes,
    queryFn: fetchInterventionTypes,
    enabled: Boolean(accessKey),
  });
}

export function useEmployeeOptions() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.employeeOptions,
    queryFn: fetchEmployeeOptions,
    enabled: Boolean(accessKey),
  });
}

export function useLocationOptions() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.locationOptions,
    queryFn: fetchLocationOptions,
    enabled: Boolean(accessKey),
  });
}
