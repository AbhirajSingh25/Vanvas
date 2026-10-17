"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { resolveAvatarUrl } from "@/lib/api";
import { getAvatarPresetById } from "@/lib/avatarPresets";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export interface AvatarProps {
  user?: {
    full_name?: string;
    avatar_url?: string | null;
    avatar_type?: string | null;
    avatar_preset?: string | null;
  } | null;
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  showBorder?: boolean;
  borderColor?: string;
  onClick?: () => void;
}

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string; px: number }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]", px: 24 },
  sm: { container: "w-8 h-8", text: "text-xs", px: 32 },
  md: { container: "w-10 h-10", text: "text-sm", px: 40 },
  lg: { container: "w-14 h-14", text: "text-base", px: 56 },
  xl: { container: "w-20 h-20", text: "text-xl", px: 80 },
  "2xl": { container: "w-28 h-28", text: "text-3xl", px: 112 },
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  src,
  name,
  size = "md",
  className = "",
  showBorder = true,
  borderColor = "border-[#C59B47]/60",
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayName = name || user?.full_name || "Traveler";

  // Compute initials
  const initials = useMemo(() => {
    if (!displayName) return "V";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return displayName.charAt(0).toUpperCase();
  }, [displayName]);

  // Compute effective image URL with strict priority:
  // 1. Explicit prop src
  // 2. Uploaded avatar_url (if avatar_type === 'uploaded' or valid uploaded url exists)
  // 3. Illustrated preset (if avatar_type === 'preset' or no uploaded avatar exists)
  const effectiveSrc = useMemo(() => {
    // 1. Explicit src passed as prop
    if (src) {
      if (src.startsWith("/avatars/")) return src;
      return resolveAvatarUrl(src);
    }

    if (!user) return null;

    const isExplicitUploaded = user.avatar_type === "uploaded";
    const hasUploadedUrl = Boolean(
      user.avatar_url &&
      !user.avatar_url.startsWith("/avatars/presets/") &&
      !user.avatar_url.startsWith("/avatars/")
    );

    // Prefer uploaded avatar photo
    if (isExplicitUploaded && user.avatar_url) {
      return resolveAvatarUrl(user.avatar_url);
    }

    if (hasUploadedUrl && user.avatar_type !== "preset") {
      return resolveAvatarUrl(user.avatar_url);
    }

    // Preset illustrated avatar
    if (user.avatar_preset) {
      const preset = getAvatarPresetById(user.avatar_preset);
      if (preset?.src) return preset.src;
    }

    // Fallback to avatar_url
    if (user.avatar_url) {
      if (user.avatar_url.startsWith("/avatars/")) return user.avatar_url;
      return resolveAvatarUrl(user.avatar_url);
    }

    return null;
  }, [src, user]);

  const imgRef = useRef<HTMLImageElement>(null);

  // Transition from previous image to next image smoothly without flashing initials
  useEffect(() => {
    setImgError(false);
    if (!effectiveSrc) {
      setDisplayedSrc(null);
      setIsLoading(false);
      return;
    }

    // If effectively the same src, keep it
    if (effectiveSrc === displayedSrc) {
      return;
    }

    // Preload image to ensure seamless transition
    setIsLoading(true);
    const probe = new Image();
    probe.src = effectiveSrc;
    probe.onload = () => {
      setDisplayedSrc(effectiveSrc);
      setIsLoading(false);
      setImgError(false);
    };
    probe.onerror = () => {
      if (!displayedSrc) {
        setImgError(true);
      }
      setIsLoading(false);
    };

    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, [effectiveSrc]);

  const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const isSmall = size === "xs" || size === "sm";
  const activeImage = displayedSrc || effectiveSrc;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none bg-[#173B32] text-[#FAF4E8] font-serif font-bold transition-all ${
        sizeCfg.container
      } ${sizeCfg.text} ${showBorder ? `border ${borderColor}` : ""} ${
        onClick ? "cursor-pointer hover:opacity-90 active:scale-95" : ""
      } ${className}`}
      title={displayName}
    >
      {/* Fallback initials displayed only if no image or genuine failure */}
      {(!activeImage || imgError) && (
        <span className="tracking-tight drop-shadow-xs">{initials}</span>
      )}

      {activeImage && !imgError && (
        <>
          {isLoading && !displayedSrc && (
            <div className="absolute inset-0 bg-[#173B32] opacity-75 animate-pulse pointer-events-none" />
          )}
          <img
            ref={imgRef}
            src={activeImage}
            alt={displayName}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
              isLoading && !displayedSrc ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => {
              setIsLoading(false);
              setImgError(false);
            }}
            onError={() => {
              setImgError(true);
              setIsLoading(false);
            }}
            loading={isSmall ? "eager" : "lazy"}
            decoding="async"
          />
        </>
      )}
    </div>
  );
};

export default Avatar;
