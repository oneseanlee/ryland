import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useState } from "react";

export type DateRangePreset = "week" | "month" | "quarter" | "all";

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeFilterProps {
  value: DateRange | null;
  onChange: (range: DateRange | null, preset: DateRangePreset | null) => void;
  className?: string;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "all", label: "All Time" },
];

function getPresetRange(preset: DateRangePreset): DateRange | null {
  const now = new Date();
  
  switch (preset) {
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case "quarter":
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case "all":
      return null;
    default:
      return null;
  }
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<DateRangePreset | null>("month");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: value?.start,
    to: value?.end,
  });

  const handlePresetClick = (preset: DateRangePreset) => {
    setActivePreset(preset);
    const range = getPresetRange(preset);
    onChange(range, preset);
    if (range) {
      setDateRange({ from: range.start, to: range.end });
    } else {
      setDateRange({});
    }
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    if (range.from && range.to) {
      setActivePreset(null);
      onChange({ start: range.from, end: range.to }, null);
      setCalendarOpen(false);
    }
  };

  const displayText = value
    ? `${format(value.start, "MMM d, yyyy")} - ${format(value.end, "MMM d, yyyy")}`
    : "All Time";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={activePreset === preset.value ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              "text-xs h-7 px-3",
              activePreset === preset.value
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-2 text-xs border-slate-200",
              !activePreset && "border-slate-900 text-slate-900"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{displayText}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
