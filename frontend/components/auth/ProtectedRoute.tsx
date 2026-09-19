"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Compass, Sparkles } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo,
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const destination = redirectTo || `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(destination);
    }
  }, [user, isLoading, router, pathname, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#FAF4E8] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-3 border-[#173B32]/20 border-t-[#B65E3C] animate-spin" />
          <Compass className="w-7 h-7 text-[#173B32] animate-pulse" />
        </div>
        <div className="font-serif text-lg font-bold text-[#173B32]">
          Verifying Travel Credentials
        </div>
        <div className="font-devanagari text-xs text-[#B49252] mt-1">
          यात्री सत्यापन हो रहा है...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
