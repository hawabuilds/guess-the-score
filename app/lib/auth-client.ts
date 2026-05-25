"use client";

import { signIn, signOut } from "next-auth/react";

const HAS_SIGNED_IN_KEY = "gts-has-signed-in-x";

export function markHasSignedInWithX() {
  if (typeof window !== "undefined") {
    localStorage.setItem(HAS_SIGNED_IN_KEY, "1");
  }
}

export function hasSignedInWithXBefore(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(HAS_SIGNED_IN_KEY) === "1";
}

export function signInWithX() {
  return signIn("twitter", { callbackUrl: "/" });
}

export async function signInWithXAfterSwitch() {
  await signOut({ redirect: false });
  return signIn("twitter", { callbackUrl: "/" });
}

export function signOutOfX() {
  return signOut({ callbackUrl: "/" });
}

export function openXAccountSwitch() {
  window.open("https://x.com/account/switch", "_blank", "noopener,noreferrer");
}

export function formatHandle(name: string | null | undefined): string {
  if (!name) return "@jordanlee";
  return name.startsWith("@") ? name : `@${name}`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "JL";
  const cleaned = name.replace(/^@/, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "JL";
}

export function twitterUsername(name: string | null | undefined): string {
  if (!name) return "jordanlee";
  return name.replace(/^@/, "").trim() || "jordanlee";
}

export function sessionUserIdentity(
  status: "authenticated" | "loading" | "unauthenticated",
  name?: string | null,
  image?: string | null,
) {
  const signedIn = status === "authenticated";
  return {
    handle: signedIn ? formatHandle(name) : "@jordanlee",
    initials: signedIn ? getInitials(name) : "JL",
    username: signedIn ? twitterUsername(name) : "jordanlee",
    image: signedIn && image ? image : undefined,
    signedIn,
  };
}
