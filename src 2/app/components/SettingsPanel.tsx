import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { toast } from 'sonner';

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    chaleName: 'Chalé Fulô de Pequi',
    address: 'Chapada dos Veadeiros - Alto Paraíso de Goiás, GO',
    phone: '(62) 99999-9999',
    email: 'contato@fulodepequi.com.br',
    description: 'Um refúgio acolhedor na natureza, perfeito para relaxar e se reconectar.',
    capacity: 8,
    minNights: 2,
    maxNights: 30,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    instantBooking: true,
    allowPets: true,
    allowSmoking: false,
    allowEvents: false,
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Informações Básicas */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Informações Básicas</CardTitle>
          <CardDescription>Dados principais do chalé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chaleName">Nome do Chalé</Label>
            <Input
              id="chaleName"
              value={settings.chaleName}
              onChange={(e) => setSettings({ ...settings, chaleName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Capacidade e Horários */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Capacidade e Horários</CardTitle>
          <CardDescription>Defina limites e horários de check-in/out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidade máxima de hóspedes</Label>
            <Input
              id="capacity"
              type="number"
              value={settings.capacity}
              onChange={(e) => setSettings({ ...settings, capacity: parseInt(e.target.value) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minNights">Mínimo de noites</Label>
              <Input
                id="minNights"
                type="number"
                value={settings.minNights}
                onChange={(e) => setSettings({ ...settings, minNights: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxNights">Máximo de noites</Label>
              <Input
                id="maxNights"
                type="number"
                value={settings.maxNights}
                onChange={(e) => setSettings({ ...settings, maxNights: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Horário de Check-in</Label>
              <Input
                id="checkInTime"
                type="time"
                value={settings.checkInTime}
                onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Horário de Check-out</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={settings.checkOutTime}
                onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Políticas */}
      <Card className="border-amber-100 shadow-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-amber-900">Políticas do Chalé</CardTitle>
          <CardDescription>Defina as regras e políticas da hospedagem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border border-amber-100 rounded-lg">
              <div>
                <h4 className="text-amber-900 mb-1">Reserva Instantânea</h4>
                <p className="text-sm text-slate-600">Permitir reservas sem aprovação prévia</p>
              </div>
              <Switch
                checked={settings.instantBooking}
                onCheckedChange={(checked) => setSettings({ ...settings, instantBooking: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-amber-100 rounded-lg">
              <div>
                <h4 className="text-amber-900 mb-1">Aceita Pets</h4>
                <p className="text-sm text-slate-600">Permitir animais de estimação</p>
              </div>
              <Switch
                checked={settings.allowPets}
                onCheckedChange={(checked) => setSettings({ ...settings, allowPets: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-amber-100 rounded-lg">
              <div>
                <h4 className="text-amber-900 mb-1">Permite Fumar</h4>
                <p className="text-sm text-slate-600">Permitir fumar nas áreas do chalé</p>
              </div>
              <Switch
                checked={settings.allowSmoking}
                onCheckedChange={(checked) => setSettings({ ...settings, allowSmoking: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-amber-100 rounded-lg">
              <div>
                <h4 className="text-amber-900 mb-1">Permite Eventos</h4>
                <p className="text-sm text-slate-600">Permitir festas e eventos</p>
              </div>
              <Switch
                checked={settings.allowEvents}
                onCheckedChange={(checked) => setSettings({ ...settings, allowEvents: checked })}
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleSave} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
              Salvar Todas as Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
