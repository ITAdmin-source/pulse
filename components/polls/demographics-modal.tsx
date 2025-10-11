"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getAgeGroupsAction } from "@/actions/age-groups-actions";
import { getGendersAction } from "@/actions/genders-actions";
import { getEthnicitiesAction } from "@/actions/ethnicities-actions";
import { getPoliticalPartiesAction } from "@/actions/political-parties-actions";

interface DemographicsModalProps {
  open: boolean;
  onSubmit: (demographics: DemographicsData) => Promise<void>;
}

export interface DemographicsData {
  ageGroupId: number;
  genderId: number;
  ethnicityId: number;
  politicalPartyId: number;
}

interface AgeGroup {
  id: number;
  label: string;
}

interface Gender {
  id: number;
  label: string;
}

interface Ethnicity {
  id: number;
  label: string;
}

interface PoliticalParty {
  id: number;
  label: string;
}

export function DemographicsModal({ open, onSubmit }: DemographicsModalProps) {
  const [ageGroupId, setAgeGroupId] = useState<string>();
  const [genderId, setGenderId] = useState<string>();
  const [ethnicityId, setEthnicityId] = useState<string>();
  const [politicalPartyId, setPoliticalPartyId] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for fetched options
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [ethnicities, setEthnicities] = useState<Ethnicity[]>([]);
  const [politicalParties, setPoliticalParties] = useState<PoliticalParty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch demographic options from database
  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      try {
        const [ageGroupsResult, gendersResult, ethnicitiesResult, partiesResult] = await Promise.all([
          getAgeGroupsAction(),
          getGendersAction(),
          getEthnicitiesAction(),
          getPoliticalPartiesAction(),
        ]);

        if (ageGroupsResult.success && ageGroupsResult.data) {
          setAgeGroups(ageGroupsResult.data);
        }
        if (gendersResult.success && gendersResult.data) {
          setGenders(gendersResult.data);
        }
        if (ethnicitiesResult.success && ethnicitiesResult.data) {
          setEthnicities(ethnicitiesResult.data);
        }
        if (partiesResult.success && partiesResult.data) {
          setPoliticalParties(partiesResult.data);
        }
      } catch (error) {
        console.error("Error fetching demographic options:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchOptions();
    }
  }, [open]);

  // Check if all fields are filled
  const isFormComplete = ageGroupId && genderId && ethnicityId && politicalPartyId;

  const handleSubmit = async () => {
    // Ensure all fields are filled before submitting
    if (!isFormComplete) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ageGroupId: parseInt(ageGroupId!),
        genderId: parseInt(genderId!),
        ethnicityId: parseInt(ethnicityId!),
        politicalPartyId: parseInt(politicalPartyId!),
      });
    } catch (error) {
      console.error("Error submitting demographics:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>בוא נכיר אותך</DialogTitle>
          <DialogDescription>
          לפני שנתחיל, תוכל/י לענות על 4 שאלות כדי שנדע עם מי יש לנו הכבוד.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="age">קבוצת גיל <span className="text-red-500">*</span></Label>
              <Select value={ageGroupId} onValueChange={setAgeGroupId} required>
                <SelectTrigger id="age">
                  <SelectValue placeholder="בחירת קבוצת גיל" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">מגדר <span className="text-red-500">*</span></Label>
              <Select value={genderId} onValueChange={setGenderId} required>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="בחירת מגדר" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender.id} value={String(gender.id)}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ethnicity">מגזר <span className="text-red-500">*</span></Label>
              <Select value={ethnicityId} onValueChange={setEthnicityId} required>
                <SelectTrigger id="ethnicity">
                  <SelectValue placeholder="בחירת מגזר" />
                </SelectTrigger>
                <SelectContent>
                  {ethnicities.map((ethnicity) => (
                    <SelectItem key={ethnicity.id} value={String(ethnicity.id)}>
                      {ethnicity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party">נטייה פוליטית <span className="text-red-500">*</span></Label>
              <Select value={politicalPartyId} onValueChange={setPoliticalPartyId} required>
                <SelectTrigger id="party">
                  <SelectValue placeholder="בחירת נטייה פוליטית" />
                </SelectTrigger>
                <SelectContent>
                  {politicalParties.map((party) => (
                    <SelectItem key={party.id} value={String(party.id)}>
                      {party.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!isFormComplete || isSubmitting}
          >
            {isSubmitting ? "שומר..." : "המשך"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
