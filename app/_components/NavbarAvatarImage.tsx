"use client";

import { useEffect, useState } from "react";

/**
 * Shows the same profile photo the navbar shows: `profileImageUrl` of the cached
 * `user` in localStorage, with the same `?v=updatedAt` cache-buster.
 * It is read after mount (never during SSR) so server and client HTML always match.
 * If there is no photo, or it fails to load, a plain letter is shown instead of a broken image.
 */
function readNavbarAvatarSrc(): string | null {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored) as { profileImageUrl?: string; updatedAt?: string };
    if (!user?.profileImageUrl) return null;
    const url = user.profileImageUrl;
    return user.updatedAt
      ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(user.updatedAt)}`
      : url;
  } catch {
    return null;
  }
}

export default function NavbarAvatarImage({
  className = "h-full w-full object-cover",
  alt = "",
  fallbackLetter = "A",
}: {
  className?: string;
  alt?: string;
  fallbackLetter?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(readNavbarAvatarSrc());
    setFailed(false);
    // the navbar's photo can change (profile page upload) — pick it up when storage changes
    const onStorage = (event: StorageEvent) => {
      if (event.key === "user" || event.key === null) {
        setSrc(readNavbarAvatarSrc());
        setFailed(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!src || failed) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-[#FEE9E9] text-sm font-bold uppercase text-[#DC2626]">
        {fallbackLetter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
