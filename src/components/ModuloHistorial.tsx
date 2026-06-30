import React, { useState } from "react";
import { Cliente, DocumentoDraft } from "../types";
import { Users, Search, ChevronDown, Phone, Trash2, ArrowRight } from "lucide-react";

interface Props {
  clientesDB: Cliente[];
  setClientesDB: React.Dispatch<React.SetStateAction<Cliente[]>>;
  documentosDB: DocumentoDraft[];
  onEditarDoc: (id: string) => void;
  mostrarNotificacion: (mensaje: string) => void;
  pedirConfirmacion: (mensaje: string, accion: () => void) => void;
  themeColor: string;
}

export default function ModuloHistorial({
  clientesDB,
  setClientesDB,
  documentosDB,
  onEditarDoc,
  mostrarNotificacion,
  pedirConfirmacion,
  themeColor,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [clienteExpandido, setClienteExpandido] = useState<number | null>(null);

  const arrClientes = Array.isArray(clientesDB) ? clientesDB : [];
  const filtrados = arrClientes.filter(
    (c) =>
      (c?.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c?.matricula || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c?.telefono || "").includes(busqueda)
  );

  const borrarCliente = (id: number) => {
    pedirConfirmacion("¿Deseas eliminar permanentemente esta ficha?", () => {
      setClientesDB((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c.id !== id));
      mostrarNotificacion("Ficha de cliente eliminada.");
      if (clienteExpandido === id) setClienteExpandido(null);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${
            themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}>
            <Users className="w-5 h-5" />
          </div>
          Archivo de Clientes
        </h2>
        <p className="text-slate-500 font-medium mt-1 text-sm">Búsqueda de expedientes y consulta del historial de facturas</p>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 p-4 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm bg-white"
          placeholder="Buscar por cliente, matrícula..."
        />
      </div>

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="font-bold text-slate-400 text-xs">Ningún expediente registrado.</p>
          </div>
        ) : (
          filtrados.map((c) => (
            <div key={c.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setClienteExpandido(clienteExpandido === c.id ? null : c.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    themeColor === "red" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {c?.nombre ? c.nombre.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 leading-none">{c?.nombre || "Sin Nombre"}</h3>
                    <p className="font-bold text-slate-400 text-[10px] mt-1 flex items-center gap-1.5">
                      <span className="uppercase text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[9px]">
                        {c?.matricula || ""}
                      </span>
                      <span>{c?.marcaModelo || "Modelo Genérico"}</span>
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-300 transition-transform ${
                    clienteExpandido === c.id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {clienteExpandido === c.id && (
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <h4 className="font-bold text-[9px] tracking-widest uppercase text-slate-400">Datos del Expediente</h4>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center gap-2 text-xs">
                      <Phone className="w-4 h-4 text-slate-300" />
                      <span className="font-bold text-slate-700">{c?.telefono || "Sin teléfono"}</span>
                    </div>
                    {c?.telefono && (
                      <button
                        onClick={() => window.open(`https://wa.me/${c.telefono.replace(/\s+/g, "")}`, "_blank")}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 w-full shadow-sm cursor-pointer"
                      >
                        Enviar WhatsApp
                      </button>
                    )}
                    <button
                      onClick={() => borrarCliente(c.id)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center justify-center gap-2 w-full py-2 bg-red-50 rounded-lg transition-colors mt-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar Ficha
                    </button>
                  </div>
                  <div className="flex-[2]">
                    <h4 className="font-bold text-[9px] tracking-widest uppercase text-slate-400 mb-3">Historial de Trabajos</h4>
                    {!c?.historial || c.historial.length === 0 ? (
                      <div className="bg-white p-4 rounded-xl border border-dashed text-center text-slate-400 text-xs">
                        Sin facturas en el histórico.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {c.historial.map((h, i) => (
                          <div
                            key={i}
                            className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center hover:border-blue-200"
                          >
                            <div>
                              <span className="font-black text-slate-900 text-xs block">{h.idDoc}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{h.fecha}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-800 text-sm">
                                {(h.total || 0).toFixed(2)}€
                              </span>
                              <button
                                onClick={() => onEditarDoc(h.idDoc)}
                                className="bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
