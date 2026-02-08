import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const monthlyData = [
  { month: 'Jan', reservas: 12, receita: 4200 },
  { month: 'Fev', reservas: 15, receita: 5250 },
  { month: 'Mar', reservas: 10, receita: 3500 },
  { month: 'Abr', reservas: 18, receita: 6300 },
  { month: 'Mai', reservas: 14, receita: 4900 },
  { month: 'Jun', reservas: 20, receita: 7000 },
];

const occupancyData = [
  { name: 'Ocupado', value: 65 },
  { name: 'Disponível', value: 35 },
];

const guestOriginData = [
  { origin: 'Brasília', guests: 35 },
  { origin: 'Goiânia', guests: 28 },
  { origin: 'São Paulo', guests: 20 },
  { origin: 'Belo Horizonte', guests: 12 },
  { origin: 'Outros', guests: 15 },
];

const COLORS = ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'];

export function StatisticsCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Receita Mensal */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Receita Mensal</CardTitle>
          <CardDescription>Receita dos últimos 6 meses (R$)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
              <XAxis dataKey="month" stroke="#92400E" />
              <YAxis stroke="#92400E" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFBEB', 
                  border: '1px solid #FCD34D',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#D97706" 
                strokeWidth={2}
                name="Receita (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reservas por Mês */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Reservas por Mês</CardTitle>
          <CardDescription>Quantidade de reservas nos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
              <XAxis dataKey="month" stroke="#92400E" />
              <YAxis stroke="#92400E" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFBEB', 
                  border: '1px solid #FCD34D',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="reservas" fill="#F59E0B" name="Reservas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Taxa de Ocupação */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Taxa de Ocupação</CardTitle>
          <CardDescription>Percentual de ocupação do chalé</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#D97706" />
                <Cell fill="#FDE68A" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Origem dos Hóspedes */}
      <Card className="border-amber-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-amber-900">Origem dos Hóspedes</CardTitle>
          <CardDescription>Cidades de origem dos visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={guestOriginData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
              <XAxis type="number" stroke="#92400E" />
              <YAxis dataKey="origin" type="category" stroke="#92400E" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFBEB', 
                  border: '1px solid #FCD34D',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="guests" name="Hóspedes">
                {guestOriginData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
