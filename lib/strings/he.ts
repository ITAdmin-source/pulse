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
  appTitle: 'דיונים  ציבוריים שמתקנים',
  heroHeadline: 'הצטרפו לדיון והשפיעו עכשיו',
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
  participantsVoted: 'הצביעו',  // for closed polls (past tense)
  participantsActive: 'משתתפים',  // for active polls (present tense)
  voters: 'מצביעים',
  positions: 'עמדות',
  statements: 'עמדות',
  votes: 'הצבעות',
  totalVotes: 'הצבעות',  // for total vote count

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
  tabResultsLockedTooltip: (required: number) => `הצביעו על ${required} עמדות לפחות כדי לפתוח את התוצאות`,

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
// SPLASH SCREEN (WELCOME VIEW)
// ============================================================================

export const splashScreen = {
  // How it works (3 simple steps)
  step1: 'קראו עמדות שונות',
  step2: 'הצביעו בעד 👍 או נגד 👎',
  step3: 'ראו איפה אתם ביחס לאחרים',

  // Privacy note
  privacyNote: 'ההצבעה אנונימית',

  // CTA Button
  startButton: 'בואו נתחיל',
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
  voteCounter: (current: number, required: number) => `הצבעה ${current} מתוך ${required}`,

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

  // Gamification - Milestone Encouragement (Dynamic)
  milestone30Percent: 'כל הכבוד! 📊',
  milestone50Percent: 'אתם בדרך! 🚀',
  milestone70Percent: 'עוד קצת! 💪',
  milestoneInsightTeaser: (remaining: number) =>
    remaining === 1
      ? 'עוד הצבעה אחת לתובנה האישית שלך! 🎁'
      : `עוד ${remaining} הצבעות לתובנה האישית שלך! 🎁`,
  milestoneThresholdReached: 'מדהים! פתחת את התוצאות! 🎉',
  milestoneAlmostThere: 'כמעט שם! ⭐',

  // Celebration Overlay
  unlockCelebrationTitle: 'פתחת את התוצאות!',
  unlockCelebrationSubtitle: 'התובנות האישיות שלך מוכנות',
} as const;

// ============================================================================
// RESULTS VIEW
// ============================================================================

export const results = {
  // Results Sub-Navigation (3 tabs)
  tabInsight: 'תובנה',
  tabResults: 'תוצאות',
  tabConnect: 'קהילה',

  // Personal Insight Card
  insightLabel: 'תובנה אישית שלך',
  insightShareButton: 'לשיתוף התובנה שלי',
  insightSignUpLink: '💾 הירשמו לשמור תובנה זו',
  insightLoadingError: 'לא ניתן לטעון תובנות',

  // Artifact Collection
  collectionTitle: 'אוסף',
  artifacts: 'חפצים',
  unlock: 'לפתוח',
  earnMore: 'להשיג יותר',
  newArtifactUnlocked: 'חפץ חדש נפתח!',
  signUpToCollect: 'הירשמו לאסוף תובנות',
  artifactCount: (current: number, max: number) => `${current}/${max}`,
  viewCollection: 'צפו באוסף',
  rarityCommon: 'נפוץ',
  rarityRare: 'נדיר',
  rarityLegendary: 'אגדי',

  // Insight Detail Modal
  insightFromDiscussion: 'תובנה מהדיון:',
  viewFullDiscussion: 'צפו בדיון המלא',
  loadingInsightModal: 'טוען תובנה...',
  insightNotFound: 'לא נמצאה תובנה',

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

  // Action Buttons
  continueVotingButton: 'המשך הצבעה',
  addStatementButtonAction: 'הוסף עמדה',

  // Signup Banner
  signupBannerTitle: 'שמרו את התובנות שלכם',
  signupBannerMessage: 'הירשמו כדי לשמור את התובנה האישית שלכם ולעקוב אחר ההתפתחות',
  signupBannerButton: 'הצטרפו עכשיו',

  // Connect Coming Soon
  connectComingSoon: 'בקרוב - חיבור לאנשים דומים לך',
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
  signUpBannerTitle: 'לעולם לא תפססו דיון',
  signUpBannerBody: 'הירשמו כדי לקבל התראות על דיונים חדשים',
  signUpBannerCTA: 'הרשמה חינם',
  signUpBannerDismiss: 'אולי מאוחר יותר',
  signUpBannerIcon: '💡',
} as const;

// ============================================================================
// DEMOGRAPHICS MODAL
// ============================================================================

export const demographics = {
  // Modal Header
  title: 'לפני צפייה בתוצאות',
  description: 'עזרו לנו להבין נקודות מבט שונות. כל הנתונים אנונימיים ומשמשים למטרות ניתוח סטטיסטי.',
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
  loginDescription: 'גישה להיסטוריית ההצבעות והתובנות השמורות',
  loginButton: 'כניסה',
  loginWithGoogle: 'כניסה עם Google',
  loginWithEmail: 'כניסה עם אימייל',

  // Sign Up Page
  signUpTitle: 'הרשמה',
  signUpDescription: 'שמרו את התובנות האישיות ועקבו אחר ההשפעה שלכם',
  signUpButton: 'הרשמה',
  signUpWithGoogle: 'הרשמה עם Google',
  signUpWithEmail: 'הרשמה עם אימייל',

  // Post-Poll Auth Modal (after completing first poll - anonymous users)
  postPollTitle: 'עבודה מצוינת!',
  postPollBody: 'הירשמו לשמור את התובנה האישית שלך ולראות איך אתם משתווים לאחרים',
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
  insightShareMessage: (profile: string) => `התובנה שלי: ${profile}`,
  resultsShareMessage: (title: string) => `תוצאות הדיון: "${title}"`,

  // Share Success/Error Messages
  shareSuccess: 'שותף בהצלחה!',
  shareImageDownloaded: 'התמונה הורדה וקישור הועתק ללוח',
  shareError: 'נכשל לשתף',
  shareImageError: 'לא ניתן ליצור תמונה, קישור הועתק ללוח',

  // Voting Complete Share Text
  votingCompleteShareText: (pollQuestion: string) => `סיימתי להצביע על כל העמדות ב-"${pollQuestion}"! הצטרפו אליי 🎉`,
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

// ============================================================================
// OPINION MAP PAGE (CLUSTERING VISUALIZATION)
// ============================================================================

export const opinionMap = {
  // Page Title & Header
  pageTitle: 'מפת דעות',
  backToResults: 'חזרה לתוצאות',

  // Loading States
  loading: 'בונים את מפת הדעות...',
  computing: 'מחשבים קבוצות דעה...',

  // Eligibility Messages
  notEligibleTitle: 'מפת הדעות עדיין לא זמינה',
  notEligibleMinUsers: (current: number, required: number) =>
    `דרושים לפחות ${required} מצביעים כדי ליצור מפת דעות. כרגע: ${current} מצביעים.`,
  notEligibleMinStatements: (current: number, required: number) =>
    `דרושות לפחות ${required} עמדות כדי ליצור מפת דעות. כרגע: ${current} עמדות.`,
  checkBackLater: 'חזרו מאוחר יותר כשיהיו יותר מצביעים',

  // Error States
  errorTitle: 'שגיאה בטעינת מפת הדעות',
  errorMessage: 'לא הצלחנו לטעון את מפת הדעות. נסו לרענן את הדף.',
  errorRetry: 'נסו שוב',

  // Legend & Groups
  legendTitle: 'קבוצות דעה',
  yourPosition: 'המיקום שלכם',
  yourGroup: 'הקבוצה שלכם',
  groupLabel: (n: number) => `קבוצה ${n}`,
  groupSize: (count: number) => `${count} משתתפים`,

  // Visualization Controls
  zoomIn: 'התקרבו',
  zoomOut: 'התרחקו',
  resetView: 'אפסו תצוגה',
  toggleLabels: 'הצגת תוויות',

  // Statement Classifications
  consensusTitle: 'עמדות קונצנזוס',
  divisiveTitle: 'עמדות מחלקות',
  bridgeTitle: 'עמדות גשר',

  consensusPositive: 'קונצנזוס חיובי',
  consensusNegative: 'קונצנזוס שלילי',
  divisiveStatement: 'עמדה מחלקת',
  bridgeStatement: 'עמדת גשר',

  consensusDescription: 'כל הקבוצות מסכימות על עמדות אלו',
  divisiveDescription: 'קבוצות שונות חלוקות מאוד על עמדות אלו',
  bridgeDescription: 'עמדות שמחברות בין קבוצות שונות',

  // Quality Metrics
  qualityTitle: 'איכות הניתוח',
  silhouetteScore: 'ציון איכות',
  varianceExplained: 'שונות מוסברת',
  clusterCount: (n: number) => `${n} קבוצות`,

  qualityExcellent: 'מצוין',
  qualityGood: 'טוב',
  qualityFair: 'סביר',
  qualityPoor: 'נמוך',

  // Quality Tier Labels
  qualityTierHigh: 'איכות גבוהה',
  qualityTierMedium: 'איכות בינונית',
  qualityTierLow: 'איכות נמוכה',

  // Consensus Level Labels
  consensusLevelHigh: 'הסכמה גבוהה',
  consensusLevelMedium: 'הסכמה בינונית',
  consensusLevelLow: 'מגוון דעות',

  // Quality Indicators
  qualityIndicatorTitle: 'מידע על איכות הניתוח',
  qualityIndicatorHigh: 'מפת הדעות מציגה בבירור את הקבוצות השונות ואת ההבדלים ביניהן.',
  qualityIndicatorMedium: 'מפת הדעות מציגה את הקבוצות העיקריות. יש מעט חפיפה בין הקבוצות.',
  qualityIndicatorLowWithConsensus: 'בדיון זה יש הסכמה גבוהה על רוב העמדות. הקבוצות המוצגות עשויות להיות פחות מובחנות.',
  qualityIndicatorLowWithoutConsensus: 'איכות הניתוח נמוכה יחסית. הקבוצות המוצגות עשויות להיות פחות מובהקות.',

  consensusIndicatorTitle: 'רמת הסכמה',
  consensusIndicatorHigh: 'דיון זה מראה הסכמה גבוהה - רוב המשתתפים מסכימים על רוב העמדות.',
  consensusIndicatorMedium: 'דיון זה מראה הסכמה חלקית - יש הסכמה על חלק מהעמדות ומחלוקת על אחרות.',
  consensusIndicatorLow: 'דיון זה מראה מגוון רחב של דעות - המשתתפים חלוקים על רוב העמדות.',

  // Tooltips & Help
  helpTitle: 'איך קוראים את המפה?',
  helpClose: 'סגרו',

  // Onboarding Tutorial
  tutorialTitle: 'ברוכים הבאים למפת הדעות',
  tutorialSkip: 'דלגו',
  tutorialNext: 'הבא',
  tutorialPrev: 'הקודם',
  tutorialDone: 'הבנתי',

  tutorialStep1Title: 'מה זו מפת דעות?',
  tutorialStep1Description: 'מפת הדעות מציגה איך המצביעים מתקבצים לפי דפוסי ההצבעה שלהם. כל נקודה מייצגת מצביע.',

  tutorialStep2Title: 'הקבוצה שלכם',
  tutorialStep2Description: 'הנקודה המסומנת היא המיקום שלכם במפה. מצביעים עם דעות דומות נמצאים קרוב אליכם.',

  tutorialStep3Title: 'קבוצות דעה',
  tutorialStep3Description: 'המערכת זיהתה קבוצות של מצביעים עם דפוסי הצבעה דומים. כל צבע מייצג קבוצה אחרת.',

  tutorialStep4Title: 'עמדות מעניינות',
  tutorialStep4Description: 'המערכת מזהה עמדות קונצנזוס (כולם מסכימים), עמדות מחלקות (קבוצות חלוקות), ועמדות גשר (מחברות בין קבוצות).',

  tutorialStep5Title: 'חקרו את המפה',
  tutorialStep5Description: 'השתמשו בעכבר או באצבע כדי להזיז ולהתקרב. לחצו על קבוצות כדי לראות מידע נוסף.',

  // Accessibility
  ariaLabel: 'מפת דעות אינטראקטיבית',
  ariaYourPosition: 'המיקום שלכם במפת הדעות',
  ariaGroup: (n: number) => `קבוצת דעה ${n}`,

  // Mobile Specific
  mobileSwipeHint: 'החליקו כדי לראות עוד',
  mobileTapHint: 'הקישו על קבוצה לפרטים',
  mobileSimplifiedView: 'תצוגה מפושטת למובייל',

  // Data Table View
  tableViewTitle: 'תצוגת טבלה',
  tableGroup: 'קבוצה',
  tableSize: 'גודל',
  tablePercentage: 'אחוז',
  tableTopStatements: 'עמדות מובילות',

  // View Toggle (Dual Visualization)
  viewToggleMap: 'מפת משתתפים',
  viewToggleStatements: 'הסכמה על עמדות',
  viewToggleMapDescription: 'ראו איך המשתתפים מקובצים לפי דמיון בהצבעות',
  viewToggleStatementsDescription: 'ראו על אילו עמדות הקבוצות מסכימות או חלוקות',

  // Statement Agreement View
  statementAgreementTitle: 'הסכמה על עמדות',
  statementAgreementDescription: 'איך כל קבוצה הצביעה על כל עמדה',
  statementAgreementLegend: 'מקרא: ירוק = הסכמה, אדום = אי-הסכמה, אפור = נייטרלי',

  // Statement Classifications (Enhanced)
  fullConsensusTitle: 'הסכמה מלאה',
  partialConsensusTitle: 'הסכמה חלקית',
  splitDecisionTitle: 'פיצול שווה',
  divisiveEnhancedTitle: 'מחלקת',
  bridgeEnhancedTitle: 'גשר',

  fullConsensusDescription: 'כל הקבוצות מסכימות',
  partialConsensusDescription: 'רוב הקבוצות מסכימות',
  splitDecisionDescription: 'הקבוצות מתחלקות באופן שווה',
  divisiveEnhancedDescription: 'דעות מפוצלות',
  bridgeEnhancedDescription: 'מחברת בין קבוצות',

  // Coalition Analysis
  coalitionTitle: 'קואליציות',
  coalitionDescription: 'קבוצות שמסכימות לעיתים קרובות',
  strongestCoalition: 'קואליציה חזקה ביותר',
  coalitionAlignment: (percentage: number) => `${percentage}% הסכמה`,
  coalitionBetween: (group1: string, group2: string) => `${group1} ⇄ ${group2}`,
  polarizationLevel: 'רמת קיטוב',
  polarizationHigh: 'קיטוב גבוה',
  polarizationMedium: 'קיטוב בינוני',
  polarizationLow: 'קיטוב נמוך',

  // Statement Stats Cards
  statsTitle: 'סטטיסטיקות עמדות',
  statsConsensusCount: (count: number) => `${count} עמדות קונצנזוס`,
  statsPartialCount: (count: number) => `${count} עמדות הסכמה חלקית`,
  statsSplitCount: (count: number) => `${count} עמדות פיצול`,
  statsDivisiveCount: (count: number) => `${count} עמדות מחלקות`,
  statsBridgeCount: (count: number) => `${count} עמדות גשר`,

  // Heatmap
  heatmapCellLabel: (group: string, statement: string, agreement: number) =>
    `${group} על "${statement}": ${agreement > 0 ? 'מסכימים' : agreement < 0 ? 'לא מסכימים' : 'נייטרלי'} (${Math.abs(agreement)}%)`,
  heatmapNoData: 'אין מספיק נתונים להצגת הסכמה',
  heatmapLoading: 'טוען נתוני הסכמה...',
} as const;

// ============================================================================
// ERROR PAGES
// ============================================================================

export const errorPages = {
  // 404 Page
  notFound: {
    title: 'הדף לא נמצא',
    subtitle: 'אופס! נראה שהדף שחיפשתם לא קיים',
    description: 'הדף עשוי להיות הוזז, נמחק או שהכתובת שהוזנה אינה נכונה',
    homeButton: 'חזרה לדף הבית',
    pollsButton: 'דיונים פעילים',
    errorCode: '404',
  },
} as const;

// ============================================================================
// MUSIC RECOMMENDATION
// ============================================================================

export const musicRecommendation = {
  // Card Headers
  sectionTitle: 'השיר שלך',
  sectionSubtitle: 'בחרנו לך שיר שמתאים לאישיותך',

  // Loading States
  loading: 'מחפשים את השיר המושלם...',
  loadingSubtext: 'מנתחים את דפוס ההצבעה שלך',

  // Buttons
  listenOnSpotify: 'Spotify ב-',
  listenOnAppleMusic: 'Apple Music ב-',
  shareButton: 'שתפו',

  // Labels
  songBy: 'מאת',
  whyThisSong: 'למה השיר הזה?',

  // Error States
  errorTitle: 'לא הצלחנו למצוא שיר',
  errorMessage: 'נסו שוב מאוחר יותר',
  retryButton: 'נסו שוב',

  // Fallback message
  fallbackNote: 'זוהי המלצה כללית - נסו לרענן לקבלת שיר מותאם יותר',
} as const;

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
  splashScreen,
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
  opinionMap,
  errorPages,
  musicRecommendation,
} as const;

// Type for all strings
export type Strings = typeof strings;

// Named exports for convenience
export const strings = {
  pollsList,
  pollCard,
  pollPage,
  splashScreen,
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
  opinionMap,
  errorPages,
  musicRecommendation,
} as const;
