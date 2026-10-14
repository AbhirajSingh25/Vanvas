import { Variants, Transition } from "motion/react";

/**
 * VANVAS Centralized Motion System
 * 
 * Recommended motion ranges per Phase 3 specifications:
 * - Micro feedback: 100-160ms
 * - Small component transition: 160-240ms
 * - Sheet/dialog transition: 220-320ms
 * - Screen transition: 180-280ms
 */

export const MOTION_DURATIONS = {
  micro: 0.14,
  fast: 0.2,
  normal: 0.26,
  sheet: 0.3,
  slow: 0.45,
} as const;

export const MOTION_SPRINGS = {
  snappy: { type: "spring", stiffness: 420, damping: 30 } as Transition,
  gentle: { type: "spring", stiffness: 300, damping: 28 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 22 } as Transition,
  sheet: { type: "spring", stiffness: 320, damping: 32, mass: 0.8 } as Transition,
} as const;

export const MOTION_EASINGS = {
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeInOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
} as const;

// Press feedback for buttons and interactive cards
export const pressFeedback = {
  rest: { scale: 1 },
  tap: { scale: 0.97, transition: { duration: MOTION_DURATIONS.micro } },
};

// Subtle hover feedback (fine-pointer only via media query or CSS)
export const hoverFeedback = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.01, transition: { duration: MOTION_DURATIONS.fast } },
};

// Card Reveal with subtle vertical translation
export const cardRevealVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// Staggered list container
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// Bottom Sheet Entry / Exit
export const sheetVariants: Variants = {
  hidden: { y: "100%", opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: MOTION_SPRINGS.sheet,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.fast, ease: [0.4, 0, 1, 1] },
  },
};

// Backdrop Fade
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: MOTION_DURATIONS.fast } },
  exit: { opacity: 0, transition: { duration: MOTION_DURATIONS.micro } },
};

// Dialog / Center Modal
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: MOTION_DURATIONS.micro },
  },
};

// App Screen / Route Transition
export const routeScreenVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.micro },
  },
};

// Segmented Tab Indicator
export const tabIndicatorTransition: Transition = {
  type: "spring",
  stiffness: 450,
  damping: 34,
};

// Anchored Popover / Dropdown Menu (e.g. Profile, Density)
export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: MOTION_EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
};

// Tab content crossfade and subtle displacement
export const tabContentVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: MOTION_EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14 },
  },
};

// Featured Card 3D Flip (intentional reveals)
export const cardFlipVariants: Variants = {
  front: { rotateY: 0, transition: { duration: MOTION_DURATIONS.normal } },
  back: { rotateY: 180, transition: { duration: MOTION_DURATIONS.normal } },
};
