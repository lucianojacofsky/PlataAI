# Plata AI 💸  
### Control Financiero Inteligente y Presupuestos Dinámicos

Plata AI es una aplicación full-stack moderna y minimalista inspirada en la estética móvil de iOS para llevar el control diario de tus finanzas en tiempo real. Permite registrar tus ingresos, consumos y configurar presupuestos personalizados de forma elegante e intuitiva.

---

## ✨ Características Principales

### 💳 1. Interfaz Premium iOS-Style
* **Dashboard Elegante**: Visualización de balances en un lienzo limpio de alto contraste con tarjetas de diseño asimétrico.
* **Flujos Animados**: Animaciones fluidas impulsadas por `motion` para transiciones de estados, alertas y filtros.
* **Tarjeta Interactiva Dinámica**: Una tarjeta de crédito virtual interactiva que adapta su estética y fondos degradados según tu moneda habitual (ARS/USD).

### 🎯 2. Gestión de Presupuestos y Límites (¡Nuevo!)
* **Presupuestos Personalizados**: Permite definir montos límite por categorías específicas (Supermercado, Delivery, Outings, etc.).
* **Períodos Flexibles**: Configuración de alertas en períodos semanales o mensuales.
* **Indicadores Visuales Continuos**: Barra de progreso interactiva con cambio dinámico de color (Verde para controlado, Amarillo para peligro de 80%+, Rojo para excedido).
* **Notificaciones Push y Flotantes**:
  * **Canal Físico en Pantalla**: Notificación de banner flotante estilo iOS/dynamic-island interactiva.
  * **Notificación Push Web**: Alertas nativas del navegador al aproximarse al 80% y tras sobrepasar el 100% de cualquier presupuesto.

### 🎙️ 3. Registro por Inteligencia Artificial y Herramientas Inteligentes
* **Voice Logger**: Habla de forma natural (ej: *"Ayer gasté 8500 pesos en sushi con amigos"*) y deja que el modelo parseé el monto, la categoría y la fecha exacta automáticamente.
* **OCR Logger (Escaneo de Tickets)**: Sube la foto de una factura o ticket y extrae el gasto de forma instantánea.
* **Filtros Avanzados**: Búsqueda interactiva por texto, filtrado por categorías y segregación de balances multimoneda (ARS/USD) en segundos.

### 🔒 4. Autenticación y Almacenamiento Local Seguro
* Configuración rápida en el ingreso con tu nombre personalizado.
* Persistencia completa de transacciones, presupuestos y configuraciones a través del `LocalStorage` del navegador de forma segura.

---

## 🛠️ Stack Tecnológico

* **Frontend**: React 18, Vite, TypeScript.
* **Estilos**: Tailwind CSS con fuentes variables de alta legibilidad (*Inter* y *JetBrains Mono*).
* **Animaciones**: `motion` (f.k.a. Framer Motion).
* **Iconografía**: `lucide-react` para mantener una estética consistente.
* **Backend Opcional (Servidor de Desarrollo)**: Express y Node.js con soporte nativo de TypeScript.

---

## 🚀 Guía de Instalación y Uso de Desarrollo

1. **Instalación de Dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar en Modo de Desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se levantará en el puerto unificado **3000** (`http://localhost:3000`).

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```

---

