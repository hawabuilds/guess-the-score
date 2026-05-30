import { sanitizeWalletMessage } from "@/app/lib/isWalletConnect";
import { UserRejectedRequestError } from "viem";

export function formatClaimError(err: unknown): string {
  if (err instanceof UserRejectedRequestError) {
    return "Transaction cancelled in your wallet";
  }

  const raw = err instanceof Error ? err.message : String(err);
  const message = sanitizeWalletMessage(raw);

  if (/walletconnect|qr code|relay|session/i.test(raw)) {
    return "WalletConnect did not finish — confirm on your phone, then return to this browser tab and try Claim again. For fewer steps, use MetaMask in the same browser (not QR).";
  }
  if (/insufficient funds/i.test(message)) {
    return "Not enough tBNB for gas — add a small amount on BSC Testnet to your wallet";
  }

  if (/wallet client/i.test(message) || /connector/i.test(message)) {
    return "Wallet not ready — open MetaMask and connect on the Wallet tab first";
  }

  if (/switch/i.test(message) && /chain|network/i.test(message)) {
    return "Switch your wallet to BSC Testnet, then try Claim again";
  }

  if (/voucher used/i.test(message) || /already claimed/i.test(message)) {
    return "This day's reward was already claimed — check the wallet you used when you claimed before (Claim history). Switching MetaMask does not pay the same day again.";
  }

  if (/does not match your linked payout wallet/i.test(message)) {
    return message;
  }

  if (/execution reverted/i.test(message) || /revert/i.test(message)) {
    return "Claim rejected by contract — check you are on BSC Testnet and using your linked wallet";
  }

  if (message.length > 220) {
    return `${message.slice(0, 220)}…`;
  }
  return message || "Claim failed — try again from the Wallet tab using MetaMask in this browser";
}
