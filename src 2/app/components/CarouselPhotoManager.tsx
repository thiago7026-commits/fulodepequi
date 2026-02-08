import { useState } from 'react';
import { Upload, X, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface CarouselPhoto {
  id: string;
  url: string;
  alt: string;
}

export function CarouselPhotoManager() {
  const [photos, setPhotos] = useState<CarouselPhoto[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB2YWNhdGlvbiUyMHJlbnRhbCUyMHByb3BlcnR5fGVufDF8fHx8MTc3MDI1MTQ1Nnww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Slide 1' },
    { id: '2', url: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcwMTc1MzEwfDA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Slide 2' },
    { id: '3', url: 'https://images.unsplash.com/photo-1662811368049-c2861287ffc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YWNhdGlvbiUyMGhvbWUlMjBwb29sfGVufDF8fHx8MTc3MDI1MTQ1N3ww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Slide 3' },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto: CarouselPhoto = {
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            alt: file.name,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      });
      toast.success('Foto(s) adicionada(s) ao carrossel');
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
    toast.success('Foto removida do carrossel');
  };

  return (
    <Card className="border-amber-100">
      <CardHeader>
        <CardTitle className="text-amber-900">Carrossel Acima do Rodapé</CardTitle>
        <CardDescription>Imagens que aparecem no carrossel antes do rodapé do site</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="flex items-center gap-3 p-3 border border-amber-100 rounded-lg hover:bg-amber-50 transition-colors group"
            >
              <div className="cursor-move text-slate-400 hover:text-amber-600">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="w-20 h-14 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-900">Slide {index + 1}</p>
                <p className="text-xs text-slate-600">{photo.alt}</p>
              </div>
              <button
                onClick={() => removePhoto(photo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-500 text-white rounded-full p-2 hover:bg-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-400 cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100 mb-4">
          <Upload className="w-5 h-5 text-amber-600" />
          <span className="text-sm text-amber-700">Adicionar Fotos ao Carrossel</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
}
