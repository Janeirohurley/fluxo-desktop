import { apiClient } from "@/shared/api/client";
import {
  type AssetCategoryReference,
  type AssetInterventionTypeReference,
  type AssetStatusReference,
  type CreateAssetCategoryPayload,
  type CreateAssetStatusPayload,
  type CreateInterventionTypePayload,
  type UpdateAssetCategoryPayload,
  type UpdateAssetStatusPayload,
  type UpdateInterventionTypePayload,
} from "@/modules/assets/types/assets.types";
import {
  fetchAssetCategories,
  fetchAssetStatuses,
  fetchInterventionTypes,
} from "@/modules/assets/api/assets.api";

type ReferenceDto = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type SingleReferenceResponse = {
  data: ReferenceDto;
};

function mapReference(dto: ReferenceDto) {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export { fetchAssetCategories, fetchAssetStatuses, fetchInterventionTypes };

export async function createAssetCategory(payload: CreateAssetCategoryPayload): Promise<AssetCategoryReference> {
  const response = await apiClient.post<SingleReferenceResponse>("/api/assets/categories", payload);
  return mapReference(response.data.data);
}

export async function updateAssetCategory(
  id: string,
  payload: UpdateAssetCategoryPayload,
): Promise<AssetCategoryReference> {
  const response = await apiClient.patch<SingleReferenceResponse>(`/api/assets/categories/${id}`, payload);
  return mapReference(response.data.data);
}

export async function deleteAssetCategory(id: string): Promise<void> {
  await apiClient.delete(`/api/assets/categories/${id}`);
}

export async function createAssetStatus(payload: CreateAssetStatusPayload): Promise<AssetStatusReference> {
  const response = await apiClient.post<SingleReferenceResponse>("/api/assets/statuses", payload);
  return mapReference(response.data.data);
}

export async function updateAssetStatus(
  id: string,
  payload: UpdateAssetStatusPayload,
): Promise<AssetStatusReference> {
  const response = await apiClient.patch<SingleReferenceResponse>(`/api/assets/statuses/${id}`, payload);
  return mapReference(response.data.data);
}

export async function deleteAssetStatus(id: string): Promise<void> {
  await apiClient.delete(`/api/assets/statuses/${id}`);
}

export async function createInterventionType(
  payload: CreateInterventionTypePayload,
): Promise<AssetInterventionTypeReference> {
  const response = await apiClient.post<SingleReferenceResponse>("/api/assets/intervention-types", payload);
  return mapReference(response.data.data);
}

export async function updateInterventionType(
  id: string,
  payload: UpdateInterventionTypePayload,
): Promise<AssetInterventionTypeReference> {
  const response = await apiClient.patch<SingleReferenceResponse>(
    `/api/assets/intervention-types/${id}`,
    payload,
  );
  return mapReference(response.data.data);
}

export async function deleteInterventionType(id: string): Promise<void> {
  await apiClient.delete(`/api/assets/intervention-types/${id}`);
}
