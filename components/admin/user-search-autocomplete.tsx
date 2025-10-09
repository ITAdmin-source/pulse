"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Search } from "lucide-react";
import { searchUsersAction } from "@/actions/users-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserSearchResult {
  id: string;
  clerkUserId?: string;
  email?: string;
  displayName?: string;
  currentRoles: Array<{ role: string; pollId?: string }>;
}

interface UserSearchAutocompleteProps {
  onUserSelect: (user: UserSearchResult) => void;
  excludeUserIds?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function UserSearchAutocomplete({
  onUserSelect,
  excludeUserIds = [],
  placeholder = "Search by email or name...",
  disabled = false,
}: UserSearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchUsersAction(query.trim());
        if (response.success && response.data) {
          // Filter out excluded users
          const filtered = response.data.filter(
            (user) => !excludeUserIds.includes(user.id)
          );
          setResults(filtered);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, excludeUserIds]);

  const handleSelect = useCallback(
    (user: UserSearchResult) => {
      setSelectedUser(user);
      setOpen(false);
      setQuery("");
      setResults([]);
      onUserSelect(user);
    },
    [onUserSelect]
  );

  const handleClear = useCallback(() => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
  }, []);

  // If a user is selected, show their info instead of search input
  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedUser.displayName || "Unknown User"}
          </p>
          {selectedUser.email && (
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {selectedUser.email}
            </p>
          )}
          {selectedUser.currentRoles.length > 0 && (
            <div className="flex gap-1 mt-1">
              {selectedUser.currentRoles.slice(0, 2).map((role, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100"
                >
                  {role.role}
                </span>
              ))}
              {selectedUser.currentRoles.length > 2 && (
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  +{selectedUser.currentRoles.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            disabled={disabled}
            className="ps-9"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command>
          <CommandList>
            {isSearching && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!isSearching && query.trim().length < 2 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
            {!isSearching && query.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            {!isSearching && results.length > 0 && (
              <CommandGroup>
                {results.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelect(user)}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.displayName || "Unknown User"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                      {user.clerkUserId && (
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {user.clerkUserId.substring(0, 20)}...
                        </p>
                      )}
                      {user.currentRoles.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {user.currentRoles.slice(0, 3).map((role, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
                            >
                              {role.role}
                            </span>
                          ))}
                          {user.currentRoles.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{user.currentRoles.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Check className="h-4 w-4 opacity-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
