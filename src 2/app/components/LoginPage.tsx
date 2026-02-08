import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import logo from '@/assets/28e5b98a8efd3ddfcf6d35c285881cd9cf6c583f.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simulação de login (em produção, isso seria uma chamada à API)
    if (email === 'admin@hospedagem.com' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      setError('Email ou senha inválidos. Tente admin@hospedagem.com / admin123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto mb-2">
            <img src={logo} alt="Fulô de Pequi" className="h-20 w-auto mx-auto" />
          </div>
          <CardTitle className="text-2xl text-amber-900">Painel Administrativo</CardTitle>
          <CardDescription className="text-amber-700">
            Chalé Fulô de Pequi - Sistema de Gestão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@fulodepequi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white">
              Entrar
            </Button>
            {error && (
              <p className="text-sm text-red-600 text-center mt-2">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}