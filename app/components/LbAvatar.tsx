"use client";

import { useState } from "react";
import styles from "./LbAvatar.module.css";

type LbAvatarProps = {
  username: string;
  initials: string;
  me?: boolean;
  imageSrc?: string;
};

export default function LbAvatar({
  username,
  initials,
  me,
  imageSrc,
}: LbAvatarProps) {
  const [failed, setFailed] = useState(false);
  const avClass = me ? `${styles.lbAv} ${styles.lbAvMe}` : styles.lbAv;
  const fallbackClass = me
    ? `${styles.lbAv} ${styles.lbAvMe} ${styles.lbAvMeFallback}`
    : `${styles.lbAv} ${styles.lbAvFallback}`;

  if (failed) {
    return <div className={fallbackClass}>{initials}</div>;
  }

  return (
    <div className={avClass}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc ?? `https://unavatar.io/twitter/${username}`}
        alt={initials}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
