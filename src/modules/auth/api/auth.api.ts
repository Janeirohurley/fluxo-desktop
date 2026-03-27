import { AxiosError } from "axios";
import { apiClient } from "@/shared/api/client";
import { type AccessSession, type AccessSessionApiResponse, mapAccessSession } from "@/modules/auth/types/auth.types";

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
    throw new Error("The API did not return an access session.");
  }

  return mapAccessSession(response.data.data);
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected authentication error occurred.";
}