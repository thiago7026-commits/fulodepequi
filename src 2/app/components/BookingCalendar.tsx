import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface BookingCalendarProps {
  blockedDates: Date[];
  onDateClick: (date: Date) => void;
}

export function BookingCalendar({ blockedDates, onDateClick }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isBlocked = (date: Date) => {
    return blockedDates.some((blockedDate) => isSameDay(blockedDate, date));
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="bg-white rounded-lg border border-amber-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg text-amber-900">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="h-8 w-8 p-0 border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0 border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div
            key={day}
            className="text-center text-sm text-amber-800 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const blocked = isBlocked(day);
          const past = isPast(day);
          const outsideMonth = !isSameMonth(day, currentMonth);

          return (
            <button
              key={idx}
              onClick={() => !past && onDateClick(day)}
              disabled={past}
              className={cn(
                'aspect-square p-2 text-sm rounded-lg transition-all hover:border-amber-300',
                'border border-transparent',
                outsideMonth && 'text-slate-300',
                !outsideMonth && !blocked && !past && 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
                !outsideMonth && blocked && !past && 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100',
                past && 'opacity-40 cursor-not-allowed'
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-6 pt-4 border-t border-amber-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span className="text-sm text-slate-600">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-rose-50 border border-rose-300 rounded"></div>
          <span className="text-sm text-slate-600">Bloqueado</span>
        </div>
      </div>
    </div>
  );
}