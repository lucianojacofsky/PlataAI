/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configurar parser de cuerpo con límites generosos para imágenes de OCR
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy initializer para el cliente de Gemini y manejo de errores por falta de API KEY
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurado. Asegurate de cargar tu API KEY de Gemini en el panel de secretos.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Endpoint de estado
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// --- API: PROCESADO DE VOZ Y TEXTO COLOQUIAL ---
app.post("/api/process-voice", async (req, res) => {
  try {
    const { audioBase64, mimeType, textFallback } = req.body;
    let textPrompt = `Sos un procesador financiero experto en el dialecto informal de Argentina. 
Tu tarea es interpretar un audio o un texto coloquial que describe un gasto, desembolso, entrada de dinero, pago de servicios o de tarjeta, etc.
Debés analizar el mensaje, extraer los componentes indicados y responder estrictamente en formato JSON con la siguiente estructura y reglas especiales:

REGLAS DE MONTO Y JERGA ARGENTINA:
- "lucas", "gamba", "palos", "pe", "verdes" son jergas de dinero comunes en Argentina. Convertilas a su valor numérico neto:
  * "15 lucas" o "quince lucas" = 15000
  * "dos gambas" o "200 pe" = 200
  * "un lucón", "un lucario" = 1000
  * "un palo" = 1000000 (un millón)
  * "palo y medio" o "un palo y medio" = 1500000 (millón y medio)
  * "un ciego" o "un billete de cien" = 100
  * "800 lucas" o "800 mil" = 800000
  * etc.
- Si no se menciona ningún monto, asumí 0 o un estimado si el contexto da pistas obvias.

REGLAS DE MONEDA:
- Si se menciona "verdes", "lechuza", "dólares" o "USD", la moneda es "USD".
- Si se menciona "pesos", "lucas", "pe", "mangos" o se asume moneda local de Argentina (ej. Carrefour, súper, nafta), la moneda es "ARS".

REGLAS DE FECHAS RELATIVAS (Tomá como fecha de referencia HOY, que es Jueves 21 de Mayo de 2026):
- "hoy" = "2026-05-21"
- "ayer" = "2026-05-20"
- "anteayer" o "antes de ayer" = "2026-05-19"
- "el viernes" o "el viernes pasado" = referirse al viernes inmediato anterior más cercano al 21 de mayo de 2026, que sería el Viernes 15 de Mayo de 2026 ("2026-05-15").
- Si no se especifica ninguna fecha, usá por defecto "2026-05-21".

REGLAS DE CATEGORÍA:
Debés clasificarlo estrictamente en una de estas categorías preestablecidas:
- Supermercado (para compras de despensa, súper, Carrefour, Coto)
- Comida (para restoranes, delivery, pizza, McDonalds, cafetería)
- Transporte (colectivo, Sube, nafta, taxi, Uber)
- Suscripciones (Netflix, Spotify, gimnasio recurrente)
- Alquiler (pagos de expensas, depas)
- Salud (farmacia, médico, prepaga)
- Entretenimiento (cine, fiestas, salidas, boliche)
- Inversiones (dólar MEP, cedears, acciones)
- Freelance (ingresos por laburos independientes, changas)
- Sueldo (sueldo mensual, cobro de nómina)
- Transferencias (mandarle plata al tío, amigos)
- Tarjeta (pago del resumen de la tarjeta)
- Servicios (luz, gas, internet, agua, Expensas, impuestos)
- Transferencias (transferencia genérica)
- Si no aplica a ninguna, usá una categoría personalizada corta que describa el evento.

REGLAS DE COMERCIO (Merchant):
Extraé dónde se compró o a quién se le pagó (ej: "Carrefour", "Shell", "Amazon", "Juan", "Netflix", "Propietario"). Si es un cobro, quién te pagó (ej: "Cliente Freelance", "Empresa SRL"). Si no se identifica a nadie, usá un nombre representativo acorde como "Gasto General" u "Otro".

REGLAS DE TIPO (type):
- "expense": para gastos, consumos, pérdidas de dinero, pagos.
- "income": para entradas de dinero, cobros, sueldos, regalos, transferencias recibidas.

Responde SIEMPRE en formato JSON válido según el esquema solicitado.`;

    const ai = getGeminiClient();

    let parts: any[] = [{ text: textPrompt }];

    if (audioBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      });
      parts.push({ text: "Procesá la voz adjunta y extraé los datos de la transacción en base a la fecha de referencia (HOY Jueves 21 de Mayo de 2026)." });
    } else if (textFallback) {
      parts.push({ text: `Texto coloquial a procesar: "${textFallback}"` });
    } else {
      return res.status(400).json({ error: "Faltan datos de audio o de texto." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "Tipo: 'expense' o 'income'."
            },
            amount: {
              type: Type.NUMBER,
              description: "El monto neto como número positivo."
            },
            currency: {
              type: Type.STRING,
              description: "Moneda: 'ARS' o 'USD'."
            },
            category: {
              type: Type.STRING,
              description: "Categoría clasificada adecuada."
            },
            merchant: {
              type: Type.STRING,
              description: "Comercio, persona o entidad."
            },
            date: {
              type: Type.STRING,
              description: "Fecha YYYY-MM-DD relativa a HOY (2026-05-21)."
            },
            description: {
              type: Type.STRING,
              description: "Breve resumen en español de la transacción."
            }
          },
          required: ["type", "amount", "currency", "category", "merchant", "date", "description"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Error en /api/process-voice:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error procesando el registro financiero mediante IA."
    });
  }
});

// --- API: OCR DE TICKETS ---
app.post("/api/process-ocr", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Faltan datos de la imagen o del formato." });
    }

    const ai = getGeminiClient();

    const textPrompt = `Analizá la foto de este ticket, recibo o comprobante de compra y extraé la información financiera relevante de forma estructurada. 
Debés identificar el monto total facturado, el comercio, la fecha del ticket y la categoría más apropiada.

REGLAS DE EXTRACCIÓN:
- "type": Siempre es un gasto ("expense") a menos que se trate explícitamente de una factura de crédito, reembolso o nota de crédito de ingreso ("income").
- "amount": Extraé el número total neto final pagado (incluyendo decimales si aplica).
- "currency": Identificá si son pesos argentinos o dólares. Usa "ARS" si el local es de Argentina o se observan pesos, y "USD" si indica dólares.
- "category": Clasificá el comercio o los ítems según corresponda: Supermercado, Comida, Transporte, Suscripciones, Alquiler, Salud, Entretenimiento, Inversiones, Servicios o similar.
- "merchant": El nombre comercial exacto del negocio (ej: 'Carrefour', 'Cervecería Patagonia', 'YPF', 'Farmacity', 'Notion Services').
- "date": La fecha real impresa en el comprobante en formato YYYY-MM-DD. Si no es entendible o falta, usá la fecha del sistema HOY que es '2026-05-21'.
- "description": Breve resumen de la compra o ítem relevante (ej: 'Compres de alimentos varios' o 'Café y Medialunas').

Devolvé obligatoriamente una estructura JSON válida que se ajuste al esquema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        { text: textPrompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              description: "Tipo: 'expense' o 'income'."
            },
            amount: {
              type: Type.NUMBER,
              description: "Monto total del ticket."
            },
            currency: {
              type: Type.STRING,
              description: "Moneda de facturación: 'ARS' o 'USD'."
            },
            category: {
              type: Type.STRING,
              description: "Categoría más ajustada."
            },
            merchant: {
              type: Type.STRING,
              description: "Razón social o marca del comercio."
            },
            date: {
              type: Type.STRING,
              description: "Fecha impresa YYYY-MM-DD en el ticket."
            },
            description: {
              type: Type.STRING,
              description: "Resumen breve de la compra."
            }
          },
          required: ["type", "amount", "currency", "category", "merchant", "date", "description"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Error en /api/process-ocr:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error procesando el ticket con OCR e IA."
    });
  }
});

// --- API: GENERAR COMENTARIOS Y ANÁLISIS DE RENDIMIENTO (Notion AI Argento) ---
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { transactions, categories, preferredCurrency } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: "Faltan las transacciones para analizar." });
    }

    const ai = getGeminiClient();

    const listSummary = transactions.map((t: any) => 
      `- [${t.date}] ${t.type === 'expense' ? 'GASTO' : 'INGRESO'} de ${t.currency} ${t.amount} en ${t.merchant} (Categoría: ${t.category}). Detalle: ${t.description}`
    ).join("\n");

    const textPrompt = `Sos un analista financiero fintech ultra elite del ecosistema argentino, con el sarcasmo inteligente, ingenio, y la calidez del habla de Buenos Aires/Argentina.
Vas a analizar el historial de gastos e ingresos del usuario y redactar un reporte financiero breve, sofisticado, motivador, pero con toques cómicos locales (pocas jergas sutiles como "che", "ojo", "ponerse las pilas", "tarjeteando", "inflación", "freelancear").

ENTRADA DE INFORMACIÓN (TRANSACCIONES ACTUALES):
${listSummary || "No hay transacciones registradas todavía."}

INSTRUCCIONES DE FORMATO:
Debés responder estrictamente un JSON con las siguientes 3 claves:
1. "summary": Un texto de 2 a 3 párrafos en español argentino que explique de forma muy clara cómo vienen las finanzas de este mes. Evaluá el balance en pesos y dólares e identificá en qué categoría está yendo más guita.
2. "savingsTips": Un array de hasta 3 consejos prácticos, totalmente contextualizados en base a sus gastos reales (por ejemplo, si gasta en Starbucks o streaming, sugiere optimizarlos con humor).
3. "funnyComment": Un comentario corto o "chicana" divertida al mejor estilo porteño / argentino sobre su comportamiento financiero (ej: "Che, aflojale a los deliveris de pizza que vas a terminar pidiéndole prestado a tu gato...").

Mantené un estándar premium estilo Notion AI.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Análisis comprensivo de 2-3 párrafos en español argentino."
            },
            savingsTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Hasta 3 consejos prácticos adaptados al consumo."
            },
            funnyComment: {
              type: Type.STRING,
              description: "Frase humorística argentina corta sobre el estado financiero."
            }
          },
          required: ["summary", "savingsTips", "funnyComment"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    return res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Error en /api/generate-insights:", error);
    // Retornamos fallback gracioso local si falla
    return res.json({
      success: false,
      data: {
        summary: "¡Hola! Parece que las nubes financieras están en mantenimiento técnico o tu API KEY de Gemini no está cargada. Para poder darte un análisis premium bien preciso de tu guita, recordá configurar la clave en el panel de Secrets de AI Studio.",
        savingsTips: [
          "Revisá el panel de secretos si ves errores recurrentes.",
          "Cargá un par de transacciones para ver la magia de Notion AI.",
          "Aflojale un poco al café de especialidad mientras tanto."
        ],
        funnyComment: "Che, tus finanzas están mudas porque falta la llave (API Key). ¡Ponete las pilas!"
      }
    });
  }
});

// --- ENLACE CON VITE EN DESARROLLO Y ESTÁTICOS EN PRODUCCIÓN ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Modo Desarrollo
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Modo Producción
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback para React Router / index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Plata AI Server] Servidor corriendo con éxito en http://localhost:${PORT}`);
  });
}

startServer();
