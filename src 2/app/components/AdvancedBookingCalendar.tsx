import { useState } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';

interface Guest {
  name: string;
  avatar: string;
  additionalGuests?: number;
}

interface Reservation {
  id: string;
  startDate: Date;
  endDate: Date;
  guest: Guest;
  price: number;
}

interface AdvancedBookingCalendarProps {
  dailyRate: number;
}

export function AdvancedBookingCalendar({ dailyRate }: AdvancedBookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Date[]>([
    addDays(new Date(), 25),
    addDays(new Date(), 26),
  ]);

  const [reservations] = useState<Reservation[]>([
    {
      id: '1',
      startDate: addDays(new Date(), 3),
      endDate: addDays(new Date(), 3),
      guest: {
        name: 'Arlyson',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        additionalGuests: 1,
      },
      price: dailyRate,
    },
    {
      id: '2',
      startDate: addDays(new Date(), 14),
      endDate: addDays(new Date(), 17),
      guest: {
        name: 'Ricardo',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        additionalGuests: 0,
      },
      price: dailyRate,
    },
    {
      id: '3',
      startDate: addDays(new Date(), 15),
      endDate: addDays(new Date(), 17),
      guest: {
        name: 'Thiago',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        additionalGuests: 1,
      },
      price: dailyRate,
    },
  ]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isBlocked = (date: Date) => {
    return blockedDates.some((blockedDate) => isSameDay(blockedDate, date));
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getReservationsForDay = (date: Date) => {
    return reservations.filter((reservation) => {
      return isSameDay(date, reservation.startDate) || 
             (date >= reservation.startDate && date <= reservation.endDate);
    });
  };

  const isReserved = (date: Date) => {
    return getReservationsForDay(date).length > 0;
  };

  const toggleBlockDate = (date: Date) => {
    if (isPast(date) || isReserved(date)) {
      toast.error('Não é possível bloquear esta data');
      return;
    }

    setBlockedDates((prev) => {
      const blocked = prev.some((d) => isSameDay(d, date));
      if (blocked) {
        toast.success('Data desbloqueada');
        return prev.filter((d) => !isSameDay(d, date));
      } else {
        toast.success('Data bloqueada para manutenção');
        return [...prev, date];
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-amber-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl text-amber-900">
          {format(currentMonth, 'MMMM', { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="h-9 w-9 p-0 border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-9 w-9 p-0 border-amber-200 hover:bg-amber-50 hover:text-amber-900"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map((day) => (
          <div
            key={day}
            className="text-center text-sm text-amber-800 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const blocked = isBlocked(day);
          const past = isPast(day);
          const outsideMonth = !isSameMonth(day, currentMonth);
          const reserved = isReserved(day);
          const dayReservations = getReservationsForDay(day);
          const isCheckInDay = dayReservations.some(r => isSameDay(day, r.startDate));

          return (
            <Dialog key={idx}>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    'relative min-h-[80px] p-2 text-left rounded-lg transition-all border',
                    'hover:border-amber-300 hover:shadow-sm',
                    outsideMonth && 'opacity-40',
                    !reserved && !blocked && !past && 'border-slate-200 bg-white',
                    blocked && 'border-red-300 bg-red-50',
                    reserved && 'border-amber-200 bg-amber-50',
                    past && 'cursor-not-allowed'
                  )}
                >
                  {/* Day number */}
                  <div className={cn(
                    'text-sm mb-1',
                    reserved ? 'text-amber-900' : 'text-slate-700',
                    past && 'text-slate-400'
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Price */}
                  {!outsideMonth && !past && !blocked && !reserved && (
                    <div className="text-xs text-slate-600">
                      R${dailyRate}
                    </div>
                  )}

                  {/* Blocked indicator */}
                  {blocked && !outsideMonth && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado</span>
                    </div>
                  )}

                  {/* Guest avatars - only show on check-in day */}
                  {isCheckInDay && !outsideMonth && (
                    <div className="flex items-center gap-1 mt-2">
                      {dayReservations.map((reservation, resIdx) => (
                        <div
                          key={reservation.id}
                          className="flex items-center gap-1 bg-slate-900 text-white text-xs px-2 py-1 rounded-full"
                        >
                          <img
                            src={reservation.guest.avatar}
                            alt={reservation.guest.name}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="truncate max-w-[60px]">
                            {reservation.guest.name}
                          </span>
                          {reservation.guest.additionalGuests ? (
                            <span>+{reservation.guest.additionalGuests}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              </DialogTrigger>
              
              {/* Dialog for day details */}
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-amber-900">
                    {format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </DialogTitle>
                  <DialogDescription>
                    {reserved && 'Esta data possui reservas'}
                    {blocked && !reserved && 'Data bloqueada para manutenção'}
                    {!reserved && !blocked && !past && 'Data disponível'}
                    {past && 'Data passada'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Reservations info */}
                  {dayReservations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm text-amber-900">Reservas:</h4>
                      {dayReservations.map((reservation) => (
                        <div key={reservation.id} className="flex items-center gap-3 p-3 border border-amber-100 rounded-lg">
                          <img
                            src={reservation.guest.avatar}
                            alt={reservation.guest.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-sm text-amber-900">
                              {reservation.guest.name}
                              {reservation.guest.additionalGuests ? ` +${reservation.guest.additionalGuests}` : ''}
                            </p>
                            <p className="text-xs text-slate-600">
                              {format(reservation.startDate, 'dd/MM', { locale: ptBR })} - {format(reservation.endDate, 'dd/MM', { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-sm text-amber-700">
                            R${reservation.price}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Block/Unblock button */}
                  {!past && !reserved && (
                    <Button
                      onClick={() => toggleBlockDate(day)}
                      className={cn(
                        'w-full',
                        blocked 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-amber-500 hover:bg-amber-600'
                      )}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {blocked ? 'Desbloquear Data' : 'Bloquear para Manutenção'}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-amber-100 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
          <span className="text-slate-600">Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
          <span className="text-slate-600">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
          <span className="text-slate-600">Bloqueado</span>
        </div>
      </div>
    </div>
  );
}