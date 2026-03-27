const ACCESS_KEY_STORAGE_EVENT = "fluxo-access-key-change";
export const ACCESS_KEY_STORAGE_KEY = "fluxo_access_key";

function emitAccessKeyChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(ACCESS_KEY_STORAGE_EVENT));
}

export function getStoredAccessKey() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(ACCESS_KEY_STORAGE_KEY);
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function setStoredAccessKey(accessKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_KEY_STORAGE_KEY, accessKey.trim());
  emitAccessKeyChange();
}

export function clearStoredAccessKey() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_KEY_STORAGE_KEY);
  emitAccessKeyChange();
}

export function subscribeToAccessKeyChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => listener();
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === ACCESS_KEY_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(ACCESS_KEY_STORAGE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(ACCESS_KEY_STORAGE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}