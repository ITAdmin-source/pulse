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
  onOpenChange: (open: boolean) => void;
  onSubmit: (demographics: DemographicsData) => Promise<void>;
  onSkip: () => void;
}

export interface DemographicsData {
  ageGroupId?: number;
  genderId?: number;
  ethnicityId?: number;
  politicalPartyId?: number;
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

export function DemographicsModal({ open, onOpenChange, onSubmit, onSkip }: DemographicsModalProps) {
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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ageGroupId: ageGroupId ? parseInt(ageGroupId) : undefined,
        genderId: genderId ? parseInt(genderId) : undefined,
        ethnicityId: ethnicityId ? parseInt(ethnicityId) : undefined,
        politicalPartyId: politicalPartyId ? parseInt(politicalPartyId) : undefined,
      });
    } catch (error) {
      console.error("Error submitting demographics:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>עזור לנו להבין אותך</DialogTitle>
          <DialogDescription>
            כל השדות אופציונליים ועוזרים לנו לספק תובנות טובות יותר.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="age">קבוצת גיל (אופציונלי)</Label>
              <Select value={ageGroupId} onValueChange={setAgeGroupId}>
                <SelectTrigger id="age">
                  <SelectValue placeholder="בחר קבוצת גיל" />
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
              <Label htmlFor="gender">מגדר (אופציונלי)</Label>
              <Select value={genderId} onValueChange={setGenderId}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="בחר מגדר" />
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
              <Label htmlFor="ethnicity">מוצא אתני (אופציונלי)</Label>
              <Select value={ethnicityId} onValueChange={setEthnicityId}>
                <SelectTrigger id="ethnicity">
                  <SelectValue placeholder="בחר מוצא אתני" />
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
              <Label htmlFor="party">מפלגה פוליטית (אופציונלי)</Label>
              <Select value={politicalPartyId} onValueChange={setPoliticalPartyId}>
                <SelectTrigger id="party">
                  <SelectValue placeholder="בחר מפלגה פוליטית" />
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            דלג
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "שומר..." : "המשך"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
