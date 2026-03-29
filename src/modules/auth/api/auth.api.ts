import { AxiosError } from "axios";
import { apiClient } from "@/shared/api/client";
import { type AccessSession, type AccessSessionApiResponse, mapAccessSession } from "@/modules/auth/types/auth.types";
import { i18n } from "@/shared/i18n/config";

export async function fetchAccessSession() {
  const response = await apiClient.get<AccessSessionApiResponse>("/api/access/me");

  if (!response.data.data) {
    return null;
  }

  return mapAccessSession(response.data.data);
}

export async function validateAccessKey(accessKey: string): Promise<AccessSession> {
  const response = await apiClient.get<AccessSessionApiResponse>("/api/access/me", {
    headers: {
      "x-module-key": accessKey,
    },
  });

  if (!response.data.data) {
    throw new Error(i18n.t("auth:errors.missingSession"));
  }

  return mapAccessSession(response.data.data);
}

export function isBackendUnavailableError(error: unknown) {
  return (
    error instanceof AxiosError &&
    !error.response &&
    (error.code === AxiosError.ERR_NETWORK || error.message === "Network Error")
  );
}

export function getAuthErrorMessage(error: unknown) {
  if (isBackendUnavailableError(error)) {
    return i18n.t("auth:backend.unavailable");
  }

  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t("auth:errors.unexpected");
}
