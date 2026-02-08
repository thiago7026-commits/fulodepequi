import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addDays } from 'date-fns';
import { LogOut, DollarSign, Calendar, Image, Users, Star, Settings, BarChart } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BookingCalendar } from './BookingCalendar';
import { AdvancedBookingCalendar } from './AdvancedBookingCalendar';
import { PhotoManager } from './PhotoManager';
import { WaterfallPhotoManager } from './WaterfallPhotoManager';
import { CarouselPhotoManager } from './CarouselPhotoManager';
import { ReservationsList } from './ReservationsList';
import { ReviewsSection } from './ReviewsSection';
import { StatisticsCharts } from './StatisticsCharts';
import { SettingsPanel } from './SettingsPanel';
import { toast } from 'sonner';
import logo from '@/assets/28e5b98a8efd3ddfcf6d35c285881cd9cf6c583f.png';

export function DashboardPage() {
  const navigate = useNavigate();
  const [dailyRate, setDailyRate] = useState('350');
  const [activeTab, setActiveTab] = useState('visao-geral');
  
  // Datas bloqueadas de exemplo
  const [blockedDates, setBlockedDates] = useState<Date[]>([
    addDays(new Date(), 5),
    addDays(new Date(), 6),
    addDays(new Date(), 7),
    addDays(new Date(), 12),
    addDays(new Date(), 13),
    addDays(new Date(), 20),
    addDays(new Date(), 21),
    addDays(new Date(), 22),
  ]);

  // Fotos de exemplo para a seção principal
  const mainPhotos = [
    { id: '1', url: 'https://images.unsplash.com/photo-1762195804027-04a19d9d3ab6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB2YWNhdGlvbiUyMHJlbnRhbCUyMHByb3BlcnR5fGVufDF8fHx8MTc3MDI1MTQ1Nnww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Imagem principal 1' },
    { id: '2', url: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcwMTc1MzEwfDA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Imagem principal 2' },
    { id: '3', url: 'https://images.unsplash.com/photo-1662811368049-c2861287ffc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2YWNhdGlvbiUyMGhvbWUlMjBwb29sfGVufDF8fHx8MTc3MDI1MTQ1N3ww&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Imagem principal 3' },
  ];

  // Fotos de destaque
  const highlightPhotos = [
    { id: '4', url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbXxlbnwxfHx8fDE3NzAyMDc4NDl8MA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Destaque 1' },
    { id: '5', url: 'https://images.unsplash.com/photo-1631810064975-21382c4ecfbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGhvdXNlJTIwZXh0ZXJpb3J8ZW58MXx8fHwxNzcwMjEzMTI3fDA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Destaque 2' },
    { id: '6', url: 'https://images.unsplash.com/photo-1610177534644-34d881503b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcwMTQ2Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080', alt: 'Destaque 3' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  const handleDateClick = (date: Date) => {
    setBlockedDates((prev) => {
      const isBlocked = prev.some((d) => d.getTime() === date.getTime());
      if (isBlocked) {
        toast.success('Data desbloqueada com sucesso');
        return prev.filter((d) => d.getTime() !== date.getTime());
      } else {
        toast.success('Data bloqueada com sucesso');
        return [...prev, date];
      }
    });
  };

  const handleSaveDailyRate = () => {
    toast.success(`Valor da diária atualizado para R$ ${dailyRate}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Fulô de Pequi" className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl text-amber-900">Chalé Fulô de Pequi</h1>
                <p className="text-sm text-amber-700">Painel Administrativo</p>
              </div>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="border-amber-300 text-amber-700 hover:bg-amber-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-white p-2 border border-amber-100">
            <TabsTrigger value="visao-geral" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <BarChart className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="reservas" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="calendario" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="fotos" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Image className="w-4 h-4 mr-2" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Star className="w-4 h-4 mr-2" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral Tab */}
          <TabsContent value="visao-geral" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-amber-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-amber-900">Valor da Diária</CardTitle>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-amber-900">R$ {dailyRate}</div>
                </CardContent>
              </Card>
              <Card className="border-amber-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-amber-900">Dias Bloqueados</CardTitle>
                  <Calendar className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-amber-900">{blockedDates.length}</div>
                </CardContent>
              </Card>
              <Card className="border-amber-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-amber-900">Total de Fotos</CardTitle>
                  <Image className="w-4 h-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-amber-900">{mainPhotos.length + highlightPhotos.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics Charts */}
            <StatisticsCharts />

            {/* Daily Rate Section */}
            <Card className="border-amber-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-amber-900">Valor da Diária</CardTitle>
                <CardDescription>
                  Configure o valor cobrado por noite de hospedagem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyRate">Valor (R$)</Label>
                  <div className="flex gap-3">
                    <Input
                      id="dailyRate"
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      placeholder="350"
                      className="max-w-xs"
                    />
                    <Button onClick={handleSaveDailyRate} className="bg-amber-500 hover:bg-amber-600 text-white">
                      Salvar Valor
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservas Tab */}
          <TabsContent value="reservas" className="space-y-6">
            <ReservationsList />
          </TabsContent>

          {/* Calendário Tab */}
          <TabsContent value="calendario" className="space-y-6">
            <div>
              <div className="mb-4">
                <h2 className="text-xl mb-1 text-amber-900">Calendário de Reservas</h2>
                <p className="text-sm text-amber-700">
                  Clique em uma data para ver detalhes ou bloquear para manutenção
                </p>
              </div>
              <AdvancedBookingCalendar dailyRate={parseFloat(dailyRate)} />
            </div>
          </TabsContent>

          {/* Fotos Tab */}
          <TabsContent value="fotos" className="space-y-6">
            <PhotoManager
              title="Fotos Iniciais"
              description="Imagens que aparecem no topo da página inicial"
              initialPhotos={mainPhotos}
            />
            
            <WaterfallPhotoManager />
            
            <CarouselPhotoManager />
          </TabsContent>

          {/* Avaliações Tab */}
          <TabsContent value="avaliacoes" className="space-y-6">
            <ReviewsSection />
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="configuracoes" className="space-y-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}