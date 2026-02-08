import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Star, ThumbsUp, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Review {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  date: Date;
  visible: boolean;
  helpful: number;
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      guestName: 'Maria Silva',
      rating: 5,
      comment: 'Lugar maravilhoso! O chalé é aconchegante, limpo e muito bem decorado. A anfitriã foi super atenciosa. Voltaremos com certeza!',
      date: new Date(2026, 0, 20),
      visible: true,
      helpful: 12,
    },
    {
      id: '2',
      guestName: 'Carlos Mendes',
      rating: 5,
      comment: 'Experiência incrível! O chalé superou nossas expectativas. A localização é perfeita, perto de tudo mas com muita tranquilidade.',
      date: new Date(2026, 0, 15),
      visible: true,
      helpful: 8,
    },
    {
      id: '3',
      guestName: 'Fernanda Costa',
      rating: 4,
      comment: 'Ótima estadia! Chalé confortável e bem equipado. Apenas a churrasqueira poderia estar em melhor estado.',
      date: new Date(2026, 0, 10),
      visible: true,
      helpful: 5,
    },
    {
      id: '4',
      guestName: 'Roberto Lima',
      rating: 5,
      comment: 'Simplesmente perfeito! Lugar ideal para relaxar e curtir com a família. Todas as comodidades necessárias disponíveis.',
      date: new Date(2025, 11, 28),
      visible: true,
      helpful: 15,
    },
  ]);

  const toggleVisibility = (id: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === id ? { ...review, visible: !review.visible } : review
      )
    );
    toast.success('Visibilidade da avaliação atualizada');
  };

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-amber-100 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-amber-900">Avaliações dos Hóspedes</CardTitle>
            <CardDescription>Gerencie as avaliações recebidas</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl text-amber-900">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-slate-600">{reviews.length} avaliações</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`border border-amber-100 rounded-lg p-4 transition-all ${
                !review.visible ? 'opacity-60 bg-slate-50' : 'hover:bg-amber-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-amber-900">{review.guestName}</h4>
                    {!review.visible && (
                      <Badge variant="outline" className="text-xs">
                        Oculta
                      </Badge>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-slate-500">
                  {format(review.date, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>

              <p className="text-slate-700 mb-3">{review.comment}</p>

              <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.helpful} pessoas acharam útil</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleVisibility(review.id)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  {review.visible ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Mostrar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
