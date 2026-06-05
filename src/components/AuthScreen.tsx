/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react';
import { UserSession } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const chosenName = name.trim() || 'Usuario';
    const chosenUsername = username.trim() || 'usuario@plata.ai';

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        isAuthenticated: true,
        name: chosenName,
        username: chosenUsername,
        preferredCurrency,
      });
    }, 1100);
  };

  const handleAppleIdMock = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        isAuthenticated: true,
        name: 'Santi',
        username: 'santi.crypto@icloud.com',
        preferredCurrency: 'ARS',
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col justify-between items-center px-6 py-10 select-none relative overflow-x-hidden" id="auth-screen">
      
      {/* Decorative Elegant Soft Ambient Backgound Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-gradient-to-br from-[#34C759]/8 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] aspect-square rounded-full bg-gradient-to-tr from-amber-400/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="w-full max-w-sm flex justify-between items-center z-10" id="auth-logo-parent">
        <div className="flex items-center gap-2.5" id="auth-brand-left">
          <div className="w-9 h-9 rounded-xl bg-[#1C1C1E] flex items-center justify-center text-white shadow-lg font-display font-black text-lg" id="auth-logo-badge">
            P
          </div>
          <span className="font-display font-black text-xl tracking-tight text-[#1C1C1E] flex items-center gap-1" id="auth-logo-text">
            Plata <span className="text-[#34C759] font-mono font-extrabold text-xs bg-[#34C759]/10 px-2 py-0.5 rounded-full">AI</span>
          </span>
        </div>
        
        <span className="text-[9px] font-mono uppercase tracking-widest font-black text-[#8E8E93] bg-[#E5E5EA] px-2.5 py-1 rounded-lg">
          v1.4.0 Live
        </span>
      </div>

      {/* Main interactive Card container */}
      <div className="w-full max-w-md my-auto flex flex-col items-center z-10" id="auth-container">
        
        {/* Animated credit card simulator mockup with dynamic backdrop according to selected preferredCurrency */}
        <motion.div 
          className={`relative w-full aspect-[1.586/1] rounded-[30px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.354)] p-7 text-white overflow-hidden mb-7 border border-white/15 transition-all duration-700 bg-gradient-to-br ${
            preferredCurrency === 'ARS'
              ? 'from-[#1C1C1E] via-[#2C2C2E] to-[#121214]'
              : 'from-[#132A13] via-[#0D1F10] to-[#1C1C1E]'
          }`}
          whileHover={{ scale: 1.025, rotateY: 3, rotateX: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          id="auth-mockup-card"
        >
          {/* Hologram aesthetic lines */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0)_60%)]" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#34C759]/10 filter blur-2xl animate-pulse" />
          <div className="absolute top-6 right-6 w-3.5 h-3.5 rounded-full bg-white/5 border border-white/10" />
          
          <div className="flex justify-between items-start" id="card-top">
            <div>
              <p className="text-[8px] uppercase tracking-widest text-[#8E8E93] font-mono font-black">Personal Wealth Engine</p>
              <h2 className="text-xl font-extrabold tracking-tight font-display mt-0.5">Plata Black</h2>
            </div>
            <div className="w-9 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10" id="card-chip">
              <div className="grid grid-cols-3 gap-0.5 p-1 w-full h-full opacity-80">
                <div className="bg-amber-200/60 rounded-[1px] h-full" />
                <div className="bg-amber-200/80 rounded-[1px] h-full" />
                <div className="bg-amber-200/60 rounded-[1px] h-full" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-1.5" id="card-center">
            <span className="font-mono text-base text-neutral-300 tracking-[0.25em] font-bold">
              •••• •••• •••• {preferredCurrency === 'ARS' ? '2026' : '1989'}
            </span>
          </div>

          <div className="absolute bottom-6 left-7 right-7 flex justify-between items-end" id="card-bottom">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-[#8E8E93] font-mono font-extrabold">Cardholder</p>
              <p className="text-xs font-black tracking-tight text-white font-sans mt-0.5 drop-shadow-sm min-h-4">
                {name.trim() || 'Tu Nombre Aquí'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1" id="card-pay-logo">
              <span className="text-[9px] font-mono font-black tracking-widest text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">
                {preferredCurrency}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content Box formatted like Sleek premium design */}
        <div className="w-full bg-white rounded-[32px] border border-white/80 p-7.5 shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex flex-col" id="auth-content-box">
          {/* Title greeting */}
          <div className="text-center mb-6" id="auth-headers">
            <h1 className="text-2xl font-black tracking-tight text-[#1C1C1E] font-display">
              {isRegister ? 'Creá tu billetera Plata' : 'Bienvenido de vuelta'}
            </h1>
            <p className="text-[#8E8E93] text-xs font-semibold mt-2 max-w-xs mx-auto leading-relaxed">
              {isRegister 
                ? 'Configurá tu perfil en un toque para empezar y gestionar tus presupuestos.' 
                : 'Registrá tus ingresos y gastos en tiempo real de manera inteligente.'}
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4" id="auth-form">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                id="name-input-block"
              >
                <label className="block text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1.5 pl-1">¿Cómo te llamas?</label>
                <input 
                  id="input-name"
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Santi MacDonagh" 
                  className="w-full px-4 py-3 bg-[#F2F2F7] border border-transparent rounded-2xl text-[#1C1C1E] placeholder-neutral-400 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#34C759] transition-all font-sans"
                  required
                />
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1.5 pl-1">Correo Electrónico</label>
              <input 
                id="input-email"
                type="email" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: santi@plata.ai" 
                className="w-full px-4 py-3 bg-[#F2F2F7] border border-transparent rounded-2xl text-[#1C1C1E] placeholder-neutral-400 text-xs font-bold focus:outline-none focus:bg-white focus:border-[#34C759] transition-all font-sans"
                required
              />
            </div>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
                id="currency-input-block"
              >
                <label className="block text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-1.5 pl-1">Moneda Favorita</label>
                <div className="grid grid-cols-2 gap-2" id="currency-selectors">
                  <button
                    type="button"
                    id="btn-currency-ars"
                    onClick={() => setPreferredCurrency('ARS')}
                    className={`py-2.5 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                      preferredCurrency === 'ARS' 
                        ? 'border-transparent bg-[#1C1C1E] text-white shadow' 
                        : 'border-transparent bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    Pesos ($ ARS)
                  </button>
                  <button
                    type="button"
                    id="btn-currency-usd"
                    onClick={() => setPreferredCurrency('USD')}
                    className={`py-2.5 rounded-2xl text-xs font-black transition-all border cursor-pointer ${
                      preferredCurrency === 'USD' 
                        ? 'border-transparent bg-[#1C1C1E] text-white shadow' 
                        : 'border-transparent bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    Dólares ($ USD)
                  </button>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              id="btn-submit-auth"
              disabled={isLoading}
              className="w-full bg-[#1C1C1E] hover:bg-black text-white py-3.5 rounded-2xl font-black text-xs font-display tracking-wide transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer mt-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-[#34C759]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando entrada...</span>
                </span>
              ) : (
                <>
                  <span>{isRegister ? 'Crear mi billetera' : 'Ingresar de forma segura'}</span>
                  <ArrowRight className="w-4 h-4 text-[#34C759]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center my-5" id="auth-divider">
            <div className="flex-1 h-[1px] bg-neutral-200/70" />
            <span className="text-[9px] uppercase font-mono tracking-widest text-[#8E8E93] px-3 font-black">O Acceder Con</span>
            <div className="flex-1 h-[1px] bg-neutral-200/70" />
          </div>

          {/* Biometrics and Social mock */}
          <div className="w-full space-y-2.5" id="social-mockups">
            <button
              type="button"
              id="btn-apple-login"
              onClick={handleAppleIdMock}
              className="w-full h-11 border border-neutral-200 hover:border-neutral-300 hover:bg-[#F2F2F7] bg-white text-neutral-800 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              <span className="text-base font-sans font-bold leading-none -mt-0.5"></span> Continuar con Apple ID
            </button>

            <button
              type="button"
              id="btn-faceid-mock"
              onClick={handleAppleIdMock}
              className="w-full h-11 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Fingerprint className="w-4.5 h-4.5 text-[#34C759]" /> Entrada rápida con Biometría (FaceID)
            </button>
          </div>

          {/* Auth Toggle */}
          <button
            type="button"
            id="btn-auth-toggle"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-[#8E8E93] hover:text-[#1C1C1E] font-bold transition-colors py-1.5 mt-5 active:scale-95 cursor-pointer self-center"
          >
            {isRegister ? '¿Ya tenés cuenta? Iniciá sesión' : '¿Sos nuevo? Registrate gratis hoy'}
          </button>
        </div>
      </div>

      {/* Safety Badge footer */}
      <div className="w-full max-w-md flex justify-center items-center gap-1.5 opacity-80 text-[8px] tracking-widest text-[#8E8E93] font-mono font-black mt-4" id="auth-footer">
        <ShieldCheck className="w-4 h-4 text-[#34C759]" />
        ENCRIPTADO DE EXTREMO A EXTREMO · LOCAL SAFE STORAGE
      </div>
    </div>
  );
}
