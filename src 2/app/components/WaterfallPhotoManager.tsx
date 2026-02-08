import { useState } from 'react';
import { Upload, X, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';

interface WaterfallPhoto {
  id: string;
  url: string;
  title: string;
}

export function WaterfallPhotoManager() {
  const [waterfalls, setWaterfalls] = useState<WaterfallPhoto[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1670526577750-c88141f56cc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXRlcmZhbGwlMjBuYXR1cmUlMjBicmF6aWx8ZW58MXx8fHwxNzcwNDI0MTE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cachoeira Loquinhas',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1723784037687-edb3a4959c22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHdhdGVyZmFsbCUyMGZvcmVzdHxlbnwxfHx8fDE3NzA0MjQxMTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cachoeira Almécegas',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1642869647567-756d4ae4ac63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmFsJTIwcG9vbCUyMHdhdGVyZmFsbHxlbnwxfHx8fDE3NzA0MjQxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cachoeira São Bento',
    },
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1551060880-be14732be9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXNjYWRpbmclMjB3YXRlcmZhbGwlMjByb2Nrc3xlbnwxfHx8fDE3NzA0MjQxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Cachoeira Raizama',
    },
  ]);

  const [editingWaterfall, setEditingWaterfall] = useState<WaterfallPhoto | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newWaterfall: WaterfallPhoto = {
          id: Math.random().toString(36).substr(2, 9),
          url: reader.result as string,
          title: 'Nova Cachoeira',
        };
        setWaterfalls((prev) => [...prev, newWaterfall]);
        toast.success('Foto adicionada! Não esqueça de editar o título.');
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const removeWaterfall = (id: string) => {
    setWaterfalls((prev) => prev.filter((w) => w.id !== id));
    toast.success('Foto removida');
  };

  const startEdit = (waterfall: WaterfallPhoto) => {
    setEditingWaterfall(waterfall);
    setEditTitle(waterfall.title);
  };

  const saveEdit = () => {
    if (!editingWaterfall) return;
    
    setWaterfalls((prev) =>
      prev.map((w) =>
        w.id === editingWaterfall.id ? { ...w, title: editTitle } : w
      )
    );
    setEditingWaterfall(null);
    toast.success('Título atualizado');
  };

  return (
    <Card className="border-amber-100">
      <CardHeader>
        <CardTitle className="text-amber-900">Fotos das Cachoeiras</CardTitle>
        <CardDescription>Gerencie as fotos das cachoeiras próximas com seus respectivos títulos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {waterfalls.map((waterfall) => (
            <div key={waterfall.id} className="relative group rounded-lg overflow-hidden bg-slate-100 border border-amber-100">
              <div className="aspect-video relative">
                <img
                  src={waterfall.url}
                  alt={waterfall.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => startEdit(waterfall)}
                        className="bg-amber-600 text-white rounded-full p-1.5 hover:bg-amber-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-amber-900">Editar Título da Cachoeira</DialogTitle>
                        <DialogDescription>
                          Altere o nome da cachoeira que aparecerá no site
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Título</Label>
                          <Input
                            id="title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Nome da cachoeira"
                          />
                        </div>
                        <Button
                          onClick={saveEdit}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          Salvar Título
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => removeWaterfall(waterfall.id)}
                    className="bg-rose-500 text-white rounded-full p-1.5 hover:bg-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-white">
                <h4 className="text-sm text-amber-900 truncate">{waterfall.title}</h4>
              </div>
            </div>
          ))}
          
          {/* Upload button */}
          <label className="aspect-video rounded-lg border-2 border-dashed border-amber-300 hover:border-amber-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-amber-50 hover:bg-amber-100">
            <Upload className="w-6 h-6 text-amber-600 mb-2" />
            <span className="text-sm text-amber-700">Adicionar Cachoeira</span>
            <input
              type="file"
              accept="image/*"
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
