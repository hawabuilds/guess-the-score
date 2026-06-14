import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Guess the Score",
  description:
    "Legal disclaimer for Guess the Score — skill-based prediction game.",
};

export default function DisclaimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
