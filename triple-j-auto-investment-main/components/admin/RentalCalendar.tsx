/**
 * RentalCalendar - Monthly grid calendar for booking visualization
 *
 * Phase 06-03: Rental Management Admin UI
 *
 * Custom-built monthly calendar using Tailwind CSS grid-cols-7.
 * No third-party calendar libraries. Shows booking bars with status-based
 * coloring, month navigation, and click handlers for dates and bookings.
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { RentalBooking } from '../../types';

interface RentalCalendarProps {
  bookings: RentalBooking[];
  onDateClick?: (date: string) => void;
  onBookingClick?: (booking: RentalBooking) => void;
}

// Status color mapping for booking bars
const STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-blue-500/80',
  active: 'bg-emerald-500/80',
  overdue: 'bg-red-500/80',
  returned: 'bg-gray-500/50',
};

// Status text colors for badges
const STATUS_TEXT_COLORS: Record<string, string> = {
  reserved: 'text-blue-300',
  active: 'text-emerald-300',
  overdue: 'text-red-300',
  returned: 'text-gray-400',
};

const MAX_VISIBLE_BOOKINGS = 4;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a date as YYYY-MM-DD string
 */
function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of the week the month starts on (0=Sunday)
 */
function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const RentalCalendar: React.FC<RentalCalendarProps> = ({
  bookings,
  onDateClick,
  onBookingClick,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const todayString = toDateString(today.getFullYear(), today.getMonth(), today.getDate());

  // Navigate months
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Build a Map<dateString, RentalBooking[]> for O(1) lookup per cell
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, RentalBooking[]>();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);

    for (const booking of bookings) {
      // Skip cancelled bookings
      if (booking.status === 'cancelled') continue;

      // For each day of the visible month, check if booking overlaps
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = toDateString(currentYear, currentMonth, day);

        // Booking overlaps this day if startDate <= dateStr AND endDate > dateStr
        // (endDate is exclusive -- the car is returned on endDate, so it does not occupy that full day)
        // Actually per plan: endDate > thisDate means booking bar renders on endDate too
        // Let's use: startDate <= dateStr AND endDate >= dateStr for inclusive display
        if (booking.startDate <= dateStr && booking.endDate >= dateStr) {
          const existing = map.get(dateStr) || [];
          existing.push(booking);
          map.set(dateStr, existing);
        }
      }
    }

    return map;
  }, [bookings, currentYear, currentMonth]);

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  // Build array of cells: null for empty cells, number for day cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  // Pad remaining cells to complete the last row
  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push(null);
    }
  }

  return (
    <div className="bg-black/40 border border-gray-800 rounded-none">
      {/* Header: Month/Year with navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-tj-gold" />
          <h3 className="text-white font-display text-lg tracking-wider">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            className="p-1.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day labels row */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {DAY_LABELS.map(label => (
          <div
            key={label}
            className="p-2 text-center text-[10px] uppercase tracking-widest text-gray-500 font-bold"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-800/30">
        {cells.map((day, index) => {
          if (day === null) {
            // Empty cell
            return (
              <div
                key={`empty-${index}`}
                className="bg-black/60 min-h-[80px] md:min-h-[100px]"
              />
            );
          }

          const dateStr = toDateString(currentYear, currentMonth, day);
          const isToday = dateStr === todayString;
          const dayBookings = bookingsByDate.get(dateStr) || [];
          const visibleBookings = dayBookings.slice(0, MAX_VISIBLE_BOOKINGS);
          const overflowCount = dayBookings.length - MAX_VISIBLE_BOOKINGS;

          return (
            <div
              key={dateStr}
              className={`bg-black/40 min-h-[80px] md:min-h-[100px] p-1 cursor-pointer hover:bg-white/5 transition-colors relative ${
                isToday ? 'ring-1 ring-tj-gold ring-inset' : ''
              }`}
              onClick={() => onDateClick?.(dateStr)}
            >
              {/* Date number */}
              <div className={`text-xs font-mono mb-1 px-1 ${
                isToday
                  ? 'text-tj-gold font-bold'
                  : 'text-gray-400'
              }`}>
                {day}
              </div>

              {/* Booking bars */}
              <div className="space-y-0.5">
                {visibleBookings.map(booking => {
                  const isStart = booking.startDate === dateStr;
                  const isEnd = booking.endDate === dateStr;
                  const colorClass = STATUS_COLORS[booking.status] || 'bg-gray-500/50';

                  // Vehicle info for display
                  const vehicleLabel = booking.vehicle
                    ? `${booking.vehicle.make} ${booking.vehicle.model}`
                    : booking.vehicleId.slice(0, 8);

                  const customerName = booking.customer?.fullName || 'Unknown';

                  return (
                    <div
                      key={booking.id}
                      className={`${colorClass} px-1 py-0.5 text-[9px] text-white truncate cursor-pointer hover:brightness-125 transition-all ${
                        isStart && isEnd
                          ? 'rounded'
                          : isStart
                          ? 'rounded-l'
                          : isEnd
                          ? 'rounded-r'
                          : ''
                      } ${
                        booking.status === 'overdue' ? 'animate-pulse' : ''
                      }`}
                      title={`${customerName} - ${vehicleLabel} (${booking.status})`}
                      onClick={e => {
                        e.stopPropagation();
                        onBookingClick?.(booking);
                      }}
                    >
                      {vehicleLabel}
                    </div>
                  );
                })}

                {overflowCount > 0 && (
                  <div className="text-[9px] text-gray-500 px-1">
                    +{overflowCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 border-t border-gray-800">
        {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-2 ${colorClass} rounded-sm`} />
            <span className={`text-[9px] uppercase tracking-widest ${STATUS_TEXT_COLORS[status]}`}>
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalCalendar;
