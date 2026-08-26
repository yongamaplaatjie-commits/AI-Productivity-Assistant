import { useEffect, useState } from "react";

const KEY = "jita_visitor_id";

export function readVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function resetVisitorId(): string {
  if (typeof window === "undefined") return "";
  const id = crypto.randomUUID();
  window.localStorage.setItem(KEY, id);
  return id;
}

/** Returns the visitor's anonymous id, or "" until hydration completes. */
export function useVisitorId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    setId(readVisitorId());
  }, []);
  return id;
}
