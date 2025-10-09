"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, X, Plus, Loader2 } from "lucide-react";
import { createPollAction } from "@/actions/polls-actions";
import { createStatementAction } from "@/actions/statements-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { toast } from "sonner";

const STEPS = 5;

export default function CreatePollPage() {
  const router = useRouter();
  const { user: dbUser, sessionId: contextSessionId, isLoading: isUserLoading, userRoles } = useCurrentUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Form state
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("");
  const [allowUserStatements, setAllowUserStatements] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [votingGoal, setVotingGoal] = useState("");
  const [agreeLabel, setAgreeLabel] = useState("Agree");
  const [disagreeLabel, setDisagreeLabel] = useState("Disagree");
  const [passLabel, setPassLabel] = useState("Pass");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [statements, setStatements] = useState<string[]>(["", "", "", "", "", ""]);

  const progress = (currentStep / STEPS) * 100;

  // Check authorization on mount
  useEffect(() => {
    if (isUserLoading) return;

    // User must be authenticated to create polls
    if (!dbUser?.id) {
      toast.error("אנא התחבר כדי ליצור סקרים");
      router.push("/login");
      return;
    }

    // Check if user has permission to create polls
    const hasPermission = userRoles.some(
      role => role.role === 'system_admin' || role.role === 'poll_creator' || role.role === 'poll_manager'
    );

    if (!hasPermission) {
      toast.error("נדרשות הרשאות יצירת סקרים. פנה למנהל מערכת.");
      router.push("/unauthorized");
      return;
    }

    setAuthCheckComplete(true);
  }, [isUserLoading, dbUser, userRoles, router]);

  const addStatement = () => {
    setStatements([...statements, ""]);
  };

  const removeStatement = (index: number) => {
    if (statements.length > 6) {
      setStatements(statements.filter((_, i) => i !== index));
    }
  };

  const updateStatement = (index: number, value: string) => {
    const newStatements = [...statements];
    newStatements[index] = value;
    setStatements(newStatements);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return question.trim().length > 0;
      case 2:
        return true; // All fields optional
      case 3:
        return agreeLabel.length <= 10 && disagreeLabel.length <= 10 && passLabel.length <= 10;
      case 4:
        return true; // All fields optional
      case 5:
        const filledStatements = statements.filter(s => s.trim().length > 0);
        return filledStatements.length >= 6;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (isUserLoading) {
      toast.error("אנא המתן...");
      return;
    }

    setIsCreating(true);

    try {
      // Ensure user exists (for both authenticated and anonymous users)
      let userId: string;

      if (dbUser?.id) {
        // User already exists in database
        userId = dbUser.id;
      } else if (contextSessionId) {
        // Anonymous user without DB record - create now
        const userResult = await ensureUserExistsAction({
          clerkUserId: dbUser?.clerkUserId || undefined,
          sessionId: contextSessionId,
        });

        if (!userResult.success || !userResult.data) {
          toast.error("יצירת המשתמש נכשלה");
          return;
        }

        userId = userResult.data.id;
      } else {
        toast.error("מפגש המשתמש לא נמצא");
        return;
      }

      // Create slug from question
      const slug = question
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .substring(0, 100);

      // Create poll
      const pollData = {
        question: question.trim(),
        description: description.trim() || null,
        emoji: emoji.trim() || null,
        createdBy: userId,
        allowUserStatements,
        autoApproveStatements: autoApprove,
        slug,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        votingGoal: votingGoal ? parseInt(votingGoal) : null,
        supportButtonLabel: agreeLabel !== "Agree" ? agreeLabel : null,
        opposeButtonLabel: disagreeLabel !== "Disagree" ? disagreeLabel : null,
        unsureButtonLabel: passLabel !== "Pass" ? passLabel : null,
        status: "draft" as const,
      };

      const pollResult = await createPollAction(pollData);

      if (!pollResult.success || !pollResult.data) {
        toast.error(pollResult.error || "יצירת הסקר נכשלה");
        return;
      }

      // Create initial statements (all pre-approved)
      const filledStatements = statements.filter(s => s.trim().length > 0);
      const statementPromises = filledStatements.map((statement) =>
        createStatementAction({
          pollId: pollResult.data.id,
          text: statement.trim(),
          submittedBy: userId,
          approved: true, // Pre-approve initial statements
        })
      );

      const statementResults = await Promise.all(statementPromises);
      const failedStatements = statementResults.filter(r => !r.success);

      if (failedStatements.length > 0) {
        toast.warning(`הסקר נוצר, אך ${failedStatements.length} הצהרות לא נשמרו`);
      } else {
        toast.success("הסקר נוצר בהצלחה!");
      }

      // Redirect to poll management page
      router.push(`/polls/${pollResult.data.slug}/manage`);
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("אירעה שגיאה בלתי צפויה");
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading state while checking authorization
  if (!authCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">שלב {currentStep} מתוך {STEPS}</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}% הושלם</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "מידע בסיסי"}
              {currentStep === 2 && "הגדרות בקרה"}
              {currentStep === 3 && "תוויות כפתורים"}
              {currentStep === 4 && "תזמון"}
              {currentStep === 5 && "הצהרות ראשוניות"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "הגדר את השאלה והתיאור הראשיים לסקר"}
              {currentStep === 2 && "הגדר כיצד משתתפים יכולים לתקשר עם הסקר"}
              {currentStep === 3 && "התאם את תוויות כפתורי ההצבעה"}
              {currentStep === 4 && "הגדר מתי הסקר צריך להתחיל ולהסתיים"}
              {currentStep === 5 && "הוסף לפחות 6 הצהרות כדי להתחיל"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="question">שאלת הסקר *</Label>
                  <Input
                    id="question"
                    placeholder="מה כדאי לעשות בנושא שינויי האקלים?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">תיאור (אופציונלי)</Label>
                  <Textarea
                    id="description"
                    placeholder="הקשר או הנחיות נוספות למשתתפים..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">אמוג&apos;י לחפיסה (אופציונלי)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="emoji"
                      placeholder="🎴"
                      maxLength={10}
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="text-4xl text-center w-24 h-16"
                    />
                    <div className="text-sm text-gray-500 flex-1">
                      הזן אמוג&apos;י לייצג את חפיסת הסקר
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Control Settings */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowStatements"
                    checked={allowUserStatements}
                    onCheckedChange={(checked) => setAllowUserStatements(checked as boolean)}
                  />
                  <Label htmlFor="allowStatements" className="cursor-pointer">
                    אפשר הצהרות ממשתמשים
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoApprove"
                    checked={autoApprove}
                    onCheckedChange={(checked) => setAutoApprove(checked as boolean)}
                    disabled={!allowUserStatements}
                  />
                  <Label
                    htmlFor="autoApprove"
                    className={allowUserStatements ? "cursor-pointer" : "cursor-not-allowed text-gray-400"}
                  >
                    אישור אוטומטי להצהרות
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal">יעד הצבעה (אופציונלי)</Label>
                  <Input
                    id="goal"
                    type="number"
                    placeholder="1000"
                    value={votingGoal}
                    onChange={(e) => setVotingGoal(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">מספר יעד של הצבעות כולל</p>
                </div>
              </>
            )}

            {/* Step 3: Button Labels */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="agreeLabel">תווית כפתור תמיכה (עד 10 תווים)</Label>
                  <Input
                    id="agreeLabel"
                    placeholder="תמיכה"
                    maxLength={10}
                    value={agreeLabel}
                    onChange={(e) => setAgreeLabel(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">מוצג על הכרטיס</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disagreeLabel">תווית כפתור התנגדות (עד 10 תווים)</Label>
                  <Input
                    id="disagreeLabel"
                    placeholder="התנגדות"
                    maxLength={10}
                    value={disagreeLabel}
                    onChange={(e) => setDisagreeLabel(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">מוצג על הכרטיס</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passLabel">תווית דילוג/לא בטוח (עד 10 תווים)</Label>
                  <Input
                    id="passLabel"
                    placeholder="דילוג"
                    maxLength={10}
                    value={passLabel}
                    onChange={(e) => setPassLabel(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">מוצג מתחת לכרטיס</p>
                </div>
              </>
            )}

            {/* Step 4: Scheduling */}
            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startTime">זמן התחלה (אופציונלי)</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">השאר ריק להתחלה מיידית</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">זמן סיום (אופציונלי)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">השאר ריק ללא תאריך סיום</p>
                </div>
              </>
            )}

            {/* Step 5: Initial Statements */}
            {currentStep === 5 && (
              <>
                <div className="space-y-4">
                  {statements.map((statement, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-grow space-y-1">
                        <Label htmlFor={`statement-${index}`}>
                          הצהרה {index + 1} {index < 6 && "*"}
                        </Label>
                        <div className="flex gap-2">
                          <Textarea
                            id={`statement-${index}`}
                            placeholder="הזן הצהרה..."
                            rows={2}
                            value={statement}
                            onChange={(e) => updateStatement(index, e.target.value)}
                          />
                          {index >= 6 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStatement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addStatement} className="w-full">
                    <Plus className="h-4 w-4 me-2" />
                    הוספת הצהרה
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    נוספו: {statements.filter(s => s.trim().length > 0).length} הצהרות
                  </p>
                  {statements.filter(s => s.trim().length > 0).length < 6 && (
                    <p className="text-sm text-red-600 mt-1">
                      נדרשות לפחות 6 הצהרות ליצירת סקר
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            חזרה
          </Button>

          {currentStep < STEPS ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              הבא
              <ArrowRight className="h-4 w-4 ms-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={!canProceed() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                "יצירת סקר"
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
