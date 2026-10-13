"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { acquireScrollLock, releaseScrollLock } from "@/lib/scrollLock";
import { backdropVariants, dialogVariants } from "@/lib/motion";
import { BottomSheet } from "./BottomSheet";

interface VanvasAdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string; // desktop max width e.g. "max-w-xl", "max-w-2xl"
  className?: string;
}

export const VanvasAdaptiveModal: React.FC<VanvasAdaptiveModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  className = "",
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // For desktop dialog: manage scroll lock and escape key
  useEffect(() => {
    if (!isOpen || isMobile) return;
    acquireScrollLock();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMobile, onClose]);

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        className={className}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-[#0F2924]/60 backdrop-blur-sm z-0"
          />

          {/* Centered Modal Dialog */}
          <motion.div
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative z-10 w-full ${maxWidth} bg-[#FAF4E8] border-2 border-[#E5D5BA] rounded-3xl shadow-2xl overflow-hidden my-8 ${className}`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="px-6 py-4.5 bg-[#EFE5D2] border-b border-[#E5D5BA] flex items-center justify-between">
                <div>
                  {title && (
                    <h3 className="font-serif font-black text-xl text-[#173B32]">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-[#7B4D36] font-mono mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#FAF4E8] hover:bg-[#E5D5BA] text-[#173B32] border border-[#E5D5BA] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto text-[#20211D]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
