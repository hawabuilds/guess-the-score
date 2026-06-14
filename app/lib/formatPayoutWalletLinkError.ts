const GENERIC_PAYOUT_LINK_ERRORS = [
  /^Failed to link payout wallet/i,
  /^Failed to link wallet$/i,
  /^Invalid response from server$/i,
];

export function isGenericPayoutLinkError(message: string | null | undefined) {
  if (!message) return true;
  return GENERIC_PAYOUT_LINK_ERRORS.some((pattern) => pattern.test(message));
}

export function formatPayoutWalletLinkError(
  linkError: string | null,
  fallback: string,
): string {
  if (isGenericPayoutLinkError(linkError)) return fallback;
  return linkError!;
}
