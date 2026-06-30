import React, { useState, useEffect } from "react";
import { Cliente, AveriaResuelta, TallerConfig, DocumentoItem } from "../types";
import { 
  Sparkles, Camera, Image as ImageIcon, Search, AlertTriangle, 
  Clock, Box, Calendar, Droplet, BookOpen, Megaphone, Plus, HelpCircle 
} from "lucide-react";

interface Props {
  onAdd: (item: { nombre: string; cantidad: number; precio: number }) => void;
  memoriaLocal: AveriaResuelta[];
  mostrarNotificacion: (mensaje: string) => void;
  config: TallerConfig;
  appMode: "mecanica" | "chapa" | null;
  clientesDB: Cliente[];
  themeColor: string;
}

export default function ModuloAsistenteTaller({
  onAdd,
  memoriaLocal,
  mostrarNotificacion,
  config,
  appMode,
  clientesDB,
  themeColor,
}: Props) {
  const arrClientes = Array.isArray(clientesDB) ? clientesDB : [];
  const arrMemoria = Array.isArray(memoriaLocal) ? memoriaLocal : [];

  const [busqueda, setBusqueda] = useState("");
  const [piezaOperacion, setPiezaOperacion] = useState("");
  const [codigoMotor, setCodigoMotor] = useState("");
  const [anoVehiculo, setAnoVehiculo] = useState("");
  const [tipoBusqueda, setTipoBusqueda] = useState("tiempos");
  const [resultados, setResultados] = useState<any | null>(null);

  const [subModuloIA, setSubModuloIA] = useState<"web" | "vision">("web");
  const [imagenAAnalizar, setImagenAAnalizar] = useState<string | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenMime, setImagenMime] = useState<string | null>(null);
  const [modoVision, setModoVision] = useState<"golpe" | "color">("golpe");
  const [resultadosVision, setResultadosVision] = useState<any | null>(null);

  const [memoriaEncontrada, setMemoriaEncontrada] = useState<AveriaResuelta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (appMode === "chapa" && !imagenPreview) {
      setSubModuloIA("vision");
    }
  }, [appMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const base64String = (reader.result as string)
          .replace("data:", "")
          .replace(/^.+,/, "");
        setImagenAAnalizar(base64String);
        setImagenMime(file.type);
        setImagenPreview(reader.result as string);
        setResultadosVision(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const realizarBusquedaInteligente = async () => {
    if (!busqueda.trim() && !piezaOperacion.trim()) {
      mostrarNotificacion("Especifica un modelo o repuesto a consultar.");
      return;
    }
    setLoading(true);
    setError("");
    setResultados(null);
    setMemoriaEncontrada(null);

    const queryContext = `${busqueda} ${piezaOperacion}`.toLowerCase();
    const matchLocal = arrMemoria.find(
      (m) =>
        (m?.titulo || "").toLowerCase().includes(queryContext) ||
        (m?.sintomas || "").toLowerCase().includes(queryContext)
    );
    if (matchLocal) setMemoriaEncontrada(matchLocal);

    const engineStr = codigoMotor.trim() ? ` motor ${codigoMotor}` : '';
    const yearStr = anoVehiculo.trim() ? ` año ${anoVehiculo}` : '';
    const fullVehicle = `${busqueda}${yearStr}${engineStr}`;

    let promptText = "";
    let responseSchema: any = {};

    if (tipoBusqueda === "tiempos") {
      promptText = `Proporciona el tiempo de mano de obra estimado (Tempario Oficial) para realizar la operación: "${
        piezaOperacion || "Mantenimiento Preventivo"
      }" en el vehículo: ${fullVehicle}. Detalla las herramientas críticas y los pasos operativos.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          operacion: { type: "STRING" },
          vehiculo: { type: "STRING" },
          tiempoOficial: { type: "STRING" },
          dificultad: { type: "STRING" },
          pasosClave: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["operacion", "vehiculo", "tiempoOficial", "dificultad", "pasosClave"],
      };
    } else if (tipoBusqueda === "mantenimiento") {
      promptText = `Plan de intervalos de mantenimiento oficial y revisiones programadas para el coche: ${fullVehicle}.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          mantenimientos: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                km: { type: "STRING" },
                operaciones: { type: "ARRAY", items: { type: "STRING" } },
                notas: { type: "STRING" },
              },
              required: ["km", "operaciones", "notas"],
            },
          },
        },
        required: ["mantenimientos"],
      };
    } else if (tipoBusqueda === "esquemas") {
      promptText = `Ficha técnica oficial, pares de apriete críticos y términos sugeridos para la búsqueda de diagramas de la pieza "${
        piezaOperacion || "General"
      }" en el coche: ${fullVehicle}.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          resumenTecnico: { type: "STRING" },
          paresDeAprieteRecomendados: { type: "ARRAY", items: { type: "STRING" } },
          terminosGoogleParaBuscarDiagramas: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["resumenTecnico", "paresDeAprieteRecomendados", "terminosGoogleParaBuscarDiagramas"],
      };
    } else if (tipoBusqueda === "recambios") {
      promptText = `Saca una lista de recambios compatibles, referencias OEM estimadas de marca y el precio aproximado de mercado de la pieza: "${
        piezaOperacion || "Mantenimiento"
      }" para: ${fullVehicle}.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          recambios: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                ref: { type: "STRING" },
                nombre: { type: "STRING" },
                precio: { type: "NUMBER" },
                stock: { type: "STRING" },
              },
              required: ["ref", "nombre", "precio", "stock"],
            },
          },
        },
        required: ["recambios"],
      };
    } else if (tipoBusqueda === "aceite") {
      promptText = `Capacidad exacta de lubricante de motor (en litros) y viscosidad SAE oficialmente sugerida para: ${fullVehicle}.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          vehiculo: { type: "STRING" },
          litros: { type: "STRING" },
          viscosidad: { type: "STRING" },
          notas: { type: "STRING" },
        },
        required: ["vehiculo", "litros", "viscosidad", "notas"],
      };
    } else if (tipoBusqueda === "campanas") {
      promptText = `Saca si existen alertas de seguridad, llamadas a revisión de fabricante o defectos endémicos reportados para: ${fullVehicle}.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          campanas: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                titulo: { type: "STRING" },
                descripcion: { type: "STRING" },
                gravedad: { type: "STRING" },
                afectados: { type: "STRING" },
              },
              required: ["titulo", "descripcion", "gravedad", "afectados"],
            },
          },
        },
        required: ["campanas"],
      };
    }

    try {
      const clientApiKey = config?.geminiApiKey || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "AIzaSyBzlFVEBAU2N0dPhRX5CDb4XLHHzB4yvts";
      let parsedResult: any = null;
      let callSuccess = false;

      if (clientApiKey) {
        // Direct client-side call to Gemini API with multiple models retry loop
        const clientModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        let lastClientErr: any = null;

        for (const modelName of clientModels) {
          try {
            console.log(`Intentando llamada directa cliente con modelo: ${modelName}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${clientApiKey}`;
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: responseSchema,
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                parsedResult = JSON.parse(text.trim());
                callSuccess = true;
                break;
              }
            } else {
              const errData = await response.json().catch(() => ({}));
              lastClientErr = new Error(errData?.error?.message || `Error HTTP ${response.status}`);
            }
          } catch (err: any) {
            lastClientErr = err;
          }
        }

        if (!callSuccess) {
          console.warn("Llamadas directas desde el cliente fallaron. Reintentando por servidor proxy...", lastClientErr);
        }
      }

      if (!callSuccess) {
        // Fallback or primary to proxying through our Node server (which has high-availability retry)
        const response = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText, schema: responseSchema }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data?.result) {
          parsedResult = data.result;
        } else {
          throw new Error("Respuesta inválida devuelta por la IA.");
        }
      }

      setResultados(parsedResult);
    } catch (err: any) {
      console.error("Fallo IA:", err);
      setError(err.message || "Error desconocido al contactar con Gemini");
    } finally {
      setLoading(false);
    }
  };

  const realizarAnalisisVision = async () => {
    if (!imagenAAnalizar) {
      mostrarNotificacion("Es necesario subir una captura fotográfica.");
      return;
    }
    setLoading(true);
    setError("");
    setResultadosVision(null);

    let promptText = "";
    let responseSchema: any = {};

    if (modoVision === "golpe") {
      promptText = `Analiza detalladamente el golpe de carrocería en la fotografía. Determina qué componentes de chapa, pintura o piezas de plástico están dañadas en este coche: ${
        busqueda || "Vehículo"
      }. Saca estimaciones de reparación pericial y referencias aproximadas.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          modeloDetectado: { type: "STRING" },
          gravedad: { type: "STRING" },
          resumenDaños: { type: "STRING" },
          piezas: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                nombre: { type: "STRING" },
                refOEM: { type: "STRING" },
                refAftermarket: { type: "STRING" },
                horas: { type: "NUMBER" },
                accion: { type: "STRING" },
                precioAprox: { type: "NUMBER" },
              },
              required: ["nombre", "refOEM", "refAftermarket", "horas", "accion", "precioAprox"],
            },
          },
        },
        required: ["modeloDetectado", "gravedad", "resumenDaños", "piezas"],
      };
    } else {
      promptText = `Analiza la pintura del vehículo en esta foto. Identifica la formulación del color y proporciona el código de pintura OEM oficial sugerido para mezclas en taller.`;
      responseSchema = {
        type: "OBJECT",
        properties: {
          colorDetectado: { type: "STRING" },
          codigoOEMPrincipal: { type: "STRING" },
          otrosCodigosPosibles: { type: "ARRAY", items: { type: "STRING" } },
          tipoPintura: { type: "STRING" },
          notesPericiales: { type: "STRING" },
        },
        required: ["colorDetectado", "codigoOEMPrincipal", "otrosCodigosPosibles", "tipoPintura", "notasPericiales"],
      };
    }

    try {
      const clientApiKey = config?.geminiApiKey || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "AIzaSyBzlFVEBAU2N0dPhRX5CDb4XLHHzB4yvts";
      let parsedResult: any = null;
      let callSuccess = false;

      if (clientApiKey) {
        // Direct client-side call to Gemini Vision API with multiple models retry loop
        const clientModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        let lastClientErr: any = null;

        for (const modelName of clientModels) {
          try {
            console.log(`Intentando llamada visión directa cliente con modelo: ${modelName}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${clientApiKey}`;
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        inlineData: {
                          mimeType: imagenMime || "image/jpeg",
                          data: imagenAAnalizar,
                        },
                      },
                      { text: promptText },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: responseSchema,
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                parsedResult = JSON.parse(text.trim());
                callSuccess = true;
                break;
              }
            } else {
              const errData = await response.json().catch(() => ({}));
              lastClientErr = new Error(errData?.error?.message || `Error HTTP ${response.status}`);
            }
          } catch (err: any) {
            lastClientErr = err;
          }
        }

        if (!callSuccess) {
          console.warn("Llamadas de visión directa desde el cliente fallaron. Reintentando por servidor proxy...", lastClientErr);
        }
      }

      if (!callSuccess) {
        // Fallback or primary to proxying through our Node server (which has high-availability retry)
        const response = await fetch("/api/gemini/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            schema: responseSchema,
            image: imagenAAnalizar,
            mimeType: imagenMime || "image/jpeg",
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error || `Error HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data?.result) {
          parsedResult = data.result;
        } else {
          throw new Error("No se pudo obtener el resultado del peritaje visual.");
        }
      }

      setResultadosVision(parsedResult);
    } catch (err: any) {
      console.error("Fallo Visión IA:", err);
      setError(err.message || "Error al procesar la imagen de carrocería");
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosFallback = () => {
    setError("");
    if (tipoBusqueda === "tiempos") {
      setResultados({
        operacion: piezaOperacion || "Sustitución de Filtros",
        vehiculo: busqueda || "Vehículo Genérico",
        tiempoOficial: "1.80 horas",
        dificultad: "Baja",
        pasosClave: [
          "Desmontar cubiertas plásticas protectoras",
          "Retirar abrazaderas de sujeción",
          "Extraer componente antiguo y limpiar receptáculo",
          "Instalar recambio oficial y ajustar aprietes",
        ],
      });
    } else if (tipoBusqueda === "aceite") {
      setResultados({
        vehiculo: busqueda || "Vehículo Genérico",
        litros: "4.5 Litros",
        viscosidad: "5W30 Sintético",
        notas: "Cumple con norma de fabricante oficial. Intervalo máximo 15,000 km.",
      });
    } else if (tipoBusqueda === "mantenimiento") {
      setResultados({
        mantenimientos: [
          {
            km: "90,000 km",
            operaciones: [
              "Sustitución de aceite de motor y filtro",
              "Cambio de filtro de habitáculo y aire",
              "Revisión de pastillas de freno delanteras",
            ],
            notas: "Revisar posibles holguras en rótulas de suspensión",
          },
        ],
      });
    } else if (tipoBusqueda === "esquemas") {
      setResultados({
        resumenTecnico: "Pernos de cárter de aceite y componentes críticos.",
        paresDeAprieteRecomendados: ["Tapón de vaciado: 30 Nm", "Filtro de aceite: 25 Nm"],
        terminosGoogleParaBuscarDiagramas: ["Manual de taller " + busqueda],
      });
    } else if (tipoBusqueda === "recambios") {
      setResultados({
        recambios: [
          {
            ref: "OEM-88992211",
            nombre: `${piezaOperacion || "Recambio"} de marca oficial`,
            precio: 38.5,
            stock: "Disponible en almacén local",
          },
        ],
      });
    } else if (tipoBusqueda === "campanas") {
      setResultados({
        campanas: [
          {
            titulo: "Llamada a revisión por manguito",
            descripcion: "Ciertos modelos experimentan pérdidas leves en latiguillo de retorno.",
            gravedad: "Media",
            afectados: "Gama fabricada en primer semestre del año",
          },
        ],
      });
    }
  };

  const getThemeBgClass = (color: string) => {
    return color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  };

  const getThemeTextClass = (color: string) => {
    return color === "red" ? "text-red-600 border-red-200" : "text-blue-600 border-blue-200";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
            themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          Asistente de Inteligencia
        </h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Tempario, repuestos y peritaje inteligente automatizado</p>
      </div>

      <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 ${
        themeColor === "red" ? "bg-red-50 border border-red-100" : "bg-blue-50 border border-blue-100"
      }`}>
        <div className={`flex items-center gap-1.5 font-black tracking-widest text-[9px] uppercase whitespace-nowrap ${
          themeColor === "red" ? "text-red-800" : "text-blue-800"
        }`}>
          <WrenchIcon className="w-4 h-4" /> Vehículo en Taller:
        </div>
        <select
          className="w-full bg-white border border-transparent rounded-xl px-4 py-2.5 outline-none font-bold text-xs text-slate-700 shadow-sm"
          onChange={(e) => {
            const c = arrClientes.find((x) => x.matricula === e.target.value);
            if (c) setBusqueda(c.marcaModelo || "");
          }}
        >
          <option value="">Vincular vehículo activo...</option>
          {arrClientes
            .filter((c) => c?.enTaller)
            .map((c) => (
              <option key={c.id} value={c.matricula}>
                {c.matricula} - {c.marcaModelo}
              </option>
            ))}
        </select>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-max">
        <button
          onClick={() => setSubModuloIA("web")}
          className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            subModuloIA === "web" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
          }`}
        >
          <Search className="w-3.5 h-3.5 inline mr-1" /> Diagnóstico Técnico
        </button>
        {appMode === "chapa" && (
          <button
            onClick={() => setSubModuloIA("vision")}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              subModuloIA === "vision" ? "bg-white shadow-sm text-red-600" : "text-slate-500"
            }`}
          >
            <Camera className="w-3.5 h-3.5 inline mr-1" /> Escáner Pericial
          </button>
        )}
      </div>

      {subModuloIA === "web" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: "tiempos", icon: <Clock className="w-5 h-5" />, label: "Tiempos" },
              { id: "recambios", icon: <Box className="w-5 h-5" />, label: "Recambios" },
              { id: "mantenimiento", icon: <Calendar className="w-5 h-5" />, label: "Intervalos" },
              { id: "aceite", icon: <Droplet className="w-5 h-5" />, label: "Aceites" },
              { id: "esquemas", icon: <BookOpen className="w-5 h-5" />, label: "Técnico" },
              { id: "campanas", icon: <Megaphone className="w-5 h-5" />, label: "Campañas" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTipoBusqueda(t.id);
                  setResultados(null);
                  setError("");
                }}
                className={`p-3 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all border flex flex-col items-center justify-center gap-1.5 h-20 cursor-pointer ${
                  tipoBusqueda === t.id
                    ? themeColor === "red"
                      ? "bg-red-600 border-red-600 text-white shadow"
                      : "bg-blue-600 border-blue-600 text-white shadow"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3">
              <div className="relative group">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && realizarBusquedaInteligente()}
                  placeholder="Marca, modelo o año (Ej: Audi A3 2014 2.0 TDI)"
                  className="input-premium"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={piezaOperacion}
                  onChange={(e) => setPiezaOperacion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && realizarBusquedaInteligente()}
                  placeholder="Pieza o avería (Ej: Alternador, Embrague)"
                  className="input-premium sm:col-span-1"
                />
                <input
                  type="text"
                  value={codigoMotor}
                  onChange={(e) => setCodigoMotor(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && realizarBusquedaInteligente()}
                  placeholder="Cód. Motor (Ej: CLHA)"
                  className="input-premium uppercase font-mono"
                />
                <input
                  type="number"
                  value={anoVehiculo}
                  onChange={(e) => setAnoVehiculo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && realizarBusquedaInteligente()}
                  placeholder="Año (Ej: 2015)"
                  className="input-premium"
                />
              </div>
            </div>

            <button
              onClick={realizarBusquedaInteligente}
              disabled={loading}
              className={`w-full text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex justify-center items-center gap-2 cursor-pointer ${
                tipoBusqueda === "campanas"
                  ? "bg-red-600 hover:bg-red-700"
                  : getThemeBgClass(themeColor)
              }`}
            >
              <Sparkles className="w-4 h-4" /> Consultar Inteligencia Artificial
            </button>
          </div>

          {memoriaEncontrada && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs flex flex-col gap-1.5 animate-slide-up">
              <span className="font-black text-emerald-800 uppercase tracking-wide">Caso resuelto en bitácora:</span>
              <p className="font-bold text-emerald-950">{memoriaEncontrada.titulo}</p>
              <p className="text-emerald-700 mt-1"><strong className="font-black">Solución:</strong> {memoriaEncontrada.solucion}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col gap-3 animate-fade-in mt-4">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Error de conexión con IA
              </div>
              <p className="text-red-700 text-[11px] font-medium bg-white p-2.5 rounded-lg border border-red-150 font-mono break-all shadow-sm">
                {error}
              </p>
              <div className="text-[10px] text-red-600 font-medium leading-relaxed bg-red-100/40 p-3 rounded-lg">
                <strong className="font-black block mb-1">Posible causa y solución:</strong> 
                Si el mensaje indica un error de clave, asegúrate de haber configurado tu secreto 
                <span className="font-mono bg-white px-1 py-0.5 rounded border text-red-800 font-bold ml-1">GEMINI_API_KEY</span> 
                en el panel de secretos en Google AI Studio. También confirma que la API 
                <strong>"Generative Language API"</strong> esté habilitada en tu consola GCP.
              </div>
              <button
                onClick={cargarDatosFallback}
                className="bg-white hover:bg-red-100 border border-red-200 text-red-800 px-4 py-2.5 rounded-lg text-[10px] font-bold transition-colors w-max cursor-pointer"
              >
                Cargar datos sin conexión (Offline)
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-black text-sm animate-pulse">
              <div className={`w-10 h-10 mx-auto mb-3 rounded-full border-4 border-slate-100 border-t-slate-500 animate-spin`}></div>
              PROCESANDO CONSULTA...
            </div>
          ) : (
            resultados && (
              <div className="space-y-4">
                {tipoBusqueda === "tiempos" && (
                  <div className="bg-white border border-blue-100 p-5 rounded-2xl animate-slide-up space-y-4 shadow-sm">
                    <h3 className="font-black text-slate-900 text-lg leading-tight">{resultados.operacion || ""}</h3>
                    <p className="text-blue-600 font-bold text-xs">{resultados.vehiculo || ""}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo Estimado</span>
                        <span className="text-4xl font-black text-slate-900 mt-1">{resultados.tiempoOficial || ""}</span>
                        <button
                          onClick={() => {
                            let hNum = 1.5;
                            const m = String(resultados.tiempoOficial).match(/[\d.,]+/);
                            if (m) hNum = parseFloat(m[0].replace(",", "."));
                            onAdd({
                              nombre: `Mano de Obra: ${resultados.operacion || ""}`,
                              cantidad: hNum,
                              precio: parseFloat(config?.precioManoObra as any) || 0,
                            });
                          }}
                          className={`mt-3 text-white px-4 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer ${getThemeBgClass(
                            themeColor
                          )}`}
                        >
                          <Plus className="w-3.5 h-3.5 inline mr-1" /> Añadir horas a Factura
                        </button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-slate-600">
                          Dificultad: <span className="text-blue-600 font-black">{resultados.dificultad || ""}</span>
                        </p>
                        <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border">
                          {(resultados.pasosClave || []).map((p: string, i: number) => (
                            <li key={i} className="text-slate-600 font-medium">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {tipoBusqueda === "aceite" && (
                  <div className="bg-white border border-slate-150 p-5 rounded-2xl animate-slide-up space-y-3 shadow-sm">
                    <h3 className="font-black text-slate-900 text-sm uppercase">{resultados.vehiculo || ""}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <span className="text-[10px] font-black text-slate-400">Capacidad</span>
                        <p className="text-3xl font-black text-slate-800 mt-1">{resultados.litros || ""}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">Viscosidad: {resultados.viscosidad || ""}</p>
                        <button
                          onClick={() => {
                            let lit = 4;
                            const m = String(resultados.litros).match(/[\d.,]+/);
                            if (m) lit = parseFloat(m[0].replace(",", "."));
                            onAdd({
                              nombre: `Aceite de Motor ${resultados.viscosidad || ""}`,
                              cantidad: lit,
                              precio: 12.0,
                            });
                          }}
                          className="mt-3 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          + Añadir a Factura
                        </button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl text-xs flex items-center border">
                        <p className="text-slate-600 font-medium leading-relaxed">{resultados.notas || ""}</p>
                      </div>
                    </div>
                  </div>
                )}

                {tipoBusqueda === "mantenimiento" && (
                  <div className="space-y-3 animate-slide-up">
                    {(resultados.mantenimientos || []).map((r: any, i: number) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            {r.km || ""}
                          </span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-600 font-medium mb-3">
                          {(r.operaciones || []).map((op: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {op}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border">
                          {r.notes || r.notas || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {tipoBusqueda === "esquemas" && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-150 animate-slide-up space-y-3 text-xs shadow-sm">
                    <p className="font-semibold text-slate-600">{resultados.resumenTecnico || ""}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                        <h4 className="font-bold text-orange-800 text-[10px] uppercase mb-1">Aprietes oficiales</h4>
                        <ul className="space-y-1 font-mono text-[10px] text-orange-950">
                          {(resultados.paresDeAprieteRecomendados || []).map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 text-[10px] uppercase mb-1">Buscar Diagramas</h4>
                        <div className="space-y-1">
                          {(resultados.terminosGoogleParaBuscarDiagramas || []).map((t: string, i: number) => (
                            <a
                              key={i}
                              href={`https://www.google.com/search?q=${encodeURIComponent(t)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-blue-600 hover:underline font-bold text-[10px] truncate"
                            >
                              🔍 {t}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tipoBusqueda === "recambios" && (
                  <div className="space-y-2 animate-slide-up">
                    {(resultados.recambios || []).map((r: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs shadow-sm hover:border-slate-300"
                      >
                        <div>
                          <span className="bg-slate-900 text-white font-mono px-2 py-0.5 rounded text-[9px] font-black">
                            {r.ref || ""}
                          </span>
                          <h4 className="font-bold text-slate-850 mt-1">{r.nombre || ""}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{r.stock || ""}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-black text-sm text-slate-900">{r.precio || 0}€</span>
                          <button
                            onClick={() =>
                              onAdd({
                                nombre: `${r.nombre || ""} (Ref: ${r.ref || ""})`,
                                cantidad: 1,
                                precio: r.precio || 0,
                              })
                            }
                            className={`text-white p-2 rounded-lg cursor-pointer ${getThemeBgClass(themeColor)}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tipoBusqueda === "campanas" && (
                  <div className="space-y-2 animate-slide-up">
                    {(resultados.campanas || []).map((c: any, i: number) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-red-100 relative text-xs shadow-sm">
                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                          {c.gravedad || ""}
                        </span>
                        <h4 className="font-black text-slate-900 leading-tight pr-20">{c.titulo || ""}</h4>
                        <p className="text-slate-500 mt-2 leading-relaxed">{c.descripcion || ""}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">Afectados: {c.afectados || ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setModoVision("golpe");
                setResultadosVision(null);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                modoVision === "golpe" ? "bg-red-600 text-white" : "bg-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Peritación Óptica
            </button>
            <button
              onClick={() => {
                setModoVision("color");
                setResultadosVision(null);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                modoVision === "color" ? "bg-purple-600 text-white" : "bg-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Colorimetría
            </button>
          </div>

          {!imagenPreview ? (
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <label className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-center">
                <Camera className="w-8 h-8 text-slate-400 mb-3" />
                <span className="font-bold text-sm text-slate-800">Cámara</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase">Tomar Foto Directa</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <label className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-center">
                <ImageIcon className="w-8 h-8 text-slate-400 mb-3" />
                <span className="font-bold text-sm text-slate-800">Archivo</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase">Subir desde Galería</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-900 shadow-lg bg-black">
              <img src={imagenPreview} alt="Captura pericial" className="w-full max-h-[40vh] object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="bg-white text-slate-900 font-black px-4 py-2 rounded-xl cursor-pointer text-xs">
                  Cambiar Foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          )}

          <button
            onClick={realizarAnalisisVision}
            disabled={loading || !imagenAAnalizar}
            className={`w-full text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
              loading || !imagenAAnalizar
                ? "bg-slate-300"
                : modoVision === "golpe"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Analizando imagen pericial..." : "Ejecutar Reconocimiento Visual"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col gap-3 animate-fade-in mt-4">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Error de conexión con IA (Visión)
              </div>
              <p className="text-red-700 text-[11px] font-medium bg-white p-2.5 rounded-lg border border-red-150 font-mono break-all shadow-sm">
                {error}
              </p>
              <div className="text-[10px] text-red-600 font-medium leading-relaxed bg-red-100/40 p-3 rounded-lg">
                <strong className="font-black block mb-1">Causa:</strong> 
                Para procesar imágenes de peritaje visual, Google requiere que tu clave secreta de API esté habilitada y configurada correctamente en el panel de secretos de Google AI Studio.
              </div>
            </div>
          )}

          {resultadosVision && (
            <div className="space-y-4">
              {modoVision === "golpe" ? (
                <div className="bg-white p-5 rounded-2xl border border-slate-150 animate-slide-up space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight">
                      {resultadosVision.modeloDetectado || ""}
                    </h3>
                    <span className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-2.5 py-1 rounded-lg mt-1 inline-block border border-red-200">
                      Gravedad: {resultadosVision.gravedad || ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl font-medium leading-relaxed border">
                    {resultadosVision.resumenDaños || ""}
                  </p>
                  <div className="space-y-2">
                    {(resultadosVision.piezas || []).map((p: any, i: number) => (
                      <div key={i} className="bg-white border p-3 rounded-xl flex justify-between items-center text-xs hover:border-slate-300">
                        <div>
                          <h4 className="font-bold text-slate-900 leading-tight">{p.nombre || ""}</h4>
                          <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-red-100">
                            {p.accion || ""}
                          </span>
                          <p className="font-mono text-[9px] text-slate-400 mt-1">
                            OEM: {p.refOEM || ""} | ALT: {p.refAftermarket || ""}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-black text-slate-800">{p.horas || 0} Horas</p>
                            <p className="text-[9px] text-slate-450 mt-0.5">Est: {p.precioAprox || 0}€</p>
                          </div>
                          <button
                            onClick={() => {
                              const desc = `Sustitución: ${p.nombre || ""}\nRef OEM: ${p.refOEM || ""}\nTrabajo: ${
                                p.accion || ""
                              }`;
                              onAdd({
                                nombre: desc,
                                cantidad: p.horas || 0,
                                precio: parseFloat(config?.precioManoObra as any) || 0,
                              });
                            }}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-2xl border border-slate-150 animate-slide-up space-y-4 shadow-sm">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight">
                      {resultadosVision.colorDetectado || ""}
                    </h3>
                    <p className="text-xs text-purple-600 font-bold uppercase mt-1">{resultadosVision.tipoPintura || ""}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center border">
                    <span className="text-[10px] font-bold text-slate-400 block">Código Oficial OEM</span>
                    <span className="font-mono font-black text-3xl text-slate-900 mt-1 block">
                      {resultadosVision.codigoOEMPrincipal || ""}
                    </span>
                    <div className="flex gap-1 justify-center mt-2 flex-wrap">
                      {(resultadosVision.otrosCodigosPosibles || []).map((c: string, i: number) => (
                        <span key={i} className="font-mono text-[9px] text-slate-500 bg-white px-2 py-0.5 rounded border">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border">
                    {resultadosVision.notasPericiales || ""}
                  </div>
                  <button
                    onClick={() => {
                      onAdd({
                        nombre: `Pintura / Disolvente: ${resultadosVision.colorDetectado || ""} (OEM: ${
                          resultadosVision.codigoOEMPrincipal || ""
                        })`,
                        cantidad: 1,
                        precio: 38.0,
                      });
                    }}
                    className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-800"
                  >
                    + Añadir Material Pintura a Factura
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple placeholder fallback icon for Wrench
function WrenchIcon(props: any) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      style={{ width: "1em", height: "1em" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      ></path>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
  );
}
