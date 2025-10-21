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
import { Loader2, Users, Calendar, Globe, Flag } from "lucide-react";
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
          className="sm:max-w-md p-0 max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl"
          showCloseButton={false}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Gradient Header */}
          <div className="bg-gradient-poll-header p-6 sm:p-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-2 start-2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-2 end-2 w-20 h-20 rounded-full bg-white/10 blur-xl" />

            <DialogHeader className="text-center relative z-10">
              <div className="text-5xl sm:text-6xl mb-3">🎯</div>
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {demographicsStrings.title}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-sm sm:text-base">
                {demographicsStrings.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* White Body */}
          <div className="p-4 sm:p-6 bg-white overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)]">

          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Gender Field */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Users size={16} className="text-primary-600" />
                  {demographicsStrings.genderLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={genderId} onValueChange={setGenderId} required>
                  <SelectTrigger id="gender" className="w-full border-2 border-primary-500-20 rounded-lg focus:border-primary-500 text-gray-900 dark:text-gray-900">
                    <SelectValue placeholder={demographicsStrings.genderPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {genders.map((gender) => (
                      <SelectItem key={gender.id} value={String(gender.id)}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Field */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Calendar size={16} className="text-primary-600" />
                  {demographicsStrings.ageLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={ageGroupId} onValueChange={setAgeGroupId} required>
                  <SelectTrigger id="age" className="w-full border-2 border-primary-500-20 rounded-lg focus:border-primary-500 text-gray-900 dark:text-gray-900">
                    <SelectValue placeholder={demographicsStrings.agePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {ageGroups.map((group) => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ethnicity Field */}
              <div className="space-y-2">
                <Label htmlFor="ethnicity" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Globe size={16} className="text-primary-600" />
                  {demographicsStrings.ethnicityLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={ethnicityId} onValueChange={setEthnicityId} required>
                  <SelectTrigger id="ethnicity" className="w-full border-2 border-primary-500-20 rounded-lg focus:border-primary-500 text-gray-900 dark:text-gray-900">
                    <SelectValue placeholder={demographicsStrings.ethnicityPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
                    {ethnicities.map((ethnicity) => (
                      <SelectItem key={ethnicity.id} value={String(ethnicity.id)}>
                        {ethnicity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Political Party Field */}
              <div className="space-y-2">
                <Label htmlFor="party" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Flag size={16} className="text-primary-600" />
                  {demographicsStrings.politicsLabel} <span className="text-red-500">*</span>
                </Label>
                <Select value={politicalPartyId} onValueChange={setPoliticalPartyId} required>
                  <SelectTrigger id="party" className="w-full border-2 border-primary-500-20 rounded-lg focus:border-primary-500 text-gray-900 dark:text-gray-900">
                    <SelectValue placeholder={demographicsStrings.politicsPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-gray-900">
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
              className={`w-full font-semibold py-3 sm:py-3.5 min-h-[44px] rounded-lg transition-all text-sm sm:text-base ${
                isFormComplete && !isSubmitting
                  ? 'bg-gradient-poll-header text-white cursor-pointer hover:shadow-lg'
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

          {/* Privacy Footer */}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Why We Ask Modal */}
      {showWhyWeAsk && (
        <Dialog open={showWhyWeAsk} onOpenChange={setShowWhyWeAsk}>
          <DialogContent className="max-w-md p-6 sm:p-8 bg-white dark:bg-white">
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
              className="w-full btn-primary text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {demographicsStrings.whyModalClose}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
