import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Photo {
  id: string;
  url: string;
  alt: string;
}

interface PhotoManagerProps {
  title: string;
  description: string;
  initialPhotos: Photo[];
}

export function PhotoManager({ title, description, initialPhotos }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Em produção, aqui você faria o upload das imagens
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto: Photo = {
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            alt: file.name,
          };
          setPhotos((prev) => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  return (
    <Card className="border-amber-100">
      <CardHeader>
        <CardTitle className="text-amber-900">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100 border border-amber-100">
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {/* Upload button */}
          <label className="aspect-square rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100">
            <Upload className="w-6 h-6 text-amber-600 mb-2" />
            <span className="text-sm text-amber-700">Adicionar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
          Salvar Alterações
        </Button>
      </CardContent>
    </Card>
  );
}