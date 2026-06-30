import React from "react";
import { Cliente, DocumentoDraft, TallerConfig } from "../types";
import { Trash2, Printer, Save, Share2, Plus, Clock, CreditCard, User, FileText, Download } from "lucide-react";

interface Props {
  draft: DocumentoDraft;
  setDraft: React.Dispatch<React.SetStateAction<DocumentoDraft>>;
  config: TallerConfig;
  onGuardar: (doc: DocumentoDraft) => void;
  clientesDB: Cliente[];
  mostrarNotificacion: (mensaje: string) => void;
  pedirConfirmacion: (mensaje: string, accion: () => void) => void;
  themeColor: string;
}

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

export default function ModuloPresupuestos({
  draft,
  setDraft,
  config,
  onGuardar,
  clientesDB,
  mostrarNotificacion,
  pedirConfirmacion,
  themeColor,
}: Props) {
  const arrClientes = Array.isArray(clientesDB) ? clientesDB : [];

  const actualizarItem = (id: number, campo: string, valor: any) => {
    setDraft((p) => ({
      ...p,
      items: (p?.items || []).map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      ),
    }));
  };

  const añadirLinea = (esManoDeObra = false) => {
    const concepto = esManoDeObra ? "Mano de obra (Horas)" : "";
    const precio = esManoDeObra ? parseFloat(config?.precioManoObra as any) || 0 : 0;
    setDraft((p) => ({
      ...p,
      items: [
        ...(p?.items || []),
        { id: Date.now() + Math.random(), concepto, cantidad: 1, precio },
      ],
    }));
  };

  const subtotal = (draft?.items || []).reduce(
    (acc, item) => acc + (item?.cantidad || 0) * (item?.precio || 0),
    0
  );
  const total = subtotal * 1.21;

  const enviarWhatsAppPDF = async () => {
    if (!draft?.telefono) {
      mostrarNotificacion("Introduce el teléfono del cliente para proceder.");
      return;
    }
    mostrarNotificacion("Compilando archivo PDF...");
    const element = document.getElementById("factura-a-imprimir");
    const nombreArchivo = `Doc_${draft?.id || "Nuevo"}.pdf`;
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
      const msj = `Hola ${draft?.cliente || ""}, adjuntamos tu presupuesto/factura para el vehículo ${
        draft?.vehiculo || ""
      }. Un saludo de ${config?.nombreComercial || "Mecánico Particular"}.`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Documento ${draft?.id || ""}`, text: msj, files: [file] });
      } else {
        html2pdf().set(opt).from(element).save();
        setTimeout(() => {
          window.open(
            `https://wa.me/${draft.telefono.replace(/\s+/g, "")}?text=${encodeURIComponent(msj)}`,
            "_blank"
          );
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion("Fallo al exportar el documento.");
    }
  };

  const descargarHTML = () => {
    const nombreArchivo = `Doc_${draft?.id || "Nuevo"}.html`;
    const subtotalLocal = (draft?.items || []).reduce(
      (acc, item) => acc + (item?.cantidad || 0) * (item?.precio || 0),
      0
    );
    const totalLocal = subtotalLocal * 1.21;
    const fechaActual = draft?.fecha || new Date().toLocaleDateString("es-ES");

    const itemsRows = (draft?.items || []).map((item) => `
      <tr class="border-b border-slate-100 text-sm">
        <td class="py-3 text-slate-800 font-medium whitespace-pre-wrap">${item.concepto || ""}</td>
        <td class="py-3 text-center text-slate-600 font-mono">${item.cantidad || 0}</td>
        <td class="py-3 text-right text-slate-600 font-mono">${(item.precio || 0).toFixed(2)}€</td>
        <td class="py-3 text-right text-slate-900 font-bold font-mono">${((item.cantidad || 0) * (item.precio || 0)).toFixed(2)}€</td>
      </tr>
    `).join("");

    const logoHtml = config?.logoUrl 
      ? `<img src="${config.logoUrl}" alt="Logo" class="max-h-16 max-w-[120px] object-contain mb-2" />`
      : "";

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${(draft?.id || "").startsWith("PRE") ? "Presupuesto" : "Factura"} - ${draft?.id || ""}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @media print {
      body { background-color: white !important; color: black !important; }
      .no-print { display: none !important; }
      .print-border-none { border: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
  <div class="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden print-border-none">
    
    <!-- Top Bar with controls -->
    <div class="no-print bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="font-black text-xs tracking-wider uppercase">Documento Auto-Generado</span>
      </div>
      <div class="flex gap-2">
        <button onclick="window.print()" class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.844l-.326-2.12a1.5 1.5 0 00-1.5-1.27H4.5A2.25 2.25 0 002.25 12.7v6.75A2.25 2.25 0 004.5 21.75h15A2.25 2.25 0 0021.75 19.5V12.7a2.25 2.25 0 00-2.25-2.25h-1.4c-.615 0-1.144-.395-1.3-.98l-.426-1.71a1.5 1.5 0 00-1.44-1.14h-5.46a1.5 1.5 0 00-1.44 1.14L6.72 13.844zm0 0l.326 2.12a1.5 1.5 0 001.5 1.27h7.5a1.5 1.5 0 001.5-1.27l.326-2.12M9 10.5V6a3 3 0 016 0v4.5m-7.4 8.25h8.8" />
          </svg>
          Imprimir
        </button>
      </div>
    </div>

    <!-- Document Content -->
    <div class="p-8 sm:p-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row justify-between border-b-2 border-slate-900 pb-8 mb-8 gap-6">
        <div>
          ${logoHtml}
          <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">${config?.nombreComercial || "MECÁNICO PARTICULAR"}</h1>
          <p class="font-bold text-xs text-slate-600 mt-1">${config?.razonSocial || ""}</p>
          <p class="font-mono text-xs text-slate-500 mt-0.5">CIF: ${config?.cif || ""}</p>
          <p class="text-xs text-slate-500 mt-1 max-w-sm">${config?.direccion || ""}</p>
          <p class="text-xs text-slate-600 font-bold mt-1">Teléfono: ${config?.telefono || ""}</p>
        </div>
        <div class="sm:text-right flex flex-col justify-between">
          <div>
            <span class="text-3xl font-black text-slate-300 tracking-tight uppercase block">${(draft?.id || "").startsWith("PRE") ? "PRESUPUESTO" : "FACTURA"}</span>
            <span class="text-xs font-mono font-bold text-slate-500 block mt-1">Nº Documento: <strong class="text-slate-950 font-bold font-mono">${draft?.id || ""}</strong></span>
            <span class="text-xs font-bold text-slate-500 block mt-1">Fecha: <span class="font-mono text-slate-950">${fechaActual}</span></span>
          </div>
        </div>
      </div>

      <!-- Information Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative">
          <span class="absolute -top-2.5 left-4 bg-slate-950 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">Cliente</span>
          <h3 class="font-black text-sm text-slate-900">${draft?.cliente || "Sin asignar"}</h3>
          <p class="font-mono font-bold text-xs text-slate-500 mt-2">DNI / CIF: <span class="text-slate-800">${draft?.dni || "N/A"}</span></p>
          <p class="text-xs font-medium text-slate-600 mt-1">Teléfono: <span class="font-bold text-slate-800">${draft?.telefono || "N/A"}</span></p>
        </div>
        <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative">
          <span class="absolute -top-2.5 left-4 bg-slate-950 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">Vehículo</span>
          <p class="font-mono font-black text-sm text-slate-900 tracking-wider">MATRÍCULA: <span class="bg-amber-100/80 border border-amber-300 text-amber-950 px-2 py-0.5 rounded font-mono font-black text-xs inline-block ml-1 uppercase">${draft?.matricula || "N/A"}</span></p>
          <p class="text-xs font-bold text-slate-600 mt-3 pt-2.5 border-t border-slate-200/60">MODELO: <span class="text-slate-900 font-extrabold uppercase ml-1">${draft?.vehiculo || "N/A"}</span></p>
        </div>
      </div>

      <!-- Table -->
      <div class="mb-8 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th class="py-2.5">Descripción del Concepto</th>
              <th class="py-2.5 text-center w-16">Cant</th>
              <th class="py-2.5 text-right w-24">Precio Ud.</th>
              <th class="py-2.5 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || `<tr><td colspan="4" class="py-6 text-center text-slate-400 text-xs font-bold">No hay conceptos añadidos.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Footer Section -->
      <div class="mt-12 flex flex-col sm:flex-row justify-between items-end gap-8">
        <div class="w-full sm:w-1/2 text-[9px] leading-relaxed text-slate-400 font-medium">
          <p class="font-bold uppercase tracking-wider text-slate-500 mb-1">Aviso Legal y Garantía:</p>
          ${config?.textoLegal || "El cliente acepta los términos y condiciones del taller."}
        </div>
        <div class="w-full sm:w-80 bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
          <div class="flex justify-between font-bold text-slate-400 text-[10px] tracking-widest uppercase mb-1">
            <span>Base Imponible:</span>
            <span class="font-mono text-white">${subtotalLocal.toFixed(2)}€</span>
          </div>
          <div class="flex justify-between font-bold text-slate-400 text-[10px] tracking-widest uppercase pb-2.5 border-b border-slate-800 mb-2.5">
            <span>IVA (21%):</span>
            <span class="font-mono text-white">${(subtotalLocal * 0.21).toFixed(2)}€</span>
          </div>
          <div class="flex justify-between items-end">
            <span class="text-xs font-black tracking-wider uppercase text-amber-500">TOTAL DOCUMENTO</span>
            <span class="text-2xl font-black font-mono text-white">${totalLocal.toFixed(2)}€</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    mostrarNotificacion("Archivo HTML exportado y descargado.");
  };

  const limpiarFactura = () => {
    pedirConfirmacion("¿Estás seguro de que deseas vaciar este borrador?", () => {
      setDraft({
        id: "PRE-" + Math.floor(Math.random() * 10000),
        cliente: "",
        dni: "",
        telefono: "",
        matricula: "",
        vehiculo: "",
        items: [],
      });
      mostrarNotificacion("Borrador de documento limpio.");
    });
  };

  const handleClienteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = arrClientes.find((x) => x.matricula === e.target.value);
    if (c) {
      setDraft((d) => ({
        ...d,
        cliente: c.nombre,
        dni: c.dni || d?.dni || "",
        telefono: c.telefono,
        matricula: c.matricula,
        vehiculo: c.marcaModelo,
      }));
    }
  };

  const getThemeBgClass = (color: string) => {
    return color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700";
  };

  const getThemeTextClass = (color: string) => {
    return color === "red" ? "text-red-400" : "text-blue-400";
  };

  const getThemeBorderClass = (color: string) => {
    return color === "red" ? "border-red-200" : "border-blue-200";
  };

  return (
    <div className="space-y-6 print:space-y-4 animate-fade-in pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900 p-4 rounded-2xl print-hidden gap-3 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            className="bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2.5 outline-none font-bold text-xs w-full sm:w-auto cursor-pointer"
            onChange={handleClienteSelect}
            value={draft?.matricula || ""}
          >
            <option value="">+ Vincular expediente registrado...</option>
            {arrClientes.map((c) => (
              <option key={c.id} value={c.matricula}>
                {c.matricula} - {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap justify-end gap-2 w-full lg:w-auto">
          <button
            onClick={limpiarFactura}
            className="bg-slate-800 text-slate-300 px-3 py-2.5 rounded-xl font-bold text-xs flex gap-1.5 items-center hover:bg-red-500 hover:text-white transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 text-slate-300 px-3 py-2.5 rounded-xl font-bold text-xs flex gap-1.5 items-center hover:bg-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button
            onClick={descargarHTML}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2.5 rounded-xl font-bold text-xs flex gap-1.5 items-center transition shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar HTML
          </button>
          <button
            onClick={enviarWhatsAppPDF}
            className="bg-emerald-500 text-white px-3 py-2.5 rounded-xl font-bold text-xs flex gap-1.5 items-center hover:bg-emerald-600 transition shadow-md cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button
            onClick={() => {
              if (!draft?.matricula) {
                mostrarNotificacion("Se requiere una matrícula asociada para guardar.");
                return;
              }
              onGuardar(draft);
            }}
            className={`text-white px-4 py-2.5 rounded-xl font-black text-xs flex gap-1.5 items-center transition cursor-pointer ${getThemeBgClass(
              themeColor
            )}`}
          >
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-sm rounded-3xl border border-slate-100 print:border-none print:shadow-none bg-white">
        <div
          id="factura-a-imprimir"
          className="p-6 md:p-8 min-w-[720px] min-h-[900px] flex flex-col justify-between print:p-0"
        >
          {/* Header Layout */}
          <div className="flex justify-between border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex gap-4 w-1/2">
              {config?.logoUrl && (
                <img src={config.logoUrl} alt="Logo" className="w-20 h-20 object-contain object-left-top" />
              )}
              <div className="space-y-0.5">
                <h3 className="font-black text-xl uppercase text-slate-900">
                  {config?.nombreComercial || "MECÁNICO PARTICULAR"}
                </h3>
                <p className="font-bold text-xs text-slate-600">{config?.razonSocial || ""}</p>
                <p className="font-mono text-xs text-slate-500">CIF: {config?.cif || ""}</p>
                <p className="text-xs text-slate-600">{config?.direccion || ""}</p>
                <p className="text-xs text-slate-600">Tel: {config?.telefono || ""}</p>
              </div>
            </div>
            <div className="text-right w-1/3">
              <input
                type="text"
                value={(draft?.id || "").startsWith("PRE") ? "PRESUPUESTO" : "FACTURA"}
                readOnly
                className="text-2xl font-black text-slate-300 text-right outline-none uppercase w-full bg-transparent"
              />
              <div className="font-bold text-slate-500 mt-2 text-xs flex justify-end items-center gap-1.5">
                Nº:{" "}
                <input
                  type="text"
                  value={draft?.id || ""}
                  onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                  className="font-mono text-right w-28 outline-none text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 focus:bg-white"
                />
              </div>
              <div className="font-bold text-slate-500 mt-1 text-xs flex justify-end items-center gap-1.5">
                Fecha:{" "}
                <span className="font-mono text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                  {new Date().toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>
          </div>

          {/* Client & Car details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 p-4 rounded-xl relative bg-slate-50">
              <h4 className="absolute -top-2 left-4 bg-slate-900 text-white px-2 py-0.5 text-[8px] font-black uppercase rounded">
                Cliente
              </h4>
              <input
                type="text"
                value={draft?.cliente || ""}
                onChange={(e) => setDraft({ ...draft, cliente: e.target.value })}
                className="w-full font-black text-sm text-slate-900 outline-none bg-transparent placeholder-slate-300 focus:bg-white p-1 rounded"
                placeholder="Nombre del cliente"
              />
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={draft?.dni || ""}
                  onChange={(e) => setDraft({ ...draft, dni: e.target.value })}
                  className="w-1/2 outline-none font-mono font-bold text-xs bg-transparent placeholder-slate-400 focus:bg-white p-1 rounded"
                  placeholder="DNI / CIF"
                />
                <input
                  type="text"
                  value={draft?.telefono || ""}
                  onChange={(e) => setDraft({ ...draft, telefono: e.target.value })}
                  className="w-1/2 outline-none font-medium text-xs bg-transparent placeholder-slate-400 focus:bg-white p-1 rounded"
                  placeholder="Teléfono"
                />
              </div>
            </div>
            <div className="border border-slate-200 p-4 rounded-xl relative bg-slate-50">
              <h4 className="absolute -top-2 left-4 bg-slate-900 text-white px-2 py-0.5 text-[8px] font-black uppercase rounded">
                Vehículo
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 w-16">MATRÍCULA:</span>
                <input
                  type="text"
                  value={draft?.matricula || ""}
                  onChange={(e) => setDraft({ ...draft, matricula: e.target.value })}
                  className="uppercase font-black text-sm text-slate-900 outline-none w-full bg-transparent placeholder-slate-300 focus:bg-white p-0.5 rounded"
                  placeholder="0000-AAA"
                />
              </div>
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-200/50">
                <span className="text-[9px] font-bold text-slate-400 w-16">MODELO:</span>
                <input
                  type="text"
                  value={draft?.vehiculo || ""}
                  onChange={(e) => setDraft({ ...draft, vehiculo: e.target.value })}
                  className="font-bold outline-none w-full text-xs text-slate-700 bg-transparent placeholder-slate-400 focus:bg-white p-0.5 rounded"
                  placeholder="Marca y Modelo"
                />
              </div>
            </div>
          </div>

          {/* Concepts Table */}
          <div className="flex-1">
            <div className="flex justify-end items-center print-hidden mb-3 gap-2">
              <button
                onClick={() => añadirLinea(true)}
                className="bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-lg text-xs border border-amber-200 flex items-center gap-1.5 cursor-pointer hover:bg-amber-100"
              >
                <Clock className="w-3.5 h-3.5" /> + Horas
              </button>
              <button
                onClick={() => añadirLinea(false)}
                className={`font-bold px-3 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 ${getThemeBorderClass(
                  themeColor
                )}`}
              >
                <Plus className="w-3.5 h-3.5" /> + Pieza / Trabajo
              </button>
            </div>

            <div className="grid grid-cols-12 border-b-2 border-slate-900 pb-1 mb-2 font-black uppercase text-[9px] tracking-widest text-slate-400">
              <div className="col-span-7 pl-1">Descripción del Concepto</div>
              <div className="col-span-1 text-center">Cant</div>
              <div className="col-span-2 text-right">Precio Ud.</div>
              <div className="col-span-2 text-right pr-1">Total</div>
            </div>

            {(draft?.items || []).map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-12 py-2.5 group relative transition-colors ${
                  index % 2 === 0 ? "bg-slate-50/50" : ""
                }`}
              >
                <div className="col-span-7 pl-1">
                  <textarea
                    value={item.concepto || ""}
                    onChange={(e) => actualizarItem(item.id, "concepto", e.target.value)}
                    className="w-full outline-none font-semibold text-xs bg-transparent resize-none overflow-hidden whitespace-pre-wrap text-slate-800"
                    placeholder="Escribe el concepto..."
                    rows={(item.concepto || "").split("\n").length || 1}
                    style={{ minHeight: "20px" }}
                  ></textarea>
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={item.cantidad || 0}
                    onChange={(e) => actualizarItem(item.id, "cantidad", parseFloat(e.target.value) || 0)}
                    className="w-full text-center outline-none font-mono font-bold text-xs bg-transparent text-slate-750"
                  />
                </div>
                <div className="col-span-2 text-right">
                  <input
                    type="number"
                    value={item.precio || 0}
                    onChange={(e) => actualizarItem(item.id, "precio", parseFloat(e.target.value) || 0)}
                    className="w-full text-right outline-none font-mono font-bold text-xs bg-transparent text-slate-750"
                  />
                </div>
                <div className="col-span-2 text-right font-mono font-black text-xs pr-1 text-slate-900">
                  {((item.cantidad || 0) * (item.precio || 0)).toFixed(2)}€
                </div>
                <button
                  onClick={() =>
                    setDraft((p) => ({ ...p, items: (p?.items || []).filter((x) => x.id !== item.id) }))
                  }
                  className="absolute -left-8 text-red-400 opacity-0 group-hover:opacity-100 print-hidden bg-white border border-red-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(draft?.items || []).length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs font-bold border-b border-slate-100">
                Presupuesto en blanco. Usa el asistente IA para precargar conceptos.
              </div>
            )}
            <div className="border-t border-slate-200 mt-1"></div>
          </div>

          {/* Totales Block */}
          <div className="mt-8 flex flex-col md:flex-row justify-between items-end gap-6 print:mt-auto">
            <div className="w-1/2 text-[8px] text-slate-400 border-t border-slate-200 pt-3 leading-relaxed">
              {config?.textoLegal || ""}
            </div>
            <div className="w-80 bg-slate-900 rounded-2xl p-4 print:bg-white print:border-2 print:border-slate-900 print:text-slate-900 text-white shadow-xl">
              <div className="flex justify-between font-bold text-slate-400 print:text-slate-500 mb-1 text-[10px] tracking-widest uppercase">
                <span>Base Imponible:</span>
                <span className="font-mono text-white print:text-slate-900">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-slate-400 print:text-slate-500 mb-2 pb-2 border-b border-slate-700 print:border-slate-200 text-[10px] tracking-widest uppercase">
                <span>IVA (21%):</span>
                <span className="font-mono text-white print:text-slate-900">{(subtotal * 0.21).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-end">
                <span className={`text-sm font-black uppercase print:text-slate-900 tracking-tight ${getThemeTextClass(themeColor)}`}>
                  TOTAL DOCUMENTO
                </span>
                <span className="text-2xl font-black font-mono text-white print:text-slate-900">
                  {total.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
