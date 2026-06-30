export interface TallerConfig {
  nombreComercial: string;
  razonSocial: string;
  cif: string;
  direccion: string;
  telefono: string;
  precioManoObra: number;
  textoLegal: string;
  logoUrl: string | null;
  geminiApiKey?: string;
}

export interface DocumentoItem {
  id: number;
  concepto: string;
  cantidad: number;
  precio: number;
}

export interface DocumentoDraft {
  id: string;
  cliente: string;
  dni: string;
  telefono: string;
  matricula: string;
  vehiculo: string;
  items: DocumentoItem[];
  fecha?: string;
}

export interface HistorialEntry {
  idDoc: string;
  fecha: string;
  total: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  dni?: string;
  telefono: string;
  matricula: string;
  marcaModelo: string;
  historial: HistorialEntry[];
  enTaller: boolean;
  estadoActual: string; // 'Recibido' | 'Diagnosticando' | 'Esperando Piezas' | 'En Reparación' | 'Terminado' | 'Entregado'
}

export interface AveriaResuelta {
  id: number;
  titulo: string;
  sintomas: string;
  solucion: string;
  autor: string;
  verificado?: boolean;
  createdAt?: number;
}
