import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAssetCategory,
  createAssetStatus,
  createInterventionType,
  deleteAssetCategory,
  deleteAssetStatus,
  deleteInterventionType,
  fetchAssetCategories,
  fetchAssetStatuses,
  fetchInterventionTypes,
  updateAssetCategory,
  updateAssetStatus,
  updateInterventionType,
} from "@/modules/assets/api/assets-references.api";
import { assetsQueryKeys } from "@/modules/assets/hooks/useAssets";
import {
  type CreateAssetCategoryPayload,
  type CreateAssetStatusPayload,
  type CreateInterventionTypePayload,
  type UpdateAssetCategoryPayload,
  type UpdateAssetStatusPayload,
  type UpdateInterventionTypePayload,
} from "@/modules/assets/types/assets.types";
import { useStoredAccessKey } from "@/modules/auth/hooks/useAccessSession";

function useAssetReferenceInvalidation() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["assets"] });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: assetsQueryKeys.categories }),
      queryClient.invalidateQueries({ queryKey: assetsQueryKeys.statuses }),
      queryClient.invalidateQueries({ queryKey: assetsQueryKeys.interventionTypes }),
    ]);
  };
}

export function useAssetCategoriesReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.categories,
    queryFn: fetchAssetCategories,
    enabled: Boolean(accessKey),
  });
}

export function useAssetStatusesReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.statuses,
    queryFn: fetchAssetStatuses,
    enabled: Boolean(accessKey),
  });
}

export function useAssetInterventionTypesReference() {
  const accessKey = useStoredAccessKey();

  return useQuery({
    queryKey: assetsQueryKeys.interventionTypes,
    queryFn: fetchInterventionTypes,
    enabled: Boolean(accessKey),
  });
}

export function useCreateAssetCategory() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (payload: CreateAssetCategoryPayload) => createAssetCategory(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAssetCategory() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssetCategoryPayload }) =>
      updateAssetCategory(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteAssetCategory() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deleteAssetCategory(id),
    onSuccess: invalidate,
  });
}

export function useCreateAssetStatus() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (payload: CreateAssetStatusPayload) => createAssetStatus(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAssetStatus() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssetStatusPayload }) =>
      updateAssetStatus(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteAssetStatus() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deleteAssetStatus(id),
    onSuccess: invalidate,
  });
}

export function useCreateInterventionType() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (payload: CreateInterventionTypePayload) => createInterventionType(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateInterventionType() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInterventionTypePayload }) =>
      updateInterventionType(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteInterventionType() {
  const invalidate = useAssetReferenceInvalidation();

  return useMutation({
    mutationFn: (id: string) => deleteInterventionType(id),
    onSuccess: invalidate,
  });
}
