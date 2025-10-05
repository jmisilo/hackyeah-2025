'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/ui/button';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, Train } from 'lucide-react';
import { incidentService } from '@/services/incidentService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Proszę wypełnić wszystkie pola');
      return;
    }

    setIsLoading(true);

    try {
      const user = await incidentService.authenticateUser(email, password);
      
      if (user) {
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        toast.success(`Witaj, ${user.name}!`);
        
        
        if (user.role === 'dispatcher') {
          router.push('/dispatcher');
        } else {
          router.push('/');
        }
      } else {
        toast.error('Nieprawidłowy email lub hasło');
      }
    } catch (error) {
      console.error('Błąd podczas logowania:', error);
      toast.error('Wystąpił błąd podczas logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Train className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Dyspozytorski
          </h1>
          <p className="text-gray-600 text-lg">
            Zaloguj się do panelu zarządzania
          </p>
        </div>

        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Adres email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Wprowadź swój email"
                required
              />
            </div>
          </div>

          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-14 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                placeholder="Wprowadź hasło"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Logowanie...
              </div>
            ) : (
              'Zaloguj się'
            )}
          </Button>
        </form>

          
          <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
           
            <div className="space-y-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="font-semibold text-orange-800 mb-2">Dyspozytor</div>
                <div className="text-gray-700 space-y-1">
                  <div><span className="font-medium">Email:</span> dispatcher@example.com</div>
                  <div><span className="font-medium">Hasło:</span> admin123</div>
                </div>
              </div>
             
            </div>
          </div>

          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              ← Powrót do mapy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}