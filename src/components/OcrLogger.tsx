/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Upload, Sparkles, X, Check, RefreshCw, AlertCircle, HelpCircle, 
  ArrowRight, Landmark, Receipt, UtensilsCrossed 
} from 'lucide-react';
import { ProcessedInputResult, Transaction } from '../types';
import { generateId } from '../utils';

interface OcrLoggerProps {
  onClose: () => void;
  onSave: (result: Transaction) => void;
  availableCategories: string[];
}

interface SampleTicket {
  name: string;
  sub: string;
  icon: any;
  dummyImageBase64: string; // Simplificada o de prueba
  rawLabel: string;
}

// Simularemos tickets para cuando el usuario quiera probarlo sin archivos locales
const SAMPLE_TICKETS: SampleTicket[] = [
  {
    name: "Coto Supermercados",
    sub: "Ticket de Compra Semanal",
    icon: Receipt,
    dummyImageBase64: "COTO_SUPERMERCADOS_BASE64",
    rawLabel: "Factura Coto, Fecha: 19/05/2026, Cuit: 30-5487741-2. Detalle: Fideos Marolio $1200, Aceite Cocinero $3400, Yerba Playadito $4500, Desodorante Rexona $2800. TOTAL A PAGAR: $11.900 ARS. ¡Gracias por su compra!"
  },
  {
    name: "Cafetería Martínez",
    sub: "Desayuno Premium Palermo",
    icon: UtensilsCrossed,
    dummyImageBase64: "MARTINEZ_CAFE_BASE64",
    rawLabel: "Café Martínez - Plaza Armenia. Sucursal 042. Fecha: 20/05/2026 10:15:30. 1 x Café doble con leche $2900, 2 x Medialunas de manteca $1800, 1 x Tostado de jamón y queso gourmet $4300. TOTAL FACTURADO: $9.000 ARS. Consumo Gastronomía."
  },
  {
    name: "Netflix Inc.",
    sub: "Servicios Digitales Internac.",
    icon: FileText,
    dummyImageBase64: "NETFLIX_BILL_BASE64",
    rawLabel: "Netflix International B.V. Invoice Date: 2026-05-14. Invoice: #US-8781254. Plan Premium UltraHD Monthly Fee: $14.99 USD. Tax Included. Paid via Visa Credit. Total Paid: $14.99 USD."
  },
  {
    name: "Edesur SA",
    sub: "Servicios e Impuestos",
    icon: Landmark,
    dummyImageBase64: "EDESUR_BILL_BASE64",
    rawLabel: "EDESUR S.A. Liquidación de Servicios Públicos. Cliente: 458712-4. Vencimiento: 15/05/2026. Consumo mensual: 240 kWh. Cargo Variable e Impuestos Provinciales. Total Liquidado de Electricidad: $35.400 ARS."
  }
];

export default function OcrLogger({ onClose, onSave, availableCategories }: OcrLoggerProps) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ProcessedInputResult | null>(null);

  // Manejo de carga de archivos (arrastrar y soltar, o diálogo)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage("Por favor, subí únicamente archivos de imagen (JPEG, PNG o WEBP).");
      return;
    }

    setErrorMessage(null);
    setPreviewResult(null);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setImagePreviewUrl(resultStr);
      setImageBase64(resultStr.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  // Activa el OCR con la IA a través del backend
  const handleRunOcr = async () => {
    if (!imageBase64 || !mimeType) {
      setErrorMessage("Falta seleccionar o cargar la foto de tu ticket.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/process-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setPreviewResult(result.data);
      } else {
        throw new Error(result.error || "La IA no pudo procesar la receta o ticket con claridad.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error procesando el OCR con la API de Gemini.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulación instantánea para tickets de muestra (para no obligar a tener archivos a mano)
  const handleSampleOcr = async (sample: SampleTicket) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPreviewResult(null);
    
    // Mostramos la simulación visual temporal
    setImagePreviewUrl('SAMPLE_MARKER');

    try {
      // Como simulador, enviamos el texto plano representativo de la imagen al procesador de texto IA.
      // Así llamamos a la misma IA Gemini para estructurar en JSON el contenido real!
      const response = await fetch('/api/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textFallback: `PROCESAR TICKET: ${sample.rawLabel}`
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setPreviewResult(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setErrorMessage("Error de simulación: " + (err.message || "Servidor inaccesible. Asegurate de cargar tu GEMINI_API_KEY."));
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirmar y almacenar
  const handleConfirmSave = () => {
    if (!previewResult) return;

    const newTx: Transaction = {
      id: "ocr-tx-" + generateId(),
      type: previewResult.type,
      amount: Math.abs(previewResult.amount) || 0,
      currency: previewResult.currency,
      category: previewResult.category || "Gastos Varios",
      merchant: previewResult.merchant || "Factura OCR",
      date: previewResult.date || new Date().toISOString().split('T')[0],
      description: previewResult.description || "Escaneado de comprobante",
      rawInputType: "ocr",
      createdAt: new Date().toISOString()
    };

    onSave(newTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md" id="ocr-logger-modal">
      <motion.div 
        className="w-full max-w-lg bg-[#1C1C1E] text-white rounded-t-[32px] shadow-2xl p-7 overflow-y-auto max-h-[92vh] border-t border-white/10"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        id="ocr-logger-content"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/5" id="ocr-logger-header">
          <div className="flex items-center gap-1.5" id="ocr-logo">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-display font-black tracking-tight text-white text-base">Escanear Ticket (Gemini Vision)</span>
          </div>
          <button 
            type="button"
            id="btn-close-ocr"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO INTERMEDIO */}
        <AnimatePresence mode="wait">

          {/* 1. PREVIEW EDITABLE TRAS PROCESADO */}
          {previewResult ? (
            <motion.div
              key="ocr-preview-state"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-6 space-y-4"
              id="ocr-preview-panel"
            >
              <div className="text-center" id="ocr-preview-heading">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-300 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-widest mb-3 border border-amber-400/20">
                  <Sparkles className="w-3.5 h-3.5" /> Extracción Óptica Completada
                </div>
                <h3 className="text-2xl font-extrabold font-display tracking-tight text-white">Verificá los Datos</h3>
                <p className="text-[#8E8E93] text-xs mt-1.5 font-medium">Los algoritmos de Gemini convirtieron tu comprobante en transacción.</p>
              </div>

              {/* Form de Edición en Previa */}
              <div className="bg-[#2C2C2E]/60 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner" id="ocr-preview-form">
                
                {/* Tipo y Moneda */}
                <div className="grid grid-cols-2 gap-3" id="ocr-edit-type-curr">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Tipo</label>
                    <select 
                      id="edit-ocr-type"
                      value={previewResult.type}
                      onChange={(e) => setPreviewResult({ ...previewResult, type: e.target.value as any })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="expense">Gasto (Expense)</option>
                      <option value="income">Reembolso / Ingreso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Moneda</label>
                    <div className="flex bg-[#1C1C1E] border border-white/10 rounded-xl p-1" id="ocr-currency-tabs">
                      <button
                        type="button"
                        id="tab-ocr-ars"
                        onClick={() => setPreviewResult({ ...previewResult, currency: 'ARS' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewResult.currency === 'ARS' ? 'bg-white text-[#1C1C1E]' : 'text-[#8E8E93]'}`}
                      >
                        ARS ($)
                      </button>
                      <button
                        type="button"
                        id="tab-ocr-usd"
                        onClick={() => setPreviewResult({ ...previewResult, currency: 'USD' })}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${previewResult.currency === 'USD' ? 'bg-white text-[#1C1C1E]' : 'text-[#8E8E93]'}`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-3" id="ocr-edit-amount-date">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Monto Escaneado</label>
                    <input 
                      id="edit-ocr-amount"
                      type="number" 
                      value={previewResult.amount}
                      onChange={(e) => setPreviewResult({ ...previewResult, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-amber-300 font-mono font-extrabold focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Fecha Ticket</label>
                    <input 
                      id="edit-ocr-date"
                      type="date" 
                      value={previewResult.date}
                      onChange={(e) => setPreviewResult({ ...previewResult, date: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Comercio y Categoría */}
                <div className="grid grid-cols-2 gap-3" id="ocr-edit-merchant-category">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Emisor (Comercio)</label>
                    <input 
                      id="edit-ocr-merchant"
                      type="text" 
                      value={previewResult.merchant}
                      onChange={(e) => setPreviewResult({ ...previewResult, merchant: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Clasificación</label>
                    <select
                      id="edit-ocr-category"
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

                {/* Detalle */}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest uppercase text-[#8E8E93] font-black mb-1.5">Items / Concepto</label>
                  <textarea 
                    id="edit-ocr-desc"
                    value={previewResult.description}
                    onChange={(e) => setPreviewResult({ ...previewResult, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Boton confirmar */}
              <div className="flex gap-3" id="ocr-preview-actions">
                <button
                  type="button"
                  id="btn-ocr-restart"
                  onClick={() => {
                    setPreviewResult(null);
                    setImagePreviewUrl(null);
                    setImageBase64(null);
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-neutral-200 py-3 rounded-2xl text-xs font-bold tracking-tight transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <RefreshCw className="w-4 h-4" /> Volver a Escanear
                </button>
                <button
                  type="button"
                  id="btn-ocr-confirm"
                  onClick={handleConfirmSave}
                  className="flex-1 bg-[#34C759] hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-extrabold tracking-tight transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-md"
                >
                  <Check className="w-4 h-4" /> Confirmar Ticket
                </button>
              </div>
            </motion.div>
          ) : (

            /* 2. AREA DE CARGA / DROP ZONE */
            <motion.div
              key="ocr-upload-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-4 space-y-6"
              id="ocr-upload-panel"
            >
              {/* Drag and Drop Zone */}
              {!imagePreviewUrl ? (
                <div className="relative" id="dropzone-container">
                  <input
                    id="file-ticket-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/3 hover:bg-white/5 transition-colors flex flex-col items-center justify-center space-y-3" id="drop-zone border">
                    <div className="w-12 h-12 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-[#8E8E93]" id="upload-icon">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform text-[#34C759]" />
                    </div>
                    <div className="text-center" id="dropzone-labels">
                      <p className="text-xs font-bold text-white">Subí o sacale una foto a tu ticket</p>
                      <p className="text-[10px] text-[#8E8E93] mt-1 font-medium">Soporta formatos JPEG, PNG y WEBP</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Imagen Cargada Previa de confirmación */
                <div className="space-y-4" id="ticket-preview-box">
                  <div className="relative aspect-video w-full rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden animate-fade-in" id="image-frame">
                    {imagePreviewUrl === 'SAMPLE_MARKER' ? (
                      <div className="flex flex-col items-center text-center p-4 space-y-2 text-neutral-400" id="simulated-receipt-placeholder">
                        <Receipt className="w-12 h-12 text-[#34C759] animate-pulse" />
                        <span className="text-xs text-white font-bold">Ticket de Demostración Cargado</span>
                        <span className="text-[9px] font-mono text-[#8E8E93] font-bold">Simulación con IA para Pruebas Rápidas</span>
                      </div>
                    ) : (
                      <img 
                        src={imagePreviewUrl} 
                        alt="Ticket cargado" 
                        className="object-contain max-h-full max-w-full"
                      />
                    )}

                    <button
                      type="button"
                      id="btn-clear-img"
                      onClick={() => {
                        setImagePreviewUrl(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-2.5 right-2.5 bg-[#1C1C1E] text-white rounded-full p-1.5 hover:bg-neutral-900 border border-white/10 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acciones de procesamiento */}
                  <button
                    type="button"
                    id="btn-process-ocr"
                    disabled={isProcessing}
                    onClick={handleRunOcr}
                    className="w-full bg-[#34C759] hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>La IA está leyendo tu Ticket...</span>
                      </>
                    ) : (
                      <>
                        <span>Analizar Ticket con Gemini Vision</span> <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* DEMO RAPIDA - PILOTOS DE TICKET */}
              <div className="space-y-3" id="quick-demo-ocr">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] font-extrabold pl-1">
                  Ejemplos Pre-Cargados para Testear con la IA
                </p>
                
                <div className="grid grid-cols-2 gap-2.5" id="sample-tickets-grid">
                  {SAMPLE_TICKETS.map((sample, idx) => {
                    const Icon = sample.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        id={`btn-sample-ocr-${idx}`}
                        disabled={isProcessing}
                        onClick={() => handleSampleOcr(sample)}
                        className="text-left font-sans text-xs bg-white/3 hover:bg-white/5 border border-white/5 hover:border-white/10 p-3.5 rounded-2xl transition-all flex flex-col justify-between h-24 group cursor-pointer"
                      >
                        <div className="flex justify-between items-start w-full" id="sample-top">
                          <div className="p-1 rounded-lg bg-white/10 group-hover:bg-[#34C759]/15 transition-colors" id="sample-icon">
                            <Icon className="w-4 h-4 text-[#8E8E93] group-hover:text-[#34C759]" />
                          </div>
                          <span className="text-[8px] bg-white/10 text-[#8E8E93] group-hover:bg-[#34C759]/20 group-hover:text-[#34C759] font-mono font-bold scale-90 uppercase tracking-widest px-1.5 py-0.5 rounded-lg">TEST</span>
                        </div>
                        <div>
                          <p className="font-extrabold text-neutral-200 group-hover:text-white truncate text-[11px]">{sample.name}</p>
                          <p className="text-[9px] text-[#8E8E93] truncate mt-0.5">{sample.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LOADER DE PROCESAMIENTO GENERAL */}
              {isProcessing && (
                <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-black/40 rounded-2xl border border-white/5" id="ocr-loading-prompt">
                  <div className="w-8 h-8 rounded-full border-2 border-[#34C759] border-t-transparent animate-spin" />
                  <p className="text-xs text-[#34C759] font-mono font-bold animate-pulse">
                    Extrayendo montos y conceptos fiscales...
                  </p>
                  <p className="text-[10px] text-[#8E8E93] max-w-xs text-center px-4 leading-relaxed font-sans font-medium">
                    Gemini Vision lee de manera automática la captura, identifica impuestos, CUIT y asigna categorías.
                  </p>
                </div>
              )}

              {/* ERRORES */}
              {errorMessage && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex gap-2 text-xs text-red-200" id="error-ocr-panel">
                  <AlertCircle className="w-5 h-5 shrink-0 text-[#FF3B30] font-sans" />
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
        <div className="mt-6 p-4 bg-white/3 rounded-2xl border border-white/5 flex items-start gap-2.5 text-[10px] text-[#8E8E93]" id="ocr-explainer">
          <HelpCircle className="w-4.5 h-4.5 text-amber-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans font-semibold">
            La IA interpreta fotos con letra manuscrita, tickets arrugados, facturas de servicios y recibos en múltiples idiomas. El sistema asocia automáticamente la categoría en función del comercio emisor.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
