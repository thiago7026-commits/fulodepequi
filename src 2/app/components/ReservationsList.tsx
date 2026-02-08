import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, User, Phone, Mail, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalValue: number;
}

export function ReservationsList() {
  const [reservations] = useState<Reservation[]>([
    {
      id: '1',
      guestName: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(61) 98765-4321',
      checkIn: new Date(2026, 1, 15),
      checkOut: new Date(2026, 1, 18),
      guests: 4,
      status: 'confirmed',
      totalValue: 1050,
    },
    {
      id: '2',
      guestName: 'João Santos',
      email: 'joao.santos@email.com',
      phone: '(62) 99876-5432',
      checkIn: new Date(2026, 1, 20),
      checkOut: new Date(2026, 1, 25),
      guests: 2,
      status: 'pending',
      totalValue: 1750,
    },
    {
      id: '3',
      guestName: 'Ana Costa',
      email: 'ana.costa@email.com',
      phone: '(11) 91234-5678',
      checkIn: new Date(2026, 2, 5),
      checkOut: new Date(2026, 2, 10),
      guests: 6,
      status: 'confirmed',
      totalValue: 1750,
    },
  ]);

  const getStatusBadge = (status: Reservation['status']) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
      confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
    };

    return statusConfig[status];
  };

  return (
    <Card className="border-amber-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-amber-900">Próximas Reservas</CardTitle>
        <CardDescription>Gerencie as reservas confirmadas e pendentes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reservations.map((reservation) => {
            const statusBadge = getStatusBadge(reservation.status);
            
            return (
              <div
                key={reservation.id}
                className="border border-amber-100 rounded-lg p-4 hover:bg-amber-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-amber-900 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {reservation.guestName}
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {reservation.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reservation.phone}
                          </span>
                        </div>
                      </div>
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>
                          {format(reservation.checkIn, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                          {format(reservation.checkOut, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium">{reservation.guests}</span> hóspedes
                      </div>
                      <div className="text-amber-700">
                        <span className="font-medium">R$ {reservation.totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-1" />
                          Recusar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Mensagem
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
