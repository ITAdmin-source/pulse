/**
 * Design Tokens for Pulse Voting Interface
 *
 * Unified design system for the card-based polling experience.
 * Maintains warm, tactile aesthetic inspired by physical card decks.
 */

// Color Palette - Warm & Neutral Foundation
export const colors = {
  // Background gradients - neutral backdrop with warm card accents
  background: {
    page: "from-stone-100 via-stone-50 to-stone-100", // Neutral gray-beige for maximum card contrast
    card: "from-amber-50 via-orange-50/40 to-amber-50", // Warm gradient makes card "glow" against neutral backdrop
    continuation: "from-amber-50 via-orange-50/40 to-amber-50",
  },

  // Interactive states - voting actions
  voting: {
    keep: {
      bg: "bg-gradient-to-b from-emerald-600 to-emerald-700",
      hover: "shadow-emerald-500/40",
      text: "text-white",
    },
    throw: {
      bg: "bg-gradient-to-b from-red-600 to-red-700",
      hover: "shadow-red-500/40",
      text: "text-white",
    },
    pass: {
      bg: "bg-gray-600",
      text: "text-white",
    },
  },

  // Progress & UI accents
  accent: {
    progress: "bg-amber-500",
    progressMuted: "bg-amber-200",
    border: "border-amber-200",
    celebration: "from-amber-400 to-amber-500",
  },

  // Card deck styling
  card: {
    border: "border-gray-200",
    shadow: "shadow-lg",
    text: "text-gray-800",
    deckLayer: "bg-white",
  },
} as const;

// Spacing System - 8px base unit
export const spacing = {
  xs: "8px",    // 8px
  sm: "16px",   // 16px
  md: "24px",   // 24px
  lg: "32px",   // 32px
  xl: "40px",   // 40px
  "2xl": "48px", // 48px
} as const;

// Typography Scale
export const typography = {
  // Poll question/context
  context: "text-base md:text-lg font-semibold",

  // Statement text (hero)
  statement: "text-lg md:text-xl leading-relaxed font-medium",

  // Button labels
  button: "text-base font-bold",

  // Progress indicators
  progress: "text-xs font-medium",

  // Helper text
  helper: "text-sm text-gray-600",
} as const;

// Elevation System - Shadows
export const elevation = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",

  // Card deck depth effect
  cardStack: {
    layer1: "shadow-md transform translate-y-3 translate-x-2 rotate-2",
    layer2: "shadow-md transform translate-y-2 translate-x-1 rotate-1",
    layer3: "shadow-md transform translate-y-1 translate-x-0.5",
  },
} as const;

// Border Radius
export const radius = {
  card: "rounded-3xl",
  button: "rounded-lg",
  buttonRound: "rounded-full",
  progress: "rounded-full",
  container: "rounded-2xl",
} as const;

// Animation Timings
export const animation = {
  // Keep current exit animations (per vote type)
  exit: {
    keep: { duration: 0.5 },
    throw: { duration: 0.4 },
    pass: { duration: 0.45 },
  },

  // Entrance animations
  entrance: {
    duration: 0.6,
    delay: 0.2,
  },

  // UI interactions
  hover: {
    duration: 0.2,
    scale: 1.05,
  },

  // Results reveal
  results: {
    stagger: 0.1,
    duration: 0.4,
  },
} as const;

// Z-Index Scale
export const zIndex = {
  base: "z-0",
  cardStack: "z-10",
  buttons: "z-20",
  header: "z-50",
} as const;
