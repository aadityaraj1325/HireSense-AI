import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Flame, Trophy, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ContributionHeatmap({ calendarData, onSelectDate, selectedDate }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const { days = [], currentStreak = 0, longestStreak = 0, totalActiveDays = 0 } = calendarData || {};

  // Build a lookup map by YYYY-MM-DD
  const daysMap = useMemo(() => {
    const map = new Map();
    for (const d of days) {
      map.set(d.date, d);
    }
    return map;
  }, [days]);

  // Generate 52 weeks of dates ending today
  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    // Start 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    // align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let current = new Date(startDate);
    let currentWeek = [];

    while (current <= today || currentWeek.length > 0) {
      const dateStr = current.toISOString().slice(0, 10);
      const isFuture = current > today;
      const data = daysMap.get(dateStr);
      const count = data?.count || 0;

      let level = 0;
      if (count > 0) {
        if (count === 1) level = 1;
        else if (count <= 3) level = 2;
        else if (count <= 6) level = 3;
        else level = 4;
      }

      currentWeek.push({
        date: dateStr,
        count,
        level,
        isFuture,
        platforms: data?.platforms || [],
        types: data?.types || {},
        dayOfWeek: current.getDay(),
      });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
      if (current > today && currentWeek.length === 0) break;
    }

    return result;
  }, [daysMap]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-[var(--accent)]" size={18} />
            Interactive Activity Heatmap
          </CardTitle>
          <CardDescription>
            365-day developer contribution intensity across all connected platforms & focus sessions
          </CardDescription>
        </div>

        {/* Streaks & Active Days */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone={currentStreak > 0 ? "success" : "neutral"} className="px-3 py-1.5 text-xs">
            <Flame size={13} className="text-orange-400" />
            <span className="font-semibold">{currentStreak}</span> Day Streak
          </Badge>
          <Badge tone="accent" className="px-3 py-1.5 text-xs">
            <Trophy size={13} />
            Best: <span className="font-semibold">{longestStreak}</span> Days
          </Badge>
          <Badge tone="neutral" className="px-3 py-1.5 text-xs">
            Total: <span className="font-semibold text-[var(--ink)]">{totalActiveDays}</span> Active Days
          </Badge>
        </div>
      </CardHeader>

      <div className="p-6 pt-2">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            {/* Month labels */}
            <div className="flex text-[11px] font-medium text-[var(--ink-muted)] mb-2 pl-7">
              {weeks.map((week, idx) => {
                const firstDay = new Date(week[0].date);
                if (firstDay.getDate() <= 7 && idx % 4 === 0) {
                  return (
                    <div key={idx} className="w-[14px] mr-[3px] text-left">
                      {MONTHS[firstDay.getMonth()]}
                    </div>
                  );
                }
                return <div key={idx} className="w-[14px] mr-[3px]" />;
              })}
            </div>

            {/* Week columns */}
            <div className="flex gap-[3px]">
              {/* Day labels (Sun, Tue, Thu, Sat) */}
              <div className="flex flex-col justify-between text-[9px] text-[var(--ink-muted)] pr-2 select-none h-[105px]">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Day cells */}
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    if (day.isFuture) {
                      return <div key={day.date} className="h-3 w-3 rounded-[3px] bg-transparent" />;
                    }

                    const isSelected = selectedDate === day.date;
                    const levelColors = [
                      "bg-[var(--surface-2)] border border-[var(--border)]/40 hover:border-[var(--accent)]",
                      "bg-emerald-900/60 border border-emerald-700/60",
                      "bg-emerald-600/80 border border-emerald-500",
                      "bg-emerald-500 border border-emerald-400",
                      "bg-[var(--accent)] border border-[var(--accent-strong)] shadow-[0_0_8px_rgba(137,117,232,0.4)]",
                    ];

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onSelectDate && onSelectDate(day.date === selectedDate ? null : day.date)}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={cn(
                          "h-3 w-3 rounded-[3px] transition-all duration-150 cursor-pointer focus:outline-none",
                          levelColors[day.level],
                          isSelected && "ring-2 ring-[var(--ink)] scale-125 z-10"
                        )}
                        title={`${day.date}: ${day.count} activities`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hover / Selection Status & Legend */}
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--ink-muted)]">
          <div className="min-h-[20px] flex items-center gap-2">
            {hoveredDay ? (
              <span>
                <strong className="text-[var(--ink)]">{hoveredDay.count} activities</strong> on{" "}
                <span className="font-mono text-[var(--ink)]">{hoveredDay.date}</span>
                {hoveredDay.platforms.length > 0 && (
                  <span className="ml-2 text-[11px] opacity-80">
                    via {hoveredDay.platforms.join(", ")}
                  </span>
                )}
              </span>
            ) : selectedDate ? (
              <span>
                Filtered by <strong className="text-[var(--accent)] font-mono">{selectedDate}</strong> (Click day again to clear)
              </span>
            ) : (
              <span>Hover over a cell or click a date to inspect specific activities.</span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[11px]">Less</span>
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--surface-2)] border border-[var(--border)]" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-900/60" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-600/80" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500" />
            <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--accent)]" />
            <span className="text-[11px]">More</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

