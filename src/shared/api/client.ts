import axios from "axios";
import { appEnv } from "@/shared/config/env";
import { getStoredAccessKey } from "@/shared/lib/access-key-storage";

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessKey = getStoredAccessKey();

  if (accessKey) {
    config.headers.set("x-module-key", accessKey);
  }

  return config;
});