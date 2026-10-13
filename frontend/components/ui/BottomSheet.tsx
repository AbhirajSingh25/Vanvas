"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import { X } from "lucide-react";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";
import { backdropVariants, sheetVariants } from "@/lib/motion";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string; // e.g. "85vh", "90vh"
  className?: string;
  showCloseButton?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = "85vh",
  className = "",
  showCloseButton = true,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      acquireScrollLock();
    }
    return () => {
      if (isOpen) {
        releaseScrollLock();
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle drag to dismiss
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity cursor-pointer"
            aria-hidden="true"
          />

          {/* Sheet Container */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Bottom Sheet"}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.18}
            onDragEnd={handleDragEnd}
            style={{ maxHeight }}
            className={`relative w-full max-w-2xl mx-auto bg-[#FAF4E8] text-[#20211D] rounded-t-3xl border-t-2 border-[#E5D5BA] shadow-2xl flex flex-col overflow-hidden z-10 pb-[max(1rem,env(safe-area-inset-bottom,0px))] ${className}`}
          >
            {/* Grab Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none">
              <div className="w-12 h-1.5 rounded-full bg-[#E5D5BA] hover:bg-[#B49252] transition-colors" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="px-5 py-3 flex items-center justify-between border-b border-[#E5D5BA]/60 shrink-0">
                <div className="pr-4">
                  {title && (
                    <h3 className="font-serif font-black text-lg text-[#173B32] leading-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-[#7B4D36] font-mono mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-[#EFE5D2] hover:bg-[#E5D5BA] text-[#173B32] transition-colors cursor-pointer shrink-0"
                    aria-label="Close sheet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
