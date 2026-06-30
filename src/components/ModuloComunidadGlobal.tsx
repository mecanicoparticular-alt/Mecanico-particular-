import React, { useState } from "react";
import { AveriaResuelta, TallerConfig } from "../types";
import { BookOpen, FolderOpen, Search, Sparkles } from "lucide-react";

interface Props {
  mostrarNotificacion: (mensaje: string) => void;
  averias: AveriaResuelta[];
  setAverias: (averias: AveriaResuelta[]) => void;
  configTaller: TallerConfig;
  themeColor: string;
}

export default function ModuloComunidadGlobal({
  mostrarNotificacion,
  averias,
  setAverias,
  configTaller,
  themeColor,
}: Props) {
  const [nueva, setNueva] = useState({ titulo: "", sintomas: "", solucion: "" });
  const [busquedaMemoria, setBusquedaMemoria] = useState("");

  const arrAverias = Array.isArray(averias) ? averias : [];

  const publicar = () => {
    if (!nueva.titulo) {
      mostrarNotificacion("Por favor, introduce el título de la avería.");
      return;
    }
    const autor = configTaller?.nombreComercial || "Taller Mecánico Particular";
    const nuevaAveria: AveriaResuelta = {
      id: Date.now(),
      titulo: nueva.titulo,
      sintomas: nueva.sintomas,
      solucion: nueva.solucion,
      autor,
      createdAt: Date.now(),
      verificado: false,
    };

    setAverias([nuevaAveria, ...arrAverias]);
    mostrarNotificacion("Caso reportado en la bitácora local.");
    setNueva({ titulo: "", sintomas: "", solucion: "" });
  };

  const averiasFiltradas = arrAverias.filter(
    (a) =>
      (a?.titulo || "").toLowerCase().includes(busquedaMemoria.toLowerCase()) ||
      (a?.sintomas || "").toLowerCase().includes(busquedaMemoria.toLowerCase()) ||
      (a?.solucion || "").toLowerCase().includes(busquedaMemoria.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
              themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            Bitácora de Averías
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-sm">Tu registro personal y base de datos de casos resueltos</p>
        </div>
        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 w-max">
          <FolderOpen className="w-3.5 h-3.5" /> {arrAverias.length} Casos Guardados
        </span>
      </div>

      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        <h3 className="font-black text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Registrar Caso Resuelto
        </h3>
        <input
          value={nueva?.titulo || ""}
          onChange={(e) => setNueva({ ...nueva, titulo: e.target.value })}
          className="input-premium mb-3"
          placeholder="Avería resuelta (Ej: Fallo tirones caudalímetro TDI)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={nueva?.sintomas || ""}
            onChange={(e) => setNueva({ ...nueva, sintomas: e.target.value })}
            className="input-premium h-24 resize-none text-xs"
            placeholder="Síntomas que presentaba el coche..."
          ></textarea>
          <textarea
            value={nueva?.solucion || ""}
            onChange={(e) => setNueva({ ...nueva, solucion: e.target.value })}
            className="input-premium h-24 resize-none text-xs"
            placeholder="Cómo se solucionó, repuestos cambiados..."
          ></textarea>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={publicar}
            className={`font-bold text-xs uppercase py-3 px-6 rounded-xl transition-all cursor-pointer text-white ${
              themeColor === "red" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Guardar en Bitácora
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={busquedaMemoria}
          onChange={(e) => setBusquedaMemoria(e.target.value)}
          placeholder="Consultar registro de averías..."
          className="w-full pl-10 p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm bg-white"
        />
      </div>

      <div className="space-y-4">
        {averiasFiltradas.length === 0 ? (
          <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
            No se han encontrado casos registrados.
          </div>
        ) : (
          averiasFiltradas.map((a) => (
            <div key={a.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative">
              <h4 className="font-black text-lg text-slate-900 pr-16">{a.titulo || ""}</h4>
              <p className="text-[9px] text-slate-400 mt-1 uppercase">Aporte de: {a.autor || ""}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-[8px] font-black text-red-500 uppercase block mb-1">Síntomas</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{a.sintomas || ""}</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-lg">
                  <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Solución</span>
                  <p className="font-semibold text-emerald-950 leading-relaxed">{a.solucion || ""}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
