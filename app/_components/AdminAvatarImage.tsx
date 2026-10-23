"use client";

import { useState } from "react";

/**
 * Fixed admin photo, served from `public/adminpic/srizonFbPic.jpg`.
 * Used in the user ↔ admin chat (dashboard chat card, floating chat header
 * and admin message bubbles). If the file is missing, a plain letter is shown.
 */
export const ADMIN_AVATAR_SRC = "/adminpic/srizonFbPic.jpg";

export default function AdminAvatarImage({
  className = "h-full w-full object-cover",
  alt = "",
  fallbackLetter = "A",
}: {
  className?: string;
  alt?: string;
  fallbackLetter?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-[#FEE9E9] text-sm font-bold uppercase text-[#DC2626]">
        {fallbackLetter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ADMIN_AVATAR_SRC}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
