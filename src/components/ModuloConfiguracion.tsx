import React from "react";
import { TallerConfig } from "../types";
import { Settings, Image as ImageIcon, HardDrive, Save } from "lucide-react";

interface Props {
  config: TallerConfig;
  setConfig: (config: TallerConfig) => void;
  mostrarNotificacion: (mensaje: string) => void;
  themeColor: string;
}

export default function ModuloConfiguracion({ config, setConfig, mostrarNotificacion, themeColor }: Props) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setConfig({ ...config, logoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getThemeClass = (color: string) => {
    return color === "red"
      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 border-red-200 text-red-600 hover:bg-red-50"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 border-blue-200 text-blue-600 hover:bg-blue-50";
  };

  const getThemeTextClass = (color: string) => {
    return color === "red" ? "text-red-600" : "text-blue-600";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-10">
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
            themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}>
            <Settings className="w-5 h-5" />
          </div>
          Ajustes del Taller
        </h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Configuración comercial y de facturación</p>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          {config?.logoUrl ? (
            <img src={config.logoUrl} alt="Logotipo" className="w-20 h-20 object-contain border border-slate-200 rounded-xl p-1 bg-slate-50 shadow-sm" />
          ) : (
            <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <label className={`bg-white border px-4 py-2 rounded-lg cursor-pointer font-bold text-xs transition-all ${
            themeColor === "red" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-blue-200 text-blue-600 hover:bg-blue-50"
          }`}>
            Subir Logotipo
            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">Nombre Comercial</label>
            <input
              type="text"
              value={config?.nombreComercial || ""}
              onChange={(e) => setConfig({ ...config, nombreComercial: e.target.value })}
              className="input-premium"
              placeholder="Ej: Talleres GT"
            />
          </div>
          <div className="relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">Titular / Razón Social</label>
            <input
              type="text"
              value={config?.razonSocial || ""}
              onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
              className="input-premium"
              placeholder="Nombre de empresa"
            />
          </div>
          <div className="relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">CIF / NIF</label>
            <input
              type="text"
              value={config?.cif || ""}
              onChange={(e) => setConfig({ ...config, cif: e.target.value })}
              className="input-premium uppercase font-mono"
              placeholder="CIF"
            />
          </div>
          <div className="relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">Teléfono de Contacto</label>
            <input
              type="text"
              value={config?.telefono || ""}
              onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
              className="input-premium"
              placeholder="Teléfono"
            />
          </div>
          <div className="sm:col-span-2 relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">Dirección Física</label>
            <input
              type="text"
              value={config?.direccion || ""}
              onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              className="input-premium"
              placeholder="Calle, Número, Localidad"
            />
          </div>
          <div className="sm:col-span-2 relative group">
            <label className={`absolute -top-2 left-4 bg-white px-2 text-[8px] font-black uppercase ${
              themeColor === "red" ? "text-red-600" : "text-blue-600"
            }`}>Mano de Obra Oficial (€/Hora)</label>
            <input
              type="number"
              value={config?.precioManoObra || 0}
              onChange={(e) => setConfig({ ...config, precioManoObra: parseFloat(e.target.value) || 0 })}
              className={`w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-800 ${
                themeColor === "red" ? "focus:border-red-500 focus:ring-red-500/10" : "focus:border-blue-500 focus:ring-blue-500/10"
              }`}
            />
          </div>
        </div>

        <div className="relative group">
          <label className="absolute top-1 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase z-10">Términos de Garantía / Aviso Legal</label>
          <textarea
            value={config?.textoLegal || ""}
            onChange={(e) => setConfig({ ...config, textoLegal: e.target.value })}
            className="input-premium h-24 resize-none pt-4 text-[10px]"
            placeholder="Cláusula legal..."
          ></textarea>
        </div>

        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Configuración de Inteligencia Artificial (Gemini)</h3>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Para que las funciones inteligentes de diagnóstico y peritación por IA funcionen de forma autónoma en <strong>cualquier servidor web</strong> (incluyendo servidores estáticos como GitHub Pages, Netlify o Vercel sin servidor de Node), puedes introducir tu clave de API de Gemini aquí. Si se deja en blanco, la aplicación intentará usar el servidor backend Node.js.
          </p>
          <div className="relative group">
            <label className="absolute -top-2 left-4 bg-white px-2 text-[8px] font-black text-slate-400 uppercase">Clave API de Gemini (Opcional)</label>
            <input
              type="password"
              value={config?.geminiApiKey || ""}
              onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
              className="input-premium font-mono"
              placeholder="AIzaSy..."
            />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="font-black text-emerald-800 text-xs uppercase tracking-wider">Estado del Sistema</h4>
            <p className="text-[10px] text-emerald-600">Almacenamiento Local (Navegador)</p>
          </div>
          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <HardDrive className="w-3.5 h-3.5" /> DATA LOCAL
          </span>
        </div>
      </div>
      <button
        onClick={() => mostrarNotificacion("Configuración guardada en tu navegador de forma segura.")}
        className={`w-full text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-md flex justify-center items-center gap-2 transition-colors cursor-pointer ${
          themeColor === "red" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        <Save className="w-4 h-4" /> Guardar Preferencias
      </button>
    </div>
  );
}
