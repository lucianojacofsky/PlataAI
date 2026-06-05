/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, Square, X, RefreshCw, Check, ArrowRight, Sparkles, 
  CornerDownLeft, Play, Keyboard, AlertCircle, ShoppingCart, HelpCircle
} from 'lucide-react';
import { ProcessedInputResult, Transaction } from '../types';
import { generateId } from '../utils';

interface AudioLoggerProps {
  onClose: () => void;
  onSave: (result: Transaction) => void;
  availableCategories: string[];
}

const ARGENTINIAN_SLANG_PRESETS = [
  "Gasté 15 lucas en Carrefour",
  "Me entraron 500 dólares de freelance",
  "Ayer pagué 32 mil de alquiler",
  "El viernes cobré 800 mil",
  "Gasté 20 dólares en Amazon",
  "Compré una pizza y una coca por 8 lucas",
  "Ayer cargué 12 mil de nafta súper en YPF"
];

export default function AudioLogger({ onClose, onSave, availableCategories }: AudioLoggerProps) {
  // Estados de grabación
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Modos y Entradas
  const [isManualTextMode, setIsManualTextMode] = useState(false);
  const [customPhrase, setCustomPhrase] = useState('');
  
  // Procesamiento y Resultados
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ProcessedInputResult | null>(null);

  // Referencias para grabación nativa de audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto para timer de grabación
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Comenzar grabación de voz nativa del dispositivo
  const startNativeRecording = async () => {
    try {
      setErrorMessage(null);
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Intentar forzar un mimeType estándar compatible
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/ogg' };
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Detener todos los tracks de audio del micrófono para apagar el indicador de grabación
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200); // Guardar chunks cada 200ms
      setRecordingTime(0);
      setIsRecording(true);
    } catch (err: any) {
      console.warn("Fallo Captura de Micro:", err);
      setErrorMessage(
        "No se pudo acceder al micrófono. Esto suele pasar dentro de previsualizaciones integradas (iframes) " +
        "por políticas del navegador. ¡No te preocupes! Podés probarlo con el Simulador de Voz abajo."
      );
      setIsManualTextMode(true);
    }
  };

  // Detener grabación nativa
  const stopNativeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convertir Blob a Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Enviar audio grabado al backend
  const handleProcessAudio = async () => {
    if (!audioBlob) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const mime = audioBlob.type || 'audio/webm';

      const response = await fetch('/api/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: mime
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setPreviewResult(result.data);
      } else {
        throw new Error(result.error || "La IA no pudo entender bien la grabación. ¿Intentás con otra frase?");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al procesar el audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Enviar texto coloquial simulado al backend
  const handleProcessText = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textFallback: textToProcess
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setPreviewResult(result.data);
      } else {
        throw new Error(result.error || "No se pudo interpretar la frase.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al comunicarse con la IA. Asegurate de cargar tu GEMINI_API_KEY.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Guardar definitivamente la transacción editada en el preview
  const handleConfirmSave = () => {
    if (!previewResult) return;
    
    const newTx: Transaction = {
      id: "voice-tx-" + generateId(),
      type: previewResult.type,
      amount: Math.abs(previewResult.amount) || 0,
      currency: previewResult.currency,
      category: previewResult.category || "General",
      merchant: previewResult.merchant || "Gasto Local",
      date: previewResult.date || new Date().toISOString().split('T')[0],
      description: previewResult.description || "Ingresado por voz",
      rawInputType: "voice",
      createdAt: new Date().toISOString()
    };

    onSave(newTx);
  };

  // Formato para segundos
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md" id="audio-logger-modal">
      {/* Container Principal */}
      <motion.div 
        className="w-full max-w-lg bg-[#1C1C1E] text-white rounded-t-[32px] shadow-2xl p-7 overflow-y-auto max-h-[92vh] border-t border-white/10"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        id="audio-logger-content"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5" id="audio-logger-header">
          <div className="flex items-center gap-1.5" id="audio-logo">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-display font-black tracking-tight text-white text-base">IA Dictado de Finanzas</span>
          </div>
          <button 
            type="button"
            id="btn-close-audio"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO INTERMEDIO */}
        <AnimatePresence mode="wait">
          
          {/* 1. MODO PREVIA CONFIRMACION (EDITABLE) */}
          {previewResult ? (
            <motion.div
              key="preview-state"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-6 space-y-5"
              id="preview-panel"
            >
              <div className="text-center" id="preview-heading">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-300 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-widest mb-3 border border-amber-400/20">
                  <Sparkles className="w-3.5 h-3.5" /> Transcripción Procesada
                </div>
                <h3 className="text-2xl font-extrabold font-display tracking-tight text-white">Confirmá y Editá</h3>
                <p className="text-[#8E8E93] text-xs mt-1.5 font-medium">Revisá si la IA interpretó correctamente tus palabras.</p>
              </div>

              {/* Form de Edición en Previa */}
              <div className="bg-[#2C2C2E]/60 p-5 rounded-2xl border border-white/5 space-y-45 shadow-inner" id="preview-form">
                
                {/* Tipo y Moneda */}
                <div className="grid grid-cols-2 gap-3" id="preview-type-currency">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Tipo</label>
                    <select 
                      id="edit-type"
                      value={previewResult.type}
                      onChange={(e) => setPreviewResult({ ...previewResult, type: e.target.value as any })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="expense">Gasto (Expense)</option>
                      <option value="income">Ingreso (Income)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Moneda</label>
                    <div className="flex bg-[#1C1C1E] border border-white/10 rounded-xl p-1" id="edit-currency-tabs">
                      <button
                        type="button"
                        id="tab-edit-ars"
                        onClick={() => setPreviewResult({ ...previewResult, currency: 'ARS' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewResult.currency === 'ARS' ? 'bg-white text-[#1C1C1E]' : 'text-[#8E8E93]'}`}
                      >
                        ARS ($)
                      </button>
                      <button
                        type="button"
                        id="tab-edit-usd"
                        onClick={() => setPreviewResult({ ...previewResult, currency: 'USD' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewResult.currency === 'USD' ? 'bg-white text-[#1C1C1E]' : 'text-[#8E8E93]'}`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-3 mb-2" id="preview-amount-date">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Monto</label>
                    <input 
                      id="edit-amount"
                      type="number" 
                      value={previewResult.amount}
                      onChange={(e) => setPreviewResult({ ...previewResult, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-amber-300 font-mono font-extrabold focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Fecha</label>
                    <input 
                      id="edit-date"
                      type="date" 
                      value={previewResult.date}
                      onChange={(e) => setPreviewResult({ ...previewResult, date: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Comercio y Categoría */}
                <div className="grid grid-cols-2 gap-3 mb-2" id="preview-merchant-category">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Negocio / Persona</label>
                    <input 
                      id="edit-merchant"
                      type="text" 
                      value={previewResult.merchant}
                      onChange={(e) => setPreviewResult({ ...previewResult, merchant: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Categoría</label>
                    <select
                      id="edit-category"
                      value={previewResult.category}
                      onChange={(e) => setPreviewResult({ ...previewResult, category: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descripcion */}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Detalle Contextual</label>
                  <textarea 
                    id="edit-description"
                    value={previewResult.description}
                    onChange={(e) => setPreviewResult({ ...previewResult, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Boton Confirmar final */}
              <div className="flex gap-3" id="preview-actions">
                <button
                  type="button"
                  id="btn-preview-restart"
                  onClick={() => setPreviewResult(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-200 py-3 rounded-2xl text-xs font-bold tracking-tight transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" /> Volver a Grabar
                </button>
                <button
                  type="button"
                  id="btn-preview-confirm"
                  onClick={handleConfirmSave}
                  className="flex-1 bg-[#34C759] hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-extrabold tracking-tight transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-md"
                >
                  <Check className="w-4 h-4" /> Guardar Registro
                </button>
              </div>
            </motion.div>
          ) : (
            
            /* 2. MODO GRABACIÓN O CAPTURA DE VOZ ACTIVA */
            <motion.div
              key="recording-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4 space-y-6"
              id="active-panel"
            >
              {/* Selector de modo Audio vs Texto */}
              <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5" id="input-mode-selector">
                <button
                  type="button"
                  id="mode-audio-btn"
                  onClick={() => setIsManualTextMode(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${!isManualTextMode ? 'bg-[#2C2C2E] text-white shadow' : 'text-[#8E8E93] hover:text-[#E5E5EA]'}`}
                >
                  <Mic className="w-4 h-4" /> <span>Micrófono</span>
                </button>
                <button
                  type="button"
                  id="mode-text-btn"
                  onClick={() => setIsManualTextMode(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isManualTextMode ? 'bg-[#2C2C2E] text-white shadow' : 'text-[#8E8E93] hover:text-[#E5E5EA]'}`}
                >
                  <Keyboard className="w-4 h-4" /> <span>Teclado / Presets</span>
                </button>
              </div>

              {/* MODO NATIVO MICROFONO */}
              {!isManualTextMode && (
                <div className="flex flex-col items-center py-6 space-y-6" id="audio-mic-panel">
                  {/* Visualización de onda de audio o estado */}
                  <div className="relative w-28 h-28 flex items-center justify-center" id="voice-waves">
                    {isRecording && (
                      <motion.div 
                        className="absolute inset-0 rounded-full bg-amber-400/20" 
                        animate={{ scale: [1, 1.8, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} 
                      />
                    )}
                    {isRecording && (
                      <motion.div 
                        className="absolute inset-[10px] rounded-full bg-amber-400/35" 
                        animate={{ scale: [1, 1.4, 1] }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.3 }} 
                      />
                    )}
                    <div className="w-16 h-16 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center relative z-10 shadow-lg" id="mic-icon-container">
                      <Mic className={`w-7 h-7 ${isRecording ? 'text-amber-400' : 'text-neutral-300'}`} />
                    </div>
                  </div>

                  <div className="text-center" id="audio-timer">
                    <span className="text-3xl font-mono tracking-wider font-extrabold text-[#F2F2F7]">
                      {formatTime(recordingTime)}
                    </span>
                    <p className="text-[#8E8E93] text-xs mt-2.5 font-medium max-w-xs mx-auto px-2">
                      {isRecording ? "Grabando tu frase coloquial... Tocá para pausar" : "Presioná grabar y hablá como lo hacés siempre"}
                    </p>
                  </div>

                  {/* Acciones de grabación */}
                  <div className="flex items-center gap-4" id="audio-record-actions">
                    {!isRecording ? (
                      <button
                        type="button"
                        id="btn-start-rec"
                        onClick={startNativeRecording}
                        className="bg-[#FF3B30] hover:bg-rose-500 text-white rounded-full p-4 transition-all shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        id="btn-stop-rec"
                        onClick={stopNativeRecording}
                        className="bg-white text-[#1C1C1E] rounded-full p-4 transition-all shadow-lg active:scale-95 flex items-center justify-center cursor-pointer"
                      >
                        <Square className="w-6 h-6 fill-[#1C1C1E]" />
                      </button>
                    )}

                    {audioUrl && !isRecording && (
                      <button
                        type="button"
                        id="btn-play-audio"
                        onClick={() => {
                          const testAudio = new Audio(audioUrl);
                          testAudio.play();
                        }}
                        className="bg-white/5 hover:bg-white/10 rounded-full p-3.5 transition-all border border-white/10 cursor-pointer"
                        title="Escuchar grabación"
                      >
                        <Play className="w-4 h-4 text-neutral-300" />
                      </button>
                    )}
                  </div>

                  {/* Botón de análisis final para nativo */}
                  {audioBlob && !isRecording && (
                    <motion.button
                      type="button"
                      id="btn-analyze-native"
                      disabled={isProcessing}
                      onClick={handleProcessAudio}
                      className="w-full bg-[#34C759] hover:bg-[#32b150]/90 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Procesando Audio...</span>
                        </>
                      ) : (
                        <>
                          <span>Procesar Grabación con IA</span> <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              )}

              {/* MODO TEXTO FALLBACK / PRESETS COLOQUIALES */}
              {isManualTextMode && (
                <div className="space-y-4" id="text-sim-panel">
                  <div>
                    <label className="block text-xs text-[#8E8E93] mb-2 font-semibold pl-1">
                      Escribí tu frase coloquial en español:
                    </label>
                    <div className="relative font-sans" id="search-voice-box">
                      <input 
                        id="input-voice-phrase"
                        type="text" 
                        value={customPhrase}
                        onChange={(e) => setCustomPhrase(e.target.value)}
                        placeholder="Ej: Gasté 15 lucas en Carrefour ayer..."
                        className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl pl-3.5 pr-12 py-3 text-xs text-white focus:outline-none focus:border-[#34C759]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleProcessText(customPhrase);
                        }}
                      />
                      <button
                        type="button"
                        id="btn-trigger-text"
                        onClick={() => handleProcessText(customPhrase)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#34C759] cursor-pointer"
                      >
                        <CornerDownLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ejemplos de jerga */}
                  <div className="space-y-2" id="speech-slang-examples">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-extrabold mb-1.5 pl-1">
                      Ejemplos rápidos con Jerga / Slang
                    </p>
                    <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1" id="presets-list">
                      {ARGENTINIAN_SLANG_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          id={`preset-btn-${i}`}
                          onClick={() => {
                            setCustomPhrase(preset);
                            handleProcessText(preset);
                          }}
                          className="w-full text-left font-sans text-xs bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 p-2.5 rounded-xl text-neutral-300 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2 font-medium">"{preset}"</span>
                          <span className="text-[9px] bg-white/10 text-[#8E8E93] group-hover:bg-[#34C759]/15 group-hover:text-[#34C759] px-2 py-0.5 rounded-lg font-mono font-bold transition-all shrink-0">
                            Probar
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* LOADER DE PROCESAMIENTO GENERAL */}
              {isProcessing && (
                <div className="flex flex-col items-center justify-center py-6 space-y-3 bg-black/40 rounded-2xl border border-white/5" id="audio-loading-overlay">
                  <div className="w-8 h-8 rounded-full border-2 border-[#34C759] border-t-transparent animate-spin" />
                  <p className="text-xs text-[#34C759] font-mono font-bold animate-pulse">
                    Gemini decodificando intenciones...
                  </p>
                  <p className="text-[10px] text-[#8E8E93] max-w-xs text-center px-4 font-sans font-medium">
                    Asignando comerciantes locales, identificando categorías y traduciendo la jerga ("lucas" y "pesos").
                  </p>
                </div>
              )}

              {/* MENSAJE DE ERROR */}
              {errorMessage && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex gap-2 text-xs text-red-200" id="error-audio-panel">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#FF3B30]" />
                  <div>
                    <p className="font-bold text-[#FF3B30]">Aviso del procesador</p>
                    <p className="mt-0.5 leading-relaxed text-neutral-300 text-[11px] font-medium">{errorMessage}</p>
                  </div>
                </div>
              )}
              
            </motion.div>
          )}

        </AnimatePresence>

        {/* Tip Informativo en pie de página */}
        <div className="mt-6 p-4 bg-white/3 rounded-2xl border border-white/5 flex items-start gap-2.5 text-[10px] text-[#8E8E93]" id="dictate-tip">
          <HelpCircle className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans font-semibold">
            La IA reconoce fechas relativas ("ayer", "el viernes") y calcula el día real automáticamente tomando el día de hoy como referencia. No necesitás estructurar tu habla, decilo con total naturalidad.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
