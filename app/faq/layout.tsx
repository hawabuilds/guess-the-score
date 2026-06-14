import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Guess the Score",
  description:
    "Search frequently asked questions about Guess the Score — how to play, points, payouts, and $SCORE.",
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
