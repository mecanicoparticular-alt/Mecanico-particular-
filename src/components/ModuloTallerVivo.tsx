import React from "react";
import { Cliente, TallerConfig } from "../types";
import { Wrench, Phone, Check, ChevronDown, Warehouse, Flag } from "lucide-react";

interface Props {
  clientesDB: Cliente[];
  setClientesDB: React.Dispatch<React.SetStateAction<Cliente[]>>;
  config: TallerConfig;
  mostrarNotificacion: (mensaje: string) => void;
  pedirConfirmacion: (mensaje: string, accion: () => void) => void;
  themeColor: string;
}

export default function ModuloTallerVivo({
  clientesDB,
  setClientesDB,
  config,
  mostrarNotificacion,
  pedirConfirmacion,
  themeColor,
}: Props) {
  const arrClientes = Array.isArray(clientesDB) ? clientesDB : [];
  const cochesEnTaller = arrClientes.filter((c) => c?.enTaller === true);

  const actualizarEstado = (matricula: string, nuevoEstado: string) => {
    setClientesDB((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) =>
        c.matricula === matricula ? { ...c, estadoActual: nuevoEstado } : c
      )
    );
    mostrarNotificacion("Fase de reparación actualizada.");
  };

  const darSalida = (matricula: string) => {
    pedirConfirmacion("¿Deseas marcar la entrega de este vehículo?", () => {
      setClientesDB((prev) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.matricula === matricula ? { ...c, enTaller: false, estadoActual: "Entregado" } : c
        )
      );
      mostrarNotificacion("Vehículo entregado al cliente.");
    });
  };

  const notificarPorWhatsApp = (cliente: Cliente) => {
    if (!cliente?.telefono) {
      mostrarNotificacion("Teléfono de contacto no disponible.");
      return;
    }
    const txt = `Hola ${cliente.nombre || ""},%0A%0AInformamos de que el estado de su vehículo *${
      cliente.marcaModelo || ""
    }* (${cliente.matricula}) es:%0A%0A*${(
      cliente.estadoActual || "Recibido"
    ).toUpperCase()}*%0A%0AUn saludo de ${config?.nombreComercial || "Mecánico Particular"}.`;
    window.open(`https://wa.me/${cliente.telefono.replace(/\s+/g, "")}?text=${txt}`, "_blank");
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Recibido":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "Diagnosticando":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "Esperando Piezas":
        return "bg-orange-50 text-orange-800 border-orange-300";
      case "En Reparación":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "Terminado":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-50 text-slate-850";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
            themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}>
            <Wrench className="w-5 h-5" />
          </div>
          Control en Vivo
        </h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Progreso operativo de vehículos en taller</p>
      </div>

      {cochesEnTaller.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Warehouse className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Planta Vacía</h3>
          <p className="text-slate-400 font-medium text-xs mt-1">
            Registra nuevos ingresos en la pestaña "Recepción".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cochesEnTaller.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between"
            >
              <div className="border-b border-slate-100 pb-4 mb-4">
                <span className="bg-slate-900 text-white font-mono font-black px-2 py-1 rounded text-xs uppercase">
                  {c.matricula}
                </span>
                <h3 className="font-black text-lg mt-2 tracking-tight text-slate-900">
                  {c.marcaModelo || "Modelo Genérico"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-300" /> {c.nombre} ({c.telefono})
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Estado de Reparación
                  </label>
                  <div className="relative">
                    <select
                      value={c.estadoActual || "Recibido"}
                      onChange={(e) => actualizarEstado(c.matricula, e.target.value)}
                      className={`w-full p-3 rounded-xl border font-bold text-xs outline-none cursor-pointer appearance-none transition-colors ${getEstadoColor(
                        c.estadoActual || "Recibido"
                      )}`}
                    >
                      <option value="Recibido">📥 Recibido</option>
                      <option value="Diagnosticando">🔍 En Diagnóstico</option>
                      <option value="Esperando Piezas">📦 Esperando Recambios</option>
                      <option value="En Reparación">🔧 En Reparación</option>
                      <option value="Terminado">✅ Listo para Entregar</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-40" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => notificarPorWhatsApp(c)}
                    className="flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white p-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all text-xs border border-emerald-200 cursor-pointer"
                  >
                    Notificar Cliente
                  </button>
                  <button
                    onClick={() => darSalida(c.matricula)}
                    className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 px-4 rounded-xl font-bold transition-all text-xs border border-slate-200 cursor-pointer"
                    title="Dar salida"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
