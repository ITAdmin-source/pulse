"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, UserCog } from "lucide-react";
import { transferPollOwnershipAction } from "@/actions/user-roles-actions";
import { getUserByIdAction } from "@/actions/users-actions";
import { toast } from "sonner";

interface TransferOwnershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  pollQuestion: string;
  currentOwnerId: string;
  onSuccess?: () => void;
}

export function TransferOwnershipModal({
  open,
  onOpenChange,
  pollId,
  pollQuestion,
  currentOwnerId,
  onSuccess,
}: TransferOwnershipModalProps) {
  const [newOwnerUserId, setNewOwnerUserId] = useState("");
  const [makeMeManager, setMakeMeManager] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<{ id: string; email?: string } | null>(null);

  const handleVerifyUser = async () => {
    if (!newOwnerUserId.trim()) {
      toast.error("אנא הזן מזהה משתמש");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await getUserByIdAction(newOwnerUserId.trim());

      if (result.success && result.data) {
        setVerifiedUser({ id: result.data.id, email: result.data.clerkUserId || undefined });
        toast.success("המשתמש נמצא ואומת");
      } else {
        toast.error("המשתמש לא נמצא. אנא בדוק את מזהה המשתמש.");
        setVerifiedUser(null);
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      toast.error("נכשל לאמת את המשתמש");
      setVerifiedUser(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTransfer = async () => {
    if (!verifiedUser) {
      toast.error("אנא אמת את הבעלים החדש תחילה");
      return;
    }

    if (confirmText !== "TRANSFER") {
      toast.error("אנא הקלד TRANSFER לאישור");
      return;
    }

    setIsTransferring(true);
    try {
      const result = await transferPollOwnershipAction(
        pollId,
        currentOwnerId,
        verifiedUser.id,
        makeMeManager
      );

      if (result.success) {
        toast.success("הבעלות הועברה בהצלחה");
        onOpenChange(false);
        resetForm();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "נכשל להעביר את הבעלות");
      }
    } catch (error) {
      console.error("Error transferring ownership:", error);
      toast.error("נכשל להעביר את הבעלות");
    } finally {
      setIsTransferring(false);
    }
  };

  const resetForm = () => {
    setNewOwnerUserId("");
    setMakeMeManager(false);
    setConfirmText("");
    setVerifiedUser(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isTransferring) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-blue-600" />
            <DialogTitle>העברת בעלות על הסקר</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <p>העבר בעלות על <span className="font-semibold">{pollQuestion}</span> למשתמש אחר.</p>
            <Alert className="bg-orange-50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                <strong>אזהרה:</strong> פעולה זו לא ניתנת לביטול. הבעלים החדש יקבל שליטה מלאה על סקר זה.
              </AlertDescription>
            </Alert>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Owner Input */}
          <div className="space-y-2">
            <Label htmlFor="newOwnerId">מזהה משתמש של הבעלים החדש</Label>
            <div className="flex gap-2">
              <Input
                id="newOwnerId"
                placeholder="הזן מזהה משתמש (לדוגמה, user_xyz123)"
                value={newOwnerUserId}
                onChange={(e) => {
                  setNewOwnerUserId(e.target.value);
                  setVerifiedUser(null);
                }}
                disabled={isVerifying || isTransferring}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyUser}
                disabled={isVerifying || isTransferring || !newOwnerUserId.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    מאמת...
                  </>
                ) : (
                  "אמת"
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              ניתן למצוא את מזהה המשתמש במסד הנתונים או מהפרופיל שלו
            </p>
          </div>

          {/* Verified User Display */}
          {verifiedUser && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>✓ משתמש אומת</strong>
              </p>
              <p className="text-xs text-green-700 mt-1">
                מזהה משתמש: {verifiedUser.id}
                {verifiedUser.email && ` • ${verifiedUser.email}`}
              </p>
            </div>
          )}

          {/* Make Me Manager Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="makeMeManager"
              checked={makeMeManager}
              onCheckedChange={(checked) => setMakeMeManager(checked === true)}
              disabled={isTransferring}
            />
            <Label htmlFor="makeMeManager" className="text-sm cursor-pointer">
              הפוך אותי למנהל סקר לאחר ההעברה
            </Label>
          </div>

          {/* Confirmation Input */}
          {verifiedUser && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="confirmText">
                הקלד <span className="font-mono font-bold">TRANSFER</span> לאישור
              </Label>
              <Input
                id="confirmText"
                placeholder="TRANSFER"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isTransferring}
                className="font-mono"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isTransferring}
          >
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={handleTransfer}
            disabled={!verifiedUser || confirmText !== "TRANSFER" || isTransferring}
          >
            {isTransferring ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                מעביר...
              </>
            ) : (
              "העבר בעלות"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
