const LOCAL_APP_LOCK_STORAGE_KEY = "fluxo_local_app_lock";
const LOCAL_APP_LOCK_EVENT = "fluxo-local-app-lock-change";

type StoredLocalAppLock = {
  passwordHash: string;
  createdAt: string;
};

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string) {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

export function getStoredLocalAppLock() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_APP_LOCK_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredLocalAppLock;
  } catch {
    return null;
  }
}

export function hasStoredLocalAppLock() {
  return Boolean(getStoredLocalAppLock());
}

export async function saveLocalAppLock(password: string) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredLocalAppLock = {
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LOCAL_APP_LOCK_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(LOCAL_APP_LOCK_EVENT));
}

export async function verifyLocalAppLock(password: string) {
  const stored = getStoredLocalAppLock();
  if (!stored) {
    return false;
  }

  const passwordHash = await hashPassword(password);
  return stored.passwordHash === passwordHash;
}

export function clearLocalAppLock() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_APP_LOCK_STORAGE_KEY);
  window.dispatchEvent(new Event(LOCAL_APP_LOCK_EVENT));
}

export function subscribeToLocalAppLockChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === LOCAL_APP_LOCK_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(LOCAL_APP_LOCK_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(LOCAL_APP_LOCK_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}
