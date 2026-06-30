import React from "react";
import { Cliente, DocumentoDraft, TallerConfig } from "../types";
import { Plus, TrendingUp, Car, Users, ChevronRight, Sparkles, Globe } from "lucide-react";

interface Props {
  config: TallerConfig;
  clientesDB: Cliente[];
  documentosDB: DocumentoDraft[];
  setActiveTab: (tab: string) => void;
  appMode: "mecanica" | "chapa" | null;
  themeColor: string;
}

export default function ModuloDashboard({
  config,
  clientesDB,
  documentosDB,
  setActiveTab,
  appMode,
  themeColor,
}: Props) {
  const arrDocs = Array.isArray(documentosDB) ? documentosDB : [];
  const arrClientes = Array.isArray(clientesDB) ? clientesDB : [];

  // Calculate total billing from saved documents
  const totalFacturado = arrDocs.reduce((acc, doc) => {
    const itemsTotal = (doc?.items || []).reduce(
      (sum, item) => sum + (item?.cantidad || 0) * (item?.precio || 0),
      0
    );
    return acc + itemsTotal * 1.21;
  }, 0);

  const ultimos = [...arrClientes].sort((a, b) => b.id - a.id).slice(0, 4);
  const cochesActivos = arrClientes.filter((c) => c?.enTaller === true).length;

  const getThemeColorClass = (color: string) => {
    return color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  };

  const getThemeTextClass = (color: string) => {
    return color === "red" ? "text-red-400" : "text-blue-400";
  };

  const getThemeBgClass = (color: string) => {
    return color === "red" ? "bg-red-500" : "bg-blue-500";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            ¡Hola, {config?.nombreComercial ? config.nombreComercial.split(" ")[0] : "Taller"}! 👋
          </h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Gestionando en{" "}
            <span className="font-bold text-slate-700">
              {appMode === "chapa" ? "Chapa y Pintura" : "Mecánica General"}
            </span>
            .
          </p>
        </div>
        <button
          onClick={() => setActiveTab("recepcion")}
          className={`w-full sm:w-auto text-white px-5 py-3 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all cursor-pointer ${getThemeColorClass(
            themeColor
          )} ${themeColor === "red" ? "shadow-red-500/20" : "shadow-blue-500/20"}`}
        >
          <Plus className="w-4 h-4" /> Nueva Entrada
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group border border-slate-800 flex flex-col justify-between min-h-[160px]">
          <div
            className={`absolute top-0 right-0 w-48 h-48 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:opacity-30 transition-opacity ${getThemeBgClass(
              themeColor
            )}`}
          ></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700">
              <TrendingUp className={`w-5 h-5 ${getThemeTextClass(themeColor)}`} />
            </div>
          </div>
          <div className="relative z-10">
            <h4 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-1">
              Volumen de Facturación (Histórico)
            </h4>
            <span className="text-3xl md:text-4xl font-black tracking-tighter">
              {totalFacturado.toLocaleString("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className={getThemeTextClass(themeColor)}>€</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div
            className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-200 transition-colors"
            onClick={() => setActiveTab("taller")}
          >
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {cochesActivos}
              </span>
              <h4 className="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-0.5">
                Coches en Taller
              </h4>
            </div>
          </div>
          <div
            className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm flex flex-col justify-between cursor-pointer hover:border-purple-200 transition-colors"
            onClick={() => setActiveTab("historial")}
          >
            <div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {arrClientes.length}
              </span>
              <h4 className="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-0.5">
                Total Expedientes
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-900 text-sm uppercase">Últimos Vehículos</h3>
            <button
              onClick={() => setActiveTab("historial")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {ultimos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Sin entradas recientes.
              </div>
            ) : (
              ultimos.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 rounded-xl flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("historial")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-xs uppercase border border-slate-150">
                      {c?.nombre ? c.nombre.charAt(0) : <Users className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{c?.nombre}</h4>
                      <span className="font-mono font-bold text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 mt-0.5 inline-block">
                        {c?.matricula}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
          <h3 className="font-black text-slate-900 text-sm uppercase mb-4">Herramientas Inteligentes</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab("data_ia")}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-950 hover:shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
              <span className="font-black text-xs text-slate-800">Gemini AI Activo</span>
            </button>
            <button
              onClick={() => setActiveTab("comunidad")}
              className="bg-gradient-to-br from-emerald-50 to-green-50 border border-green-100 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-green-950 hover:shadow-sm transition-all cursor-pointer"
            >
              <Globe className="w-6 h-6 text-emerald-600" />
              <span className="font-black text-xs text-slate-800">Red de Averías</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
