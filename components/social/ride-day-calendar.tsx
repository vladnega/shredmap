'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  compareIsoDateStrings,
  formatLocalCalendarDay,
} from '@/lib/date/local-calendar-day';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function buildMonthGrid(year: number, monthIndex: number): (number | null)[][] {
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= dim; d++) {
    cells.push(d);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function useViewMonthSyncedToYmd(ymd: string) {
  const selected = new Date(
    Number(ymd.slice(0, 4)),
    Number(ymd.slice(5, 7)) - 1,
    Number(ymd.slice(8, 10)),
  );
  const [viewMonth, setViewMonth] = React.useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  React.useEffect(() => {
    setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [ymd]);

  return [viewMonth, setViewMonth] as const;
}

type RideDayCalendarProps = {
  /** Selected calendar day (YYYY-MM-DD). */
  value: string;
  onChange: (next: string) => void;
  /** Inclusive minimum selectable day (YYYY-MM-DD). */
  minDate: string;
};

export function RideDayCalendar({ value, onChange, minDate }: RideDayCalendarProps) {
  const [viewMonth, setViewMonth] = useViewMonthSyncedToYmd(value);

  const grid = buildMonthGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  function goPrevMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const todayYmd = formatLocalCalendarDay(new Date());

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
          onClick={goPrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-0 truncate text-center text-sm font-semibold text-white">
          {monthLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
          onClick={goNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {WEEKDAY_LABELS.map((d, idx) => (
          <div key={`${d}-${idx}`} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.flatMap((week, wi) =>
          week.map((day, di) => {
            if (day == null) {
              return (
                <div
                  key={`e-${wi}-${di}`}
                  className="aspect-square"
                />
              );
            }
            const ymd = formatLocalCalendarDay(
              new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day),
            );
            const disabled = compareIsoDateStrings(ymd, minDate) < 0;
            const isSelected = ymd === value;
            const isToday = ymd === todayYmd;

            return (
              <button
                key={ymd}
                type="button"
                disabled={disabled}
                onClick={() => onChange(ymd)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  disabled && 'cursor-not-allowed text-zinc-700',
                  !disabled && !isSelected && 'text-zinc-200 hover:bg-zinc-800',
                  isSelected &&
                    'bg-orange-600 text-white shadow-md shadow-orange-900/40 hover:bg-orange-500',
                  !isSelected && isToday && !disabled && 'ring-1 ring-orange-500/50',
                )}
              >
                {day}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
