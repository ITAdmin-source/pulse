"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Users2, Globe, Flag } from "lucide-react";

export type DemographicCategory = "ageGroup" | "gender" | "ethnicity" | "politicalParty" | "all";

interface DemographicFiltersProps {
  selectedCategory: DemographicCategory;
  onCategoryChange: (category: DemographicCategory) => void;
  showAllOption?: boolean;
}

export function DemographicFilters({
  selectedCategory,
  onCategoryChange,
  showAllOption = true,
}: DemographicFiltersProps) {
  const categories: Array<{
    id: DemographicCategory;
    label: string;
    icon: React.ReactNode;
  }> = [
    ...(showAllOption ? [{ id: "all" as const, label: "הכל", icon: <Users className="h-4 w-4" /> }] : []),
    { id: "ageGroup" as const, label: "קבוצת גיל", icon: <Users className="h-4 w-4" /> },
    { id: "gender" as const, label: "מגדר", icon: <Users2 className="h-4 w-4" /> },
    { id: "ethnicity" as const, label: "מוצא אתני", icon: <Globe className="h-4 w-4" /> },
    { id: "politicalParty" as const, label: "השתייכות פוליטית", icon: <Flag className="h-4 w-4" /> },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center gap-2"
            >
              {category.icon}
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
