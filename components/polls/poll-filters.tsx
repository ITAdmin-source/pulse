"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface PollFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function PollFilters({
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: PollFiltersProps) {
  return (
    <section className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("active")}
        >
          פעיל
        </Button>
        <Button
          variant={statusFilter === "closed" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("closed")}
        >
          סגור
        </Button>
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange("all")}
        >
          הכל
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="חפש סקרים..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="ps-10"
          />
        </div>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="מיון לפי" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">הכי חדש</SelectItem>
            <SelectItem value="popular">הכי פופולרי</SelectItem>
            <SelectItem value="ending">מסתיים בקרוב</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
