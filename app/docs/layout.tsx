import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs | Guess the Score",
  description:
    "Project documentation for Guess the Score — how to play, daily rewards, $SCORE token, and the rewards contract.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
