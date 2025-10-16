/**
 * Hebrew Strings for Pulse UX Redesign
 *
 * All user-facing text in Hebrew with approved terminology.
 * Uses gender-neutral forms (plural imperative) where possible.
 * Conjugated forms for voting buttons (מסכים/ה, לא מסכים/ה).
 *
 * @version 2.0
 * @date 2025-10-15
 */

// ============================================================================
// POLLS LIST PAGE
// ============================================================================

export const pollsList = {
  // Hero Section
  appTitle: 'דיוני דעת',
  heroHeadline: 'בחרו נושא והשפיעו עליו',
  heroSubheading: 'שתפו את נקודת המבט שלכם בנושאים חשובים',

  // Filters
  filterActive: 'פעילים',
  filterClosed: 'סגורים',
  filterAll: 'הכל',
  searchPlaceholder: 'חפשו דיונים...',
  sortByLabel: 'מיון לפי',

  // Sort Options
  sortRecent: 'הכי חדשים',
  sortPopular: 'הכי פופולריים',
  sortEnding: 'מסתיימים בקרוב',

  // Empty State
  emptyStateTitle: 'לא נמצאו דיונים',
  emptyStateSearchHint: 'נסו לשנות את החיפוש או הסינון',
  emptyStateFilterHint: 'נסו לשנות את הסינון או חזרו מאוחר יותר',

  // Header Actions
  signUpButton: 'הרשמה',
  createPollCta: 'צרו דיון',
  createPollButton: 'צרו דיון חדש',
} as const;

// ============================================================================
// POLL CARD COMPONENT
// ============================================================================

export const pollCard = {
  // Call-to-Action Buttons
  ctaVoteNow: 'להשפיע עכשיו',
  ctaViewResults: 'צפו בתוצאות',
  ctaContinue: 'המשיכו',

  // Badges & Status
  statusClosed: 'סגור',
  closedBadge: 'סגור',
  draftBadge: 'טיוטה',
  activeBadge: 'פעיל',

  // Stats Labels
  participants: 'משתתפים',
  voters: 'מצביעים',
  positions: 'עמדות',
  votes: 'הצבעות',

  // Helper Functions
  participantCount: (count: number) => `${count} משתתפים`,
  positionCount: (count: number) => `${count} עמדות`,
  voteCount: (count: number) => `${count} הצבעות`,
} as const;

// ============================================================================
// POLL PAGE - NAVIGATION & TABS
// ============================================================================

export const pollPage = {
  // Header Navigation
  backButton: 'חזרה לכל הדיונים',
  signUpButton: 'הרשמה',

  // Tab Names
  tabVote: 'הצבעה',
  tabResults: 'תוצאות',

  // Tab States
  tabResultsLocked: (current: number, total: number) => `תוצאות (${current}/${total})`,
  tabResultsUnlocked: 'תוצאות',

  // Loading States
  loading: 'טוען...',
  pollNotFound: 'דיון לא נמצא',
  pollNotActive: 'דיון זה אינו פעיל כרגע',
  loadError: 'שגיאה בטעינת הדיון',
  backToPolls: 'חזרה לדיונים',

  // Results Locked Banner
  resultsLockedTitle: 'התוצאות כמעט זמינות',
  resultsLockedMessage: 'הצביעו על {remaining} עמדות נוספות כדי לפתוח את התוצאות',
  votesLabel: 'הצבעות',
  continueVotingButton: 'המשיכו להצביע',
  resultsLockedToast: 'הצביעו על 10 עמדות לפחות כדי לראות תוצאות',

  // Demographics Banner
  demographicsBannerTitle: 'עוד צעד אחד!',
  demographicsBannerMessage: 'לפני צפייה בתוצאות, ספרו לנו מעט על עצמכם',
  demographicsBannerButton: 'שתפו מידע דמוגרפי',

  // Results View
  resultsTitle: 'התוצאות שלכם',
  resultsPlaceholder: 'כאן יוצגו התוצאות והתובנות האישיות שלכם',

  // Error States
  userCreateError: 'שגיאה ביצירת משתמש',
  voteError: 'שגיאה בשמירת ההצבעה',
  demographicsError: 'שגיאה בשמירת נתונים דמוגרפיים',
  demographicsSaved: 'הנתונים נשמרו, תודה רבה!',
  votingComplete: 'סיימתם את ההצבעה!',
  batchLoadError: 'שגיאה בטעינת העמדות הבאות',
} as const;

// ============================================================================
// VOTING INTERFACE
// ============================================================================

export const voting = {
  // Main Voting Buttons (Conjugated forms with both genders)
  agreeButton: 'מסכים/ה',
  disagreeButton: 'לא מסכים/ה',

  // Action Buttons
  passButton: 'דילוג',
  addPositionButton: 'הוסף עמדה',
  nextBatchButton: (count: number) => `${count} הבאות`,

  // Progress & Status
  progressLabel: (current: number, total: number) => `עמדה ${current} מתוך ${total}`,
  statementNumber: (num: number) => `עמדה ${num}`,

  // Loading States
  loadingNext: 'טוען עמדה הבאה...',
  loadingPoll: 'טוען דיון...',
  loadingStatements: 'טוען עמדות...',

  // Stats Labels (Plural forms)
  agreeLabel: 'מסכימים',
  disagreeLabel: 'לא מסכימים',
  passLabel: 'מדלגים',

  // Percentage Display
  percentLabel: (percent: number) => `${percent}%`,

  // Vote Recorded Messages
  voteRecorded: 'ההצבעה נשמרה',
  voteError: 'שגיאה בשמירת ההצבעה',
  voteOffline: 'ההצבעה נשמרה במצב לא מקוון',

  // Batch Completion
  batchCompleteTitle: 'עבודה מצוינת!',
  batchCompleteMessage: (count: number) => `השלמתם קבוצה של ${count} עמדות`,
} as const;

// ============================================================================
// RESULTS VIEW
// ============================================================================

export const results = {
  // Personal Insight Card
  insightLabel: 'פרופיל ההשפעה שלך',
  insightShareButton: 'לשיתוף הפרופיל שלי',
  insightSignUpLink: '💾 הירשמו לשמור פרופיל זה',
  insightLoadingError: 'לא ניתן לטעון תובנות',

  // More Statements Prompt
  moreStatementsTitle: 'יש עוד! 🎯',
  moreStatementsMessage: (count: number) => `יש עוד עמדות להצבעה. הצביעו על ${count} העמדות הבאות להמשך התרומה לשיחה.`,
  moreStatementsButton: (count: number) => `הצביעו על ${count} הבאות`,

  // Voting Complete Banner
  completeTitle: 'הצבעת על הכל!',
  completeMessage: 'תודה על השתתפותך המלאה',
  shareButton: 'שיתוף',
  addStatementButton: 'הוסיפו עמדה',

  // Stats Grid - Section Title
  statsTitle: 'סטטיסטיקות דיון',

  // Individual Stats
  statsParticipants: (count: number) => `${count} משתתפים`,
  statsPositions: (count: number) => `${count} עמדות`,
  statsTotalVotes: (count: number) => `${count} הצבעות סה"כ`,

  // Stats Labels (shorter, for cards)
  participantsLabel: 'משתתפים',
  statementsLabel: 'עמדות',
  totalVotesLabel: 'סה"כ הצבעות',

  // Strong Consensus Section
  consensusTitle: 'הסכמה חזקה',
  agreementLabel: 'הסכמה',
  consensusDescription: 'עמדות עם מעל 70% הסכמה',
  consensusAgreeLabel: (percent: number) => `${percent}% מסכימים`,
  consensusEmpty: 'אין עמדות עם הסכמה חזקה',

  // All Statements Section
  allStatementsTitle: 'כל העמדות',
  agreeLabel: 'מסכימים',
  disagreeLabel: 'לא מסכימים',
  passLabel: 'מדלגים',
  allStatementsLoading: 'טוען עמדות...',
  allStatementsEmpty: 'אין עמדות להצגה',

  // Demographic Heatmap Section
  heatmapTitle: 'התפלגות הסכמה לפי קבוצות אוכלוסיה',
  heatmapDescription: '',
  heatmapLoading: 'טוען נתונים...',

  // Demographic Attributes
  heatmapGender: 'מגדר',
  heatmapAge: 'קבוצת גיל',
  heatmapEthnicity: 'מגזר',
  heatmapPolitics: 'נטייה פוליטית',
} as const;

// ============================================================================
// BANNERS & ALERTS
// ============================================================================

export const banners = {
  // Closed Poll Banner
  closedPollHeadline: (date: string) => `דיון זה נסגר ב-${date}`,
  closedPollBody: 'התוצאות עדיין זמינות לצפייה',
  closedPollIcon: '🔒',

  // Partial Participation Banner
  partialHeadline: (voted: number, total: number) => `הצבעתם על ${voted} מתוך ${total} עמדות`,
  partialBody: 'התוצאות החלקיות שלכם מוצגות למטה',
  partialIcon: 'ℹ️',

  // Sign Up Banner (Home Page - Dismissible)
  signUpBannerHeadline: 'הירשמו לשמור את פרופילי ההשפעה שלכם',
  signUpBannerCTA: 'הרשמה',
  signUpBannerDismiss: 'אולי מאוחר יותר',
  signUpBannerIcon: '✨',
} as const;

// ============================================================================
// DEMOGRAPHICS MODAL
// ============================================================================

export const demographics = {
  // Modal Header
  title: 'לפני צפייה בתוצאות',
  description: 'עזרו לנו להבין נקודות מבט שונות',
  whyWeAskLink: 'למה אנחנו שואלים?',

  // Field Labels
  genderLabel: 'מגדר',
  ageLabel: 'קבוצת גיל',
  ethnicityLabel: 'מגזר',
  politicsLabel: 'נטייה פוליטית',

  // Field Placeholders
  genderPlaceholder: 'בחרו מגדר',
  agePlaceholder: 'בחרו קבוצת גיל',
  ethnicityPlaceholder: 'בחרו מגזר',
  politicsPlaceholder: 'בחרו נטייה פוליטית',

  // Options
  preferNotToSay: 'מעדיף/ה לא לציין',

  // Buttons
  submitButton: 'צפו בתוצאות שלי',
  cancelButton: 'ביטול',

  // Privacy Note
  privacyNote: 'הנתונים שלכם אנונימיים ומשמשים לניתוח בלבד',
  privacyIcon: '🔒',

  // Why We Ask Modal
  whyModalTitle: 'למה אנחנו שואלים על דמוגרפיה',
  whyModalBody: 'הנתונים הדמוגרפיים עוזרים לנו להבין כיצד קבוצות שונות רואות את הנושאים. כל הנתונים אנונימיים ומשמשים רק למטרות ניתוח סטטיסטי. לעולם לא נשתף או נמכור את המידע שלכם.',
  whyModalClose: 'הבנתי',

  // Validation Messages
  requiredField: 'שדה חובה',
  allFieldsRequired: 'יש למלא את כל השדות',
} as const;

// ============================================================================
// ADD POSITION MODAL
// ============================================================================

export const addPosition = {
  // Modal Header
  title: 'הוסיפו את העמדה שלכם',
  description: 'הציעו עמדה חדשה שאחרים יצביעו עליה',

  // Form Fields
  placeholder: 'כתבו את העמדה שלכם...',
  characterLimit: (remaining: number) => `${remaining} תווים נותרו`,
  characterLimitExceeded: 'חרגתם ממספר התווים המותר',

  // Buttons
  cancelButton: 'ביטול',
  submitButton: 'שליחת עמדה',
  submittingButton: 'שולח...',

  // Messages
  successMessage: 'העמדה נשלחה לאישור',
  successMessageAutoApprove: 'העמדה נוספה בהצלחה',
  errorMessage: 'שגיאה בשליחת העמדה',

  // Guidelines
  guidelinesTitle: 'הנחיות לכתיבת עמדה:',
  guideline1: 'כתבו משפט ברור וקצר',
  guideline2: 'הימנעו משפה פוגענית',
  guideline3: 'הציעו רעיון אחד בלבד',
} as const;

// ============================================================================
// AUTHENTICATION PAGES
// ============================================================================

export const auth = {
  // Login Page
  loginTitle: 'כניסה',
  loginDescription: 'גישה להיסטוריית ההצבעות והפרופילים השמורים',
  loginButton: 'כניסה',
  loginWithGoogle: 'כניסה עם Google',
  loginWithEmail: 'כניסה עם אימייל',

  // Sign Up Page
  signUpTitle: 'הרשמה',
  signUpDescription: 'שמרו את פרופילי ההשפעה ועקבו אחר ההשפעה שלכם',
  signUpButton: 'הרשמה',
  signUpWithGoogle: 'הרשמה עם Google',
  signUpWithEmail: 'הרשמה עם אימייל',

  // Post-Poll Auth Modal (after completing first poll - anonymous users)
  postPollTitle: 'עבודה מצוינת!',
  postPollBody: 'הירשמו לשמור את פרופיל ההשפעה שלך ולראות איך אתם משתווים לאחרים',
  postPollSignUp: 'הירשמו עכשיו',
  postPollDismiss: 'המשיכו כאורח/ת',
  postPollIcon: '🌟',

  // Session Messages
  sessionExpired: 'פג תוקף ההפעלה, אנא התחברו מחדש',
  signInRequired: 'יש להתחבר כדי לבצע פעולה זו',
} as const;

// ============================================================================
// SYSTEM MESSAGES
// ============================================================================

export const system = {
  // Loading States
  loading: 'טוען...',
  loadingPoll: 'טוען דיון...',
  loadingResults: 'טוען תוצאות...',
  loadingInsight: 'מייצר תובנות...',
  savingVote: 'שומר הצבעה...',
  submitting: 'שולח...',

  // Error Messages
  errorGeneric: 'אירעה שגיאה, אנא נסו שוב',
  errorPollNotFound: 'דיון לא נמצא',
  errorLoadingPoll: 'שגיאה בטעינת הדיון',
  errorSavingVote: 'שגיאה בשמירת ההצבעה',
  errorLoadingResults: 'שגיאה בטעינת התוצאות',
  errorLoadingStatements: 'שגיאה בטעינת העמדות',
  errorNetwork: 'בעיית רשת - בדקו את החיבור שלכם',
  errorUnauthorized: 'אין לכם הרשאה לבצע פעולה זו',

  // Success Messages
  voteRecorded: 'ההצבעה נשמרה!',
  positionSubmitted: 'העמדה נשלחה לאישור',
  dataUpdated: 'הנתונים עודכנו בהצלחה',
  copied: 'הועתק ללוח',

  // Confirmation Prompts
  confirmDelete: 'האם אתם בטוחים שברצונכם למחוק?',
  confirmLeave: 'האם אתם בטוחים שברצונכם לעזוב? השינויים לא נשמרו',
  confirmSubmit: 'האם אתם בטוחים שברצונכם לשלוח?',

  // Action Buttons
  retry: 'נסו שוב',
  backToPolls: 'חזרה לדיונים',
  goBack: 'חזרה',
  cancel: 'ביטול',
  confirm: 'אישור',
  save: 'שמירה',
  close: 'סגירה',
  next: 'הבא',
  previous: 'הקודם',
  skip: 'דילוג',

  // Status Messages
  online: 'מחובר לאינטרנט',
  offline: 'מנותק מהאינטרנט',
  syncing: 'מסנכרן...',
  synced: 'סונכרן בהצלחה',
} as const;

// ============================================================================
// SHARING & SOCIAL
// ============================================================================

export const sharing = {
  // Share Dialog
  shareTitle: 'שתפו את הדיון',
  shareDescription: 'הזמינו אחרים להשתתף',
  shareButton: 'שתפו',
  shareLinkCopied: 'הקישור הועתק ללוח',

  // Share Targets
  shareViaWhatsApp: 'שתפו ב-WhatsApp',
  shareViaFacebook: 'שתפו ב-Facebook',
  shareViaTwitter: 'שתפו ב-Twitter',
  shareViaEmail: 'שתפו באימייל',
  copyLink: 'העתקת קישור',

  // Share Messages
  pollShareMessage: (title: string) => `בואו להצביע בדיון: "${title}"`,
  insightShareMessage: (profile: string) => `הפרופיל שלי: ${profile}`,
  resultsShareMessage: (title: string) => `תוצאות הדיון: "${title}"`,
} as const;

// ============================================================================
// FEEDBACK SYSTEM
// ============================================================================

export const feedback = {
  // Floating Button
  buttonLabel: 'משוב',
  buttonTooltip: 'דווחו על בעיות או שתפו הצעות לשיפור',

  // Modal
  modalTitle: 'עזרו לנו להשתפר',
  modalDescription: 'דווחו על באגים, שתפו הצעות לשיפור, או כל משוב אחר שיעזור לנו לשפר את המערכת',

  // Form
  placeholder: 'תארו את הבעיה או ההצעה שלכם...',
  characterLimit: (remaining: number) => `${remaining} תווים נותרו`,
  characterLimitExceeded: 'חרגתם ממספר התווים המותר',

  // Buttons
  submitButton: 'שליחת משוב',
  submittingButton: 'שולח...',
  cancelButton: 'ביטול',

  // Messages
  successMessage: 'תודה רבה על המשוב! אנחנו מעריכים את עזרתכם',
  errorMessage: 'שגיאה בשליחת המשוב, נסו שוב',
  requiredError: 'אנא כתבו את המשוב שלכם',
  emptyError: 'המשוב לא יכול להיות ריק',

  // Success Acknowledgement
  acknowledgementTitle: 'המשוב התקבל בהצלחה! ✓',
  acknowledgementMessage: 'תודה שעזרתם לנו להשתפר. אנחנו קוראים כל משוב ומשתמשים בו כדי לשפר את המערכת.',
  closeButton: 'סגירה',

  // Guidelines (optional, for future use)
  guidelinesTitle: 'טיפים למשוב טוב:',
  guideline1: 'תארו את הבעיה או ההצעה בבירור',
  guideline2: 'ציינו באיזה עמוד או תכונה מדובר',
  guideline3: 'הוסיפו צילומי מסך אם רלוונטי (בעתיד)',
} as const;

// ============================================================================
// ADMIN & MANAGEMENT (Keep for reference, not redesigning yet)
// ============================================================================

export const admin = {
  // Dashboard
  dashboardTitle: 'לוח ניהול',
  dashboardStats: 'סטטיסטיקות',

  // Poll Management
  managePoll: 'ניהול דיון',
  editPoll: 'עריכת דיון',
  deletePoll: 'מחיקת דיון',
  publishPoll: 'פרסום דיון',
  unpublishPoll: 'ביטול פרסום',
  closePoll: 'סגירת דיון',

  // Statement Moderation
  moderateStatements: 'אישור עמדות',
  approveStatement: 'אישור',
  rejectStatement: 'דחייה',
  pendingStatements: 'עמדות ממתינות',
} as const;

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

export const dateTime = {
  // Relative time
  justNow: 'ממש עכשיו',
  minutesAgo: (minutes: number) => `לפני ${minutes} דקות`,
  hoursAgo: (hours: number) => `לפני ${hours} שעות`,
  daysAgo: (days: number) => `לפני ${days} ימים`,
  weeksAgo: (weeks: number) => `לפני ${weeks} שבועות`,
  monthsAgo: (months: number) => `לפני ${months} חודשים`,

  // Absolute dates (use date-fns with Hebrew locale)
  shortDate: 'dd/MM/yyyy',
  longDate: 'd בMMMM yyyy',
  dateTime: 'd בMMMM yyyy בשעה HH:mm',

  // Time remaining
  timeRemaining: 'זמן נותר',
  endsIn: (time: string) => `מסתיים בעוד ${time}`,
  endedOn: (date: string) => `הסתיים ב-${date}`,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get vote label (plural form for stats)
 */
export function getVoteLabel(value: -1 | 0 | 1): string {
  switch (value) {
    case 1:
      return voting.agreeLabel; // מסכימים
    case -1:
      return voting.disagreeLabel; // לא מסכימים
    case 0:
      return voting.passLabel; // מדלגים
  }
}

/**
 * Get vote button label (conjugated form with both genders)
 */
export function getVoteButtonLabel(value: -1 | 0 | 1): string {
  switch (value) {
    case 1:
      return voting.agreeButton; // מסכים/ה
    case -1:
      return voting.disagreeButton; // לא מסכים/ה
    case 0:
      return voting.passButton; // דילוג
  }
}

/**
 * Pluralize Hebrew nouns based on count
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  pollsList,
  pollCard,
  pollPage,
  voting,
  results,
  banners,
  demographics,
  addPosition,
  auth,
  system,
  sharing,
  feedback,
  admin,
  dateTime,
} as const;

// Type for all strings
export type Strings = typeof strings;

// Named exports for convenience
export const strings = {
  pollsList,
  pollCard,
  pollPage,
  voting,
  results,
  banners,
  demographics,
  addPosition,
  auth,
  system,
  sharing,
  feedback,
  admin,
  dateTime,
} as const;
