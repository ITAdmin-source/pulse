"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Filter } from "lucide-react";
import type { DemographicAttribute } from "@/db/queries/demographic-analytics-queries";

interface HeatmapControlsProps {
  selectedAttribute: DemographicAttribute;
  onAttributeChange: (attribute: DemographicAttribute) => void;
  sortBy: 'type' | 'alphabetical';
  onSortChange: (sort: 'type' | 'alphabetical') => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
}

const ATTRIBUTES: Array<{ value: DemographicAttribute; label: string }> = [
  { value: 'gender', label: 'מגדר' },
  { value: 'ageGroup', label: 'קבוצת גיל' },
  { value: 'ethnicity', label: 'מוצא אתני' },
  { value: 'politicalParty', label: 'השתייכות פוליטית' },
];

const CLASSIFICATION_TYPES = [
  { value: 'consensus', label: '✓ קונצנזוס', color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' },
  { value: 'partial', label: '⚠ חלקי', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
  { value: 'split', label: '⚡ מפוצל', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  { value: 'divisive', label: '❌ שנוי במחלוקת', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
];

export function HeatmapControls({
  selectedAttribute,
  onAttributeChange,
  sortBy,
  onSortChange,
  selectedTypes,
  onTypesChange,
}: HeatmapControlsProps) {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const toggleAllTypes = () => {
    if (selectedTypes.length === CLASSIFICATION_TYPES.length) {
      onTypesChange([]);
    } else {
      onTypesChange(CLASSIFICATION_TYPES.map(t => t.value));
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Main Controls Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        {/* Attribute Selector */}
        <div className="flex-1 w-full sm:w-auto">
          <Label htmlFor="attribute-select" className="text-sm font-medium mb-2 block">
            הצג לפי:
          </Label>
          <Select value={selectedAttribute} onValueChange={(value) => onAttributeChange(value as DemographicAttribute)}>
            <SelectTrigger id="attribute-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTRIBUTES.map((attr) => (
                <SelectItem key={attr.value} value={attr.value}>
                  {attr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Toggle */}
        <div className="flex-1 w-full sm:w-auto">
          <Label className="text-sm font-medium mb-2 block">
            מיון:
          </Label>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'type' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('type')}
              className="flex-1 sm:flex-initial"
            >
              <ArrowUpDown className="h-4 w-4 me-2" />
              לפי סוג
            </Button>
            <Button
              variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('alphabetical')}
              className="flex-1 sm:flex-initial"
            >
              <ArrowUpDown className="h-4 w-4 me-2" />
              אלפביתי
            </Button>
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            סנן לפי סוג:
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAllTypes}
            className="text-xs"
          >
            {selectedTypes.length === CLASSIFICATION_TYPES.length ? 'בטל הכל' : 'בחר הכל'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CLASSIFICATION_TYPES.map((type) => (
            <Button
              key={type.value}
              variant="outline"
              size="sm"
              onClick={() => toggleType(type.value)}
              className={`${selectedTypes.includes(type.value) ? type.color : 'bg-white hover:bg-gray-50'} border transition-colors`}
            >
              {type.label}
            </Button>
          ))}
        </div>
        {selectedTypes.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠ לא נבחרו סוגים - לא יוצגו הצהרות
          </p>
        )}
      </div>
    </div>
  );
}
