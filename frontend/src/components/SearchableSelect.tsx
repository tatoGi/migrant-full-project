"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
}

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  disabled = false,
  searchPlaceholder = "ძიება...",
  emptyText = "არაფერი მოიძებნა",
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setSearch("");
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;

    setOpen(next);

    if (next) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    setSearch("");
  };

  const triggerContent: ReactNode = (
    <>
      <span className="text-xs font-medium text-muted-foreground block mb-1">
        {label}
      </span>
      <div className="flex items-center justify-between w-full gap-2">
        <span
          className={cn(
            "text-sm truncate",
            value ? "text-foreground font-medium" : "text-muted-foreground/60"
          )}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </div>
    </>
  );

  if (!mounted) {
    return (
      <button
        disabled={disabled}
        type="button"
        className={cn(
          "w-full flex flex-col px-3 pb-2 pt-0 text-left group focus:outline-none",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        {triggerContent}
      </button>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex flex-col px-3 pb-2 pt-0 text-left group focus:outline-none",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {triggerContent}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] min-w-[220px]",
            "rounded-xl border border-border bg-popover text-popover-foreground shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "overflow-hidden"
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1">
            {/* Clear / any option */}
            <button
              onClick={() => handleSelect("")}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                !value ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="w-4 shrink-0 flex items-center justify-center">
                {!value && <Check className="h-3.5 w-3.5 text-primary" />}
              </span>
              <span className={!value ? "font-medium" : ""}>{placeholder}</span>
            </button>

            {/* Divider */}
            {filtered.length > 0 && (
              <div className="mx-2 my-1 h-px bg-border" />
            )}

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {emptyText}
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === opt ? "bg-accent/40 text-foreground" : "text-foreground/80"
                  )}
                >
                  <span className="w-4 shrink-0 flex items-center justify-center">
                    {value === opt && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </span>
                  <span className={value === opt ? "font-medium" : ""}>{opt}</span>
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default SearchableSelect;
