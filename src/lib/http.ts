import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

function safeGetStorage(key: string): string {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function makeRid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizePath(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return "/" + url.replace(/^\/+/, "");
}

function isBiblePassagePost(method: string, urlPath: string): boolean {
  if (method.toUpperCase() !== "POST") return false;
  return /\/v2\/bible\/passage\/?$/i.test(urlPath);
}

export const http: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const method = String(cfg.method || "GET").toUpperCase();
  const urlPath = normalizePath(String(cfg.url || ""));
  cfg.url = urlPath;

  

  // Helper that works with AxiosHeaders or plain objects
  const setHeader = (k: string, v: string): void => {
    const h = cfg.headers as unknown as { set?: (a: string, b: string) => void } & Record<string, unknown>;
    if (typeof h.set === "function") {
      h.set(k, v);
      return;
    }
    (cfg.headers as unknown as Record<string, string>)[k] = v;
  };

  setHeader("X-Request-Id", makeRid());

  const apiKey = String(import.meta.env.VITE_API_KEY || "").trim();
  if (apiKey) setHeader("X-API-Key", apiKey);

  const bearer = safeGetStorage("auth_token");
  const second = safeGetStorage("second_token");
  const postCode = String(import.meta.env.VITE_POST_AUTH_CODE || "").trim();

  if (isBiblePassagePost(method, urlPath)) {
    if (postCode) setHeader("Authorization", `Bearer ${postCode}`);
    if (bearer) setHeader("X-User-Token", bearer);
  } else {
    if (bearer) setHeader("Authorization", `Bearer ${bearer}`);
  }

  if (second) setHeader("X-Second-Token", second);

  return cfg;
});