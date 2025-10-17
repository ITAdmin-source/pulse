"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { demographics as demographicsStrings } from "@/lib/strings/he";

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
  const [showWhyWeAsk, setShowWhyWeAsk] = useState(false);

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
    <>
      <Dialog open={open} modal>
        <DialogContent
          className="sm:max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center mb-6">
            <div className="text-5xl sm:text-6xl mb-4">🎯</div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {demographicsStrings.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base">
              {demographicsStrings.description}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                  {demographicsStrings.genderLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={genderId} onValueChange={setGenderId} required>
                  <SelectTrigger id="gender" className="w-full border-2 border-gray-300 rounded-lg focus:border-purple-500">
                    <SelectValue placeholder={demographicsStrings.genderPlaceholder} />
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
                <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                  {demographicsStrings.ageLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={ageGroupId} onValueChange={setAgeGroupId} required>
                  <SelectTrigger id="age" className="w-full border-2 border-gray-300 rounded-lg focus:border-purple-500">
                    <SelectValue placeholder={demographicsStrings.agePlaceholder} />
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
                <Label htmlFor="ethnicity" className="text-sm font-medium text-gray-700">
                  {demographicsStrings.ethnicityLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={ethnicityId} onValueChange={setEthnicityId} required>
                  <SelectTrigger id="ethnicity" className="w-full border-2 border-gray-300 rounded-lg focus:border-purple-500">
                    <SelectValue placeholder={demographicsStrings.ethnicityPlaceholder} />
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
                <Label htmlFor="party" className="text-sm font-medium text-gray-700">
                  {demographicsStrings.politicsLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={politicalPartyId} onValueChange={setPoliticalPartyId} required>
                  <SelectTrigger id="party" className="w-full border-2 border-gray-300 rounded-lg focus:border-purple-500">
                    <SelectValue placeholder={demographicsStrings.politicsPlaceholder} />
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

          <div className="mb-4">
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting}
              className={`w-full font-semibold py-3 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base ${
                isFormComplete && !isSubmitting
                  ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? demographicsStrings.requiredField
                : isFormComplete
                  ? demographicsStrings.submitButton
                  : demographicsStrings.allFieldsRequired
              }
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 space-x-3">
            <button
              onClick={() => setShowWhyWeAsk(true)}
              className="hover:text-gray-700 underline"
            >
              {demographicsStrings.whyWeAskLink}
            </button>
            <span>•</span>
            <button className="hover:text-gray-700 underline">
              מדיניות פרטיות
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            {demographicsStrings.privacyNote}
          </p>
        </DialogContent>
      </Dialog>

      {/* Why We Ask Modal */}
      {showWhyWeAsk && (
        <Dialog open={showWhyWeAsk} onOpenChange={setShowWhyWeAsk}>
          <DialogContent className="max-w-md p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 mb-4">
                {demographicsStrings.whyModalTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 text-gray-700 text-sm mb-6">
              <p>{demographicsStrings.whyModalBody}</p>
            </div>

            <Button
              onClick={() => setShowWhyWeAsk(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {demographicsStrings.whyModalClose}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
