"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useAskVanvas } from "@/context/AskVanvasContext";

interface FloatingCopilotTriggerProps {
  onClick?: () => void;
  isOpen?: boolean;
}

export const FloatingCopilotTrigger: React.FC<FloatingCopilotTriggerProps> = ({
  onClick,
  isOpen: propIsOpen,
}) => {
  const pathname = usePathname();
  const { isOpen: contextIsOpen, openAskVanvas } = useAskVanvas();
  const isModalOpen = propIsOpen !== undefined ? propIsOpen : contextIsOpen;
  const shouldReduceMotion = useReducedMotion();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect virtual keyboard on mobile devices to prevent obstructing active input fields
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const ih = window.innerHeight;
      // If visual viewport shrunk significantly, virtual keyboard is active
      setIsKeyboardOpen(ih - vh > 150);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // Suppress floating trigger on clean auth screens and /plan wizard (which has inline contextual action)
  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/join";
  const isPlanRoute = pathname.startsWith("/plan");

  const isVisible = !isModalOpen && !isKeyboardOpen && !isAuthRoute && !isPlanRoute;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      openAskVanvas();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="floating-ask-vanvas"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, y: 12 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[var(--vanvas-ask-vanvas-bottom,calc(4.25rem+env(safe-area-inset-bottom,0px)))] right-3.5 xl:bottom-6 xl:right-6 z-40 pointer-events-auto"
        >
          <motion.button
            type="button"
            onClick={handleClick}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.03 }}
            aria-label="Ask VANVAS Travel Assistant"
            id="floating-ask-vanvas-btn"
            data-testid="floating-ask-vanvas"
            className="group flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-[#173B32] text-[#FAF7F0] border border-[#B49252]/70 shadow-lg hover:shadow-xl hover:bg-[#20453B] transition-all cursor-pointer select-none active:outline-none focus-visible:ring-2 focus-visible:ring-[#B49252]"
          >
            <Sparkles className="w-4 h-4 text-[#B49252] group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-serif font-bold text-xs sm:text-sm tracking-wide text-[#FAF7F0]">
              Ask VANVAS
            </span>
            <span className="font-devanagari text-[10px] text-[#B49252] font-normal pl-0.5">
              पूछें
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
