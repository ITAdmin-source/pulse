/**
 * Design Tokens v2 - Pulse UX Redesign
 *
 * New design system based on mockup specification.
 * Replaces card deck metaphor with statement-based UI.
 * Dark purple/pink gradient theme with modern aesthetic.
 *
 * @version 2.0
 * @date 2025-10-15
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea', // Primary purple
      700: '#7e22ce',
      800: '#6b21a8',
      900: '#581c87',
    },
    pink: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777', // Secondary pink
      700: '#be185d',
      800: '#9f1239',
      900: '#831843',
    },
  },

  // Voting Action Colors (Flat, no gradients)
  voting: {
    agree: {
      DEFAULT: '#22c55e', // green-500
      hover: '#16a34a',   // green-600
      active: '#15803d',  // green-700
      light: '#86efac',   // green-300
      text: '#ffffff',
    },
    disagree: {
      DEFAULT: '#ef4444', // red-500
      hover: '#dc2626',   // red-600
      active: '#b91c1c',  // red-700
      light: '#fca5a5',   // red-300
      text: '#ffffff',
    },
    pass: {
      DEFAULT: '#f3f4f6', // gray-100
      hover: '#e5e7eb',   // gray-200
      active: '#d1d5db',  // gray-300
      text: '#374151',    // gray-700
    },
  },

  // Background Gradients
  background: {
    // Page background - dark gradient (now uses CSS variables!)
    page: {
      from: '#0f172a',    // slate-900
      via: '#581c87',     // purple-900
      to: '#0f172a',      // slate-900
      className: 'bg-gradient-page',
    },

    // Card backgrounds
    card: {
      white: '#ffffff',
      gray: '#f9fafb',    // gray-50
    },

    // Poll card header gradient (now uses CSS variables!)
    pollHeader: {
      from: '#9333ea',    // purple-600
      to: '#db2777',      // pink-600
      className: 'bg-gradient-poll-header',
    },

    // Insight card gradient
    insight: {
      from: '#4f46e5',    // indigo-600
      via: '#9333ea',     // purple-600
      to: '#db2777',      // pink-600
      className: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
    },

    // Next batch prompt gradient
    nextBatch: {
      from: '#9333ea',    // purple-600
      to: '#db2777',      // pink-600
      className: 'bg-gradient-to-br from-purple-600 to-pink-600',
    },

    // Completion card gradient
    completion: {
      from: '#22c55e',    // green-500
      to: '#10b981',      // emerald-600
      className: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },

    // Question pill gradient
    question: {
      from: '#2563eb',    // blue-600
      to: '#3b82f6',      // blue-500
      className: 'bg-gradient-to-r from-blue-600 to-blue-500',
    },
  },

  // UI Element Colors
  ui: {
    success: '#16a34a',   // green-600
    warning: '#eab308',   // yellow-500
    error: '#dc2626',     // red-600
    info: '#3b82f6',      // blue-500
  },

  // Text Colors
  text: {
    primary: '#111827',   // gray-900
    secondary: '#4b5563', // gray-600
    muted: '#6b7280',     // gray-500
    inverse: '#ffffff',   // white (on dark backgrounds)
    light: '#f9fafb',     // gray-50 (on very dark backgrounds)
  },

  // Border Colors
  border: {
    light: '#e5e7eb',     // gray-200
    medium: '#d1d5db',    // gray-300
    dark: '#9ca3af',      // gray-400
    purple: '#c084fc',    // purple-400
    pink: '#f9a8d4',      // pink-300
  },

  // Status Colors
  status: {
    active: '#22c55e',    // green-500
    closed: '#ef4444',    // red-500
    draft: '#6b7280',     // gray-500
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: 'var(--font-rubik), ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },

  // Font Sizes (Responsive with Tailwind classes)
  fontSize: {
    // App Title / Hero
    hero: 'text-2xl sm:text-4xl font-bold',

    // Page Headlines
    headline: 'text-xl sm:text-3xl font-bold',

    // Section Titles
    title: 'text-lg sm:text-2xl font-semibold',

    // Poll Question (in pill)
    question: 'text-base sm:text-lg font-medium',

    // Statement Text (main content)
    statement: 'text-lg sm:text-xl font-medium',

    // Voting Buttons
    votingButton: 'text-xl sm:text-2xl font-bold',

    // Regular Buttons
    button: 'text-sm sm:text-base font-semibold',

    // Body Text
    body: 'text-sm sm:text-base',

    // Small Text (helper, labels)
    small: 'text-xs sm:text-sm',

    // Stat Numbers
    statNumber: 'text-3xl sm:text-5xl font-bold',

    // Percentage Labels
    percentage: 'text-4xl sm:text-5xl font-bold',
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// ============================================================================
// SPACING SYSTEM (8px base unit)
// ============================================================================

export const spacing = {
  // Base units (rem values)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px  - BASE UNIT
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px

  // Semantic spacing (in px for reference)
  xs: '8px',        // 2 units
  sm: '12px',       // 3 units
  md: '16px',       // 4 units
  lg: '24px',       // 6 units
  xl: '32px',       // 8 units
  '2xl': '48px',    // 12 units
  '3xl': '64px',    // 16 units
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: '0',
  sm: '0.25rem',      // 4px
  DEFAULT: '0.5rem',  // 8px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px - Cards
  '3xl': '2rem',      // 32px
  full: '9999px',     // Pills/Circles

  // Semantic radius
  card: '1.5rem',     // rounded-2xl (24px)
  button: '0.5rem',   // rounded-lg (8px)
  pill: '1rem',       // rounded-xl (16px)
  input: '0.5rem',    // rounded-lg (8px)
  badge: '9999px',    // rounded-full
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  // Standard shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',

  // Semantic shadows
  card: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // xl
  cardHover: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // 2xl
  button: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // lg
  buttonHover: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', // xl
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const transitions = {
  // Duration
  duration: {
    instant: '75ms',
    fast: '150ms',
    normal: '200ms',
    medium: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  // Timing Functions
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
  },

  // Semantic transitions
  button: 'all 200ms ease-in-out',
  card: 'all 300ms ease-out',
  fade: 'opacity 200ms ease-in-out',
  slide: 'transform 300ms ease-out',
  scale: 'transform 200ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const animations = {
  // Framer Motion variants for common animations

  // Card entrance (from mockup)
  cardEntrance: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Tab switch
  tabSwitch: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.2 },
  },

  // Stats reveal (on voting buttons)
  statsReveal: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },

  // Pulse (for current progress segment)
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Vote button hover
  buttonHover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },

  // Button press
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Poll Card (gradient header)
  pollCard: {
    width: 'w-full',
    aspectRatio: 'auto', // Not fixed like old cards
    radius: radius.card,
    shadow: shadows.card,
    hoverShadow: shadows.cardHover,
    headerGradient: colors.background.pollHeader.className,
    bodyBackground: colors.background.card.white,
    transition: transitions.card,

    // Closed state
    closedOverlay: 'bg-gray-900/10',
    closedBadge: {
      background: 'bg-red-500',
      text: 'text-white',
      size: 'text-xs',
      padding: 'px-2 py-1',
      radius: radius.sm,
    },
  },

  // Split Vote Card
  splitVoteCard: {
    radius: radius.card,
    shadow: shadows['2xl'],

    // Statement header
    statementBackground: 'bg-gray-50',
    statementBorder: 'border-b-4 border-purple-200',
    statementPadding: 'p-6 sm:p-8',
    statementText: typography.fontSize.statement,

    // Voting buttons
    buttonHeight: 'h-64 sm:h-80',
    buttonRadius: '0', // No radius (inside card)
    agreeBackground: colors.voting.agree.DEFAULT,
    disagreeBackground: colors.voting.disagree.DEFAULT,
    passBackground: colors.voting.pass.DEFAULT,
    buttonHoverExpand: 'hover:flex-[1.2]',
    buttonTransition: 'transition-all duration-300',

    // Stats display (on buttons)
    statsText: typography.fontSize.percentage,
    statsAnimation: animations.statsReveal,

    // Action buttons (Pass, Add Position)
    actionHeight: 'h-12',
    actionGap: 'gap-3',
    actionPadding: 'p-4',
  },

  // Progress Segments
  progressSegments: {
    height: 'h-1',
    gap: 'gap-1',
    radius: radius.full,

    // States
    completed: 'bg-purple-500',
    current: 'bg-purple-300 animate-pulse',
    currentWithResults: 'bg-purple-400',
    upcoming: 'bg-white/20',

    transition: 'transition-all duration-300',
  },

  // Progress Bar (legacy name for compatibility)
  progressBar: {
    filled: 'bg-purple-500',
    current: 'bg-purple-300',
    empty: 'bg-white/20',
  },

  // Question Pill
  questionPill: {
    gradient: colors.background.question.className,
    radius: radius.pill,
    padding: 'px-6 py-4',
    shadow: shadows.lg,
    textColor: colors.text.inverse,
    textSize: typography.fontSize.question,
  },

  // Tab Navigation
  tabNavigation: {
    gap: 'gap-2',
    padding: 'p-1',
    background: 'bg-white/10',
    backdropBlur: 'backdrop-blur',
    radius: radius.lg,

    // Tab button
    tabPadding: 'py-3',
    tabRadius: radius.lg,

    // Active state
    activeBackground: 'bg-white',
    activeText: 'text-purple-900',

    // Inactive state
    inactiveBackground: 'bg-white/10',
    inactiveText: 'text-white',

    // Disabled state
    disabledBackground: 'bg-white/5',
    disabledText: 'text-white/40',
    disabledCursor: 'cursor-not-allowed',
  },

  // Insight Card
  insightCard: {
    gradient: colors.background.insight.className,
    radius: radius.card,
    padding: 'p-8',
    shadow: shadows['2xl'],
    textColor: colors.text.inverse,

    // Decorative circles
    circleBackground: 'bg-white/10',
    circleBlur: '', // No blur, solid opacity

    // Profile section
    emojiSize: 'text-6xl',
    profileSize: typography.fontSize.headline,

    // Actions
    buttonBackground: 'bg-white',
    buttonText: 'text-purple-600',
    buttonHover: 'hover:bg-purple-50',
  },

  // Stats Grid
  statsGrid: {
    columns: 'grid-cols-1 sm:grid-cols-3',
    gap: 'gap-4 sm:gap-6',

    // Stat card
    cardBackground: 'bg-white',
    cardBorder: 'border border-gray-200',
    cardRadius: radius.card,
    cardPadding: 'p-6',
    cardShadow: shadows.md,

    // Numbers
    numberSize: typography.fontSize.statNumber,
    numberColor: colors.primary.purple[600],

    // Labels
    labelSize: typography.fontSize.small,
    labelColor: colors.text.secondary,
  },

  // Banners
  banner: {
    padding: 'p-4',
    radius: radius.xl,
    margin: 'mb-6',

    // Closed poll banner
    closedBackground: 'bg-yellow-50',
    closedBorder: 'border border-yellow-200',
    closedText: 'text-yellow-800',
    closedIcon: 'text-yellow-600',

    // Partial participation banner
    partialBackground: 'bg-blue-50',
    partialBorder: 'border border-blue-200',
    partialText: 'text-blue-800',
    partialIcon: 'text-blue-600',

    // Sign up banner
    signupGradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
    signupText: 'text-white',
  },

  // Demographics Modal
  demographicsModal: {
    // Modal styling uses Radix defaults
    accentColor: colors.primary.purple[600],

    // Submit button
    submitBackground: colors.primary.purple[600],
    submitHover: colors.primary.purple[700],

    // Link color
    linkColor: colors.primary.purple[600],
    linkHover: colors.primary.purple[700],
  },
} as const;

// ============================================================================
// BREAKPOINTS (for reference, use Tailwind classes)
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get Tailwind class for background gradient
 */
export function getBackgroundGradient(type: keyof typeof colors.background): string {
  const bg = colors.background[type];
  return 'className' in bg ? bg.className : '';
}

/**
 * Get voting button color
 */
export function getVotingColor(value: -1 | 0 | 1): {
  DEFAULT: string;
  hover: string;
  active: string;
  light?: string;
  text: string;
} {
  switch (value) {
    case 1:
      return colors.voting.agree;
    case -1:
      return colors.voting.disagree;
    case 0:
      return colors.voting.pass;
  }
}

/**
 * Get poll status color
 */
export function getStatusColor(status: 'active' | 'closed' | 'draft'): string {
  return colors.status[status];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  transitions,
  animations,
  components,
  breakpoints,
  zIndex,
} as const;
