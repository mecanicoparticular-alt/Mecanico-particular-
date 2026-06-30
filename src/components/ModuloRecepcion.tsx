import React, { useState, useRef, useEffect } from "react";
import { Cliente, DocumentoDraft, TallerConfig } from "../types";
import { 
  Car, User, Phone, CreditCard, MapPin, Mic, Camera, Trash2, 
  FileSignature, AlertTriangle, Check, CheckCircle, XCircle, Minus, Plus 
} from "lucide-react";

interface Props {
  syncConPresupuesto: React.Dispatch<React.SetStateAction<DocumentoDraft>>;
  registrarIngresoEnTaller: (datos: {
    nombre: string;
    dni: string;
    telefono: string;
    direccion: string;
    matricula: string;
    marcaModelo: string;
    bastidor: string;
    kilometros: string;
    motivo: string;
  }) => void;
  mostrarNotificacion: (mensaje: string) => void;
  clientesDB: Cliente[];
  config: TallerConfig;
  setActiveTab: (tab: string) => void;
  appMode: "mecanica" | "chapa" | null;
  themeColor: string;
}

const PARTES_COCHE_SVG = [
  { id: "paragolpes_d", name: "Paragolpes Del.", d: "M30,20 Q100,5 170,20 L175,40 L25,40 Z" },
  { id: "capo", name: "Capó", d: "M25,45 L175,45 L160,110 L40,110 Z" },
  { id: "aleta_di", name: "Aleta Del. Izq.", d: "M25,45 L10,45 L10,110 L40,110 Z" },
  { id: "aleta_dd", name: "Aleta Del. Der.", d: "M175,45 L190,45 L190,110 L160,110 Z" },
  { id: "parabrisas", name: "Parabrisas", d: "M40,115 L160,115 L150,145 L50,145 Z" },
  { id: "techo", name: "Techo", d: "M50,150 L150,150 L150,250 L50,250 Z" },
  { id: "puerta_di", name: "Puerta Del. Izq.", d: "M10,115 L40,115 L50,145 L50,190 L10,190 Z" },
  { id: "puerta_dd", name: "Puerta Del. Der.", d: "M190,115 L160,115 L150,145 L150,190 L190,190 Z" },
  { id: "puerta_ti", name: "Puerta Tras. Izq.", d: "M10,195 L50,195 L50,250 L40,280 L10,280 Z" },
  { id: "puerta_td", name: "Puerta Tras. Der.", d: "M190,195 L150,195 L150,250 L160,280 L190,280 Z" },
  { id: "luna_tras", name: "Luneta Tras.", d: "M50,255 L150,255 L160,280 L40,280 Z" },
  { id: "maletero", name: "Maletero", d: "M40,285 L160,285 L175,345 L25,345 Z" },
  { id: "aleta_ti", name: "Aleta Tras. Izq.", d: "M10,285 L40,285 L25,345 L10,345 Z" },
  { id: "aleta_td", name: "Aleta Tras. Der.", d: "M190,285 L160,285 L175,345 L190,345 Z" },
  { id: "paragolpes_t", name: "Paragolpes Tras.", d: "M25,350 L175,350 L170,370 Q100,385 30,370 Z" },
  { id: "faro_i", name: "Faro Izq.", d: "M35,25 L65,17 L70,35 L32,35 Z" },
  { id: "faro_d", name: "Faro Der.", d: "M165,25 L135,17 L130,35 L168,35 Z" },
  { id: "piloto_i", name: "Piloto Izq.", d: "M28,348 L65,348 L62,360 L30,360 Z" },
  { id: "piloto_d", name: "Piloto Der.", d: "M172,348 L135,348 L138,360 L170,360 Z" },
  { id: "espejo_i", name: "Espejo Izq.", d: "M0,115 L8,115 L8,130 L0,130 Z" },
  { id: "espejo_d", name: "Espejo Der.", d: "M192,115 L200,115 L200,130 L192,130 Z" },
];

const ensureHtml2Pdf = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) {
      resolve((window as any).html2pdf);
      return;
    }

    const existingScript = document.querySelector('script[src*="html2pdf"]');
    if (existingScript) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).html2pdf) {
          clearInterval(interval);
          resolve((window as any).html2pdf);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error("No se pudo cargar la librería html2pdf."));
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
      } else {
        const fallbackScript = document.createElement("script");
        fallbackScript.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
        fallbackScript.async = true;
        fallbackScript.onload = () => {
          if ((window as any).html2pdf) {
            resolve((window as any).html2pdf);
          } else {
            reject(new Error("No se pudo cargar la librería html2pdf desde los servidores alternativos."));
          }
        };
        fallbackScript.onerror = () => reject(new Error("No se pudo cargar html2pdf."));
        document.body.appendChild(fallbackScript);
      }
    };
    script.onerror = () => {
      const fallbackScript = document.createElement("script");
      fallbackScript.src = "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
      fallbackScript.async = true;
      fallbackScript.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error("No se pudo cargar la librería html2pdf desde el CDN alternativo."));
        }
      };
      fallbackScript.onerror = () => reject(new Error("No se pudo cargar html2pdf."));
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  });
};

export default function ModuloRecepcion({
  syncConPresupuesto,
  registrarIngresoEnTaller,
  mostrarNotificacion,
  clientesDB,
  config,
  setActiveTab,
  appMode,
  themeColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fotos, setFotos] = useState<string[]>([]);
  const [datos, setDatos] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    direccion: "",
    matricula: "",
    marcaModelo: "",
    bastidor: "",
    kilometros: "",
    motivo: "",
  });
  const [isListeningField, setIsListeningField] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, string | null>>({});
  const [vistaInspeccion, setVistaInspeccion] = useState<"mapa" | "checklist">(
    appMode === "chapa" ? "mapa" : "checklist"
  );
  const [danosCarroceria, setDanosCarroceria] = useState<Record<string, number>>({});

  const toggleDano = (id: string) => {
    setDanosCarroceria((prev) => {
      const current = prev[id] || 0;
      return { ...prev, [id]: (current + 1) % 3 };
    });
  };

  const getCarPartStyle = (level: number) => {
    if (level === 1) return { fill: "#fef08a", stroke: "#eab308" }; // amarillo leve
    if (level === 2) return { fill: "#fca5a5", stroke: "#ef4444" }; // rojo grave
    return { fill: "#f8fafc", stroke: "#cbd5e1" };
  };

  const CATEGORIAS_CHECKLIST_MECANICA = [
    {
      titulo: "Exterior y Carrocería",
      items: [
        { id: "chapa", label: "Carrocería Visual" },
        { id: "lunas", label: "Parabrisas y Lunas" },
        { id: "espejos", label: "Espejos" },
        { id: "limpias", label: "Limpiaparabrisas" },
      ],
    },
    {
      titulo: "Iluminación",
      items: [
        { id: "luces_cruce", label: "Luces de Cruce" },
        { id: "luces_largas", label: "Largas / Intermitentes" },
        { id: "freno", label: "Luces de Freno" },
      ],
    },
    {
      titulo: "Neumáticos y Frenos",
      items: [
        { id: "presion_neu", label: "Presión / Desgaste" },
        { id: "pastillas", label: "Frenos (Estado)" },
      ],
    },
    {
      titulo: "Motor y Niveles",
      items: [
        { id: "aceite_motor", label: "Nivel Aceite" },
        { id: "anticongelante", label: "Anticongelante" },
        { id: "bateria", label: "Batería" },
      ],
    },
  ];

  const CATEGORIAS_CHECKLIST_CHAPA = [
    {
      titulo: "Daños Frontales y Traseros",
      items: [
        { id: "paragolpes_d", label: "Paragolpes Delantero" },
        { id: "paragolpes_t", label: "Paragolpes Trasero" },
        { id: "capo", label: "Capó y Calandra" },
      ],
    },
    {
      titulo: "Laterales",
      items: [
        { id: "aleta_di", label: "Aleta Delantera" },
        { id: "puertas_i", label: "Lateral Izquierdo" },
        { id: "puertas_d", label: "Lateral Derecho" },
      ],
    },
    {
      titulo: "Pintura",
      items: [
        { id: "pintura_gen", label: "Estado Laca" },
        { id: "rayones", label: "Rayones / Abolladuras" },
      ],
    },
  ];

  const CATEGORIAS_CHECKLIST = appMode === "chapa" ? CATEGORIAS_CHECKLIST_CHAPA : CATEGORIAS_CHECKLIST_MECANICA;

  const toggleCheck = (item: string) => {
    setChecklist((prev) => {
      const actual = prev[item];
      if (!actual) return { ...prev, [item]: "ok" };
      if (actual === "ok") return { ...prev, [item]: "aviso" };
      if (actual === "aviso") return { ...prev, [item]: "mal" };
      return { ...prev, [item]: null };
    });
  };

  const getCheckColor = (status: string | null) => {
    if (status === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "aviso") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "mal") return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-400 border-slate-200";
  };

  const renderCheckIcon = (status: string | null) => {
    if (status === "ok") return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (status === "aviso") return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (status === "mal") return <XCircle className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const handleMatriculaBlur = () => {
    if (!datos?.matricula) return;
    const arr = Array.isArray(clientesDB) ? clientesDB : [];
    const c = arr.find((x) => x?.matricula?.toUpperCase() === datos.matricula.trim().toUpperCase());
    if (c) {
      setDatos((p) => ({
        ...p,
        nombre: c.nombre,
        dni: c.dni || "",
        telefono: c.telefono,
        marcaModelo: c.marcaModelo,
      }));
      mostrarNotificacion("Ficha de cliente reconocida automáticamente.");
    }
  };

  const iniciarDictadoCampo = (campo: string) => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      mostrarNotificacion("Reconocimiento de voz no soportado en este navegador.");
      return;
    }

    const r = new SpeechRecognition();
    r.lang = "es-ES";
    r.onstart = () => setIsListeningField(campo);
    r.onresult = (e: any) => {
      let transcript = e.results[0][0].transcript;
      if (campo === "kilometros") transcript = transcript.replace(/[^0-9]/g, "");
      setDatos((p) => ({ ...p, [campo]: transcript }));
    };
    r.onend = () => setIsListeningField(null);
    r.start();
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPos(e);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const enviarWhatsAppPDFRecepcion = async () => {
    if (!datos?.telefono) {
      mostrarNotificacion("Introduce el teléfono para remitir el resguardo.");
      return;
    }
    mostrarNotificacion("Compilando resguardo en PDF...");
    const element = document.getElementById("resguardo-a-imprimir");
    const nombreArchivo = `Resguardo_${datos?.matricula || "Ingreso"}.pdf`;
    const opt = {
      margin: 0.5,
      filename: nombreArchivo,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    try {
      const html2pdf = await ensureHtml2Pdf();
      if (!html2pdf) {
        throw new Error("Librería html2pdf no está cargada.");
      }

      const pdfBlob = await html2pdf().set(opt).from(element).output("blob");
      const file = new File([pdfBlob], nombreArchivo, { type: "application/pdf" });
      const msj = `Hola ${datos?.nombre || ""}, adjuntamos el resguardo oficial de recepción de tu coche ${
        datos?.marcaModelo || ""
      } (${datos?.matricula || ""}).`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Resguardo ${datos?.matricula}`, text: msj, files: [file] });
      } else {
        html2pdf().set(opt).from(element).save();
        setTimeout(() => {
          window.open(
            `https://wa.me/${datos.telefono.replace(/\s+/g, "")}?text=${encodeURIComponent(msj)}`,
            "_blank"
          );
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion("Error al compilar resguardo de recepción.");
    }
  };

  const procesarRecepcion = () => {
    if (!datos?.matricula) {
      mostrarNotificacion("La matrícula es un requisito obligatorio.");
      return;
    }
    registrarIngresoEnTaller(datos);
    syncConPresupuesto((p) => ({
      ...p,
      cliente: datos.nombre,
      dni: datos.dni,
      telefono: datos.telefono,
      matricula: datos.matricula,
      vehiculo: datos.marcaModelo,
    }));
    mostrarNotificacion("Vehículo guardado en el módulo en vivo.");
    setActiveTab("taller");
  };

  const renderInput = (campo: string, placeholder: string, type = "text", uppercase = false, icon: React.ReactNode = null) => {
    return (
      <div className="relative flex-1 w-full group">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={campo}
          value={(datos as any)[campo] || ""}
          onChange={(e) =>
            setDatos({
              ...datos,
              [campo]: uppercase ? e.target.value.toUpperCase() : e.target.value,
            })
          }
          onBlur={campo === "matricula" ? handleMatriculaBlur : undefined}
          className={`input-premium ${icon ? "pl-11" : ""} ${
            isListeningField === campo ? "ring-2 ring-red-400 bg-red-50" : ""
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => iniciarDictadoCampo(campo)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-blue-500 print-hidden"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 print:space-y-4 animate-fade-in pb-10">
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
            themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}>
            <Car className="w-5 h-5" />
          </div>
          Entrada de Vehículo
        </h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Recepción oficial y hoja de encargo de taller</p>
      </div>

      <div
        id="resguardo-a-imprimir"
        className="space-y-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0"
      >
        {/* Print Header */}
        <div className="hidden print:block border-b-2 border-slate-950 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-black text-2xl uppercase">
                {config?.nombreComercial || "Mecánico Particular"}
              </h3>
              <p className="text-xs text-slate-600">
                {config?.razonSocial || ""} | {config?.cif || ""}
              </p>
              <p className="text-xs text-slate-600">
                {config?.direccion || ""} | Telf: {config?.telefono || ""}
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-black text-slate-400 uppercase">Resguardo de Entrada</h1>
              <p className="font-mono text-sm mt-1">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:p-0">
          <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center print-hidden text-xs ${
              themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            }`}>
              <Car className="w-3.5 h-3.5" />
            </span>
            1. Ficha del Vehículo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {renderInput("matricula", "Matrícula", "text", true, <Car className="w-4 h-4" />)}
            {renderInput("marcaModelo", "Marca / Modelo", "text", false, <Car className="w-4 h-4" />)}
            {renderInput("bastidor", "Bastidor / VIN", "text", true, <Car className="w-4 h-4" />)}
            {renderInput("kilometros", "Kilometraje", "text", false, <Car className="w-4 h-4" />)}
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 print:bg-white print:p-0">
          <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center print-hidden text-xs ${
              themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            }`}>
              <User className="w-3.5 h-3.5" />
            </span>
            2. Ficha de Contacto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderInput("nombre", "Nombre del Cliente", "text", false, <User className="w-4 h-4" />)}
            {renderInput("telefono", "Móvil WhatsApp", "tel", false, <Phone className="w-4 h-4" />)}
            {renderInput("dni", "DNI / CIF", "text", true, <CreditCard className="w-4 h-4" />)}
            {renderInput("direccion", "Dirección", "text", false, <MapPin className="w-4 h-4" />)}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase">
                3. Diagnosis Inicial
              </h3>
              <button
                type="button"
                onClick={() => iniciarDictadoCampo("motivo")}
                className={`print-hidden text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                  isListeningField === "motivo"
                    ? "bg-red-500 text-white animate-pulse"
                    : themeColor === "red"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> Dictar Avería
              </button>
            </div>
            <textarea
              value={datos?.motivo || ""}
              onChange={(e) => setDatos({ ...datos, motivo: e.target.value })}
              className="w-full p-4 border border-slate-200 rounded-2xl h-36 outline-none resize-none font-medium text-slate-700 bg-slate-50/50 focus:bg-white focus:border-blue-500"
              placeholder="Describe los síntomas observados o el motivo de la intervención..."
            ></textarea>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase">
                4. Estado Carrocería
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-lg print-hidden">
                <button
                  type="button"
                  onClick={() => setVistaInspeccion("mapa")}
                  className={`text-[10px] font-bold px-3 py-1 rounded-md cursor-pointer ${
                    vistaInspeccion === "mapa" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Mapa Coche
                </button>
                <button
                  type="button"
                  onClick={() => setVistaInspeccion("checklist")}
                  className={`text-[10px] font-bold px-3 py-1 rounded-md cursor-pointer ${
                    vistaInspeccion === "checklist" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Puntos Control
                </button>
              </div>
            </div>

            {vistaInspeccion === "mapa" ? (
              <div className="animate-fade-in print-color-exact">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-40 flex-shrink-0">
                    <svg viewBox="-10 0 220 390" className="w-full h-auto drop-shadow-md">
                      <rect x="0" y="10" width="200" height="370" rx="24" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                      {PARTES_COCHE_SVG.map((part) => {
                        const style = getCarPartStyle(danosCarroceria[part.id] || 0);
                        return (
                          <path
                            key={part.id}
                            d={part.d}
                            fill={style.fill}
                            stroke={style.stroke}
                            strokeWidth="1.5"
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleDano(part.id)}
                          />
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex-1 w-full">
                    <h4 className="font-bold text-[10px] tracking-widest uppercase text-slate-400 mb-2">
                      Daños Seleccionados:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(danosCarroceria) as [string, number][]).filter(([_, lvl]) => lvl > 0).length === 0 ? (
                        <span className="text-[10px] font-medium text-slate-400">
                          Sin daños físicos seleccionados.
                        </span>
                      ) : (
                        (Object.entries(danosCarroceria) as [string, number][])
                          .filter(([_, lvl]) => lvl > 0)
                          .map(([id, lvl]) => (
                            <div
                              key={id}
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                                lvl === 1
                                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                  : "bg-red-50 text-red-800 border-red-200"
                              }`}
                            >
                              {PARTES_COCHE_SVG.find((p) => p.id === id)?.name} (
                              {lvl === 1 ? "Leve" : "Grave"})
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                {CATEGORIAS_CHECKLIST.map((cat, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl">
                    <h4 className="font-bold text-[10px] uppercase text-slate-600 mb-2">
                      {cat.titulo}
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className={`cursor-pointer flex items-center justify-between p-2 rounded-lg border transition-all text-[9px] font-bold uppercase truncate ${getCheckColor(
                            checklist[item.id] || null
                          )}`}
                        >
                          <span>{item.label}</span>
                          {renderCheckIcon(checklist[item.id] || null)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 print:bg-white print:p-0">
            <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase mb-4">
              5. Adjuntos Fotográficos
            </h3>
            <div className="flex flex-wrap gap-3">
              {fotos.map((f, i) => (
                <div key={i} className="relative group">
                  <img src={f} alt="Vehículo" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                  <div
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
                    onClick={() => setFotos(fotos.filter((_, index) => index !== i))}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
              <label className="w-16 h-16 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center rounded-xl cursor-pointer text-slate-400 transition-colors print-hidden">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFoto}
                />
              </label>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-900 text-xs tracking-widest uppercase">
                6. Firma de Conformidad
              </h3>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg print-hidden cursor-pointer"
              >
                Limpiar
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl bg-slate-50 relative overflow-hidden h-28">
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                className="w-full h-full cursor-crosshair canvas-firma"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <span className="absolute bottom-2 right-3 text-slate-300 font-mono text-[9px] pointer-events-none uppercase">
                Firma del Cliente
              </span>
            </div>
            <p className="text-[8px] text-slate-400 mt-2 leading-tight">
              El firmante declara su acuerdo con la orden de reparación, autoriza el movimiento vial del
              vehículo para pruebas de diagnóstico y consiente el tratamiento de datos LOPD.
            </p>
          </div>
        </div>
      </div>

      <div className="print-hidden flex flex-col sm:flex-row gap-3">
        <button
          onClick={procesarRecepcion}
          className={`btn-premium flex-1 cursor-pointer text-white ${
            themeColor === "red" ? "bg-red-600 hover:bg-red-700 shadow-red-500/10" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
          }`}
        >
          <FileSignature className="w-5 h-5" /> Registrar Ingreso
        </button>
        <button
          onClick={enviarWhatsAppPDFRecepcion}
          className="btn-premium flex-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/10 cursor-pointer"
        >
          Compartir Resguardo PDF
        </button>
      </div>
    </div>
  );
}
