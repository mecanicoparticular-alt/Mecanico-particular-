import React, { useState, useEffect } from "react";
import { TallerConfig, Cliente, DocumentoDraft, AveriaResuelta } from "./types";
import { 
  Home, Car, Wrench, FileText, Users, Sparkles, Globe, 
  Settings, Camera, Plus, Check, AlertTriangle, Eye, Palette
} from "lucide-react";

import ModuloDashboard from "./components/ModuloDashboard";
import ModuloRecepcion from "./components/ModuloRecepcion";
import ModuloTallerVivo from "./components/ModuloTallerVivo";
import ModuloHistorial from "./components/ModuloHistorial";
import ModuloPresupuestos from "./components/ModuloPresupuestos";
import ModuloAsistenteTaller from "./components/ModuloAsistenteTaller";
import ModuloComunidadGlobal from "./components/ModuloComunidadGlobal";
import ModuloConfiguracion from "./components/ModuloConfiguracion";
import ModuloAuth from "./components/ModuloAuth";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";

// Custom type-safe hook for LocalStorage persistence
function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(`mecanico_local_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error leyendo de localStorage ${key}:`, error);
      return initialValue;
    }
  });

  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    setIsInit(true);
  }, []);

  const setValueWrapper = (valueOrFn: T | ((prev: T) => T)) => {
    try {
      setValue((prev) => {
        const newValue = typeof valueOrFn === "function" ? (valueOrFn as Function)(prev) : valueOrFn;
        window.localStorage.setItem(`mecanico_local_${key}`, JSON.stringify(newValue));
        return newValue;
      });
    } catch (error) {
      console.error(`Error guardando en localStorage ${key}:`, error);
    }
  };

  return [value, setValueWrapper, isInit];
}

export default function App() {
  return <TallerApp />;
}

function TallerApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appMode, setAppMode] = useState<"mecanica" | "chapa" | null>(null);
  const [notificacion, setNotificacion] = useState("");
  const [dialogoConfirmacion, setDialogoConfirmacion] = useState<{
    visible: boolean;
    mensaje: string;
    accion: (() => void) | null;
  }>({ visible: false, mensaje: "", accion: null });

  // Authentication states
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // Core workshop database states with offline-first fallbacks
  const [configTaller, _setConfigTaller] = useState<TallerConfig>(() => {
    try {
      const item = window.localStorage.getItem("mecanico_local_config");
      return item ? JSON.parse(item) : {
        nombreComercial: "",
        razonSocial: "",
        cif: "",
        direccion: "",
        telefono: "",
        precioManoObra: 45,
        textoLegal: "El cliente autoriza las pruebas de carretera necesarias y acepta los términos de garantía oficiales.",
        logoUrl: null,
      };
    } catch {
      return {
        nombreComercial: "",
        razonSocial: "",
        cif: "",
        direccion: "",
        telefono: "",
        precioManoObra: 45,
        textoLegal: "El cliente autoriza las pruebas de carretera necesarias y acepta los términos de garantía oficiales.",
        logoUrl: null,
      };
    }
  });

  const [clientesDB, _setClientesDB] = useState<Cliente[]>(() => {
    try {
      const item = window.localStorage.getItem("mecanico_local_clientes");
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const [documentosDB, _setDocumentosDB] = useState<DocumentoDraft[]>(() => {
    try {
      const item = window.localStorage.getItem("mecanico_local_documentos");
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  });

  const [presupuestoDraft, setPresupuestoDraft, isDraftInit] = useLocalStorage<DocumentoDraft>("draft", {
    id: "PRE-" + Math.floor(Math.random() * 10000),
    cliente: "",
    dni: "",
    telefono: "",
    matricula: "",
    vehiculo: "",
    items: [],
  });

  const [memoriaComunidad, _setMemoriaComunidad] = useState<AveriaResuelta[]>(() => {
    try {
      const item = window.localStorage.getItem("mecanico_local_memoria_comunidad");
      return item ? JSON.parse(item) : [
        {
          id: 1,
          titulo: "Fallo Tirones - VAG 2.0 TDI",
          sintomas: "Pérdida de potencia transitoria en bajas revoluciones con tirones.",
          solucion: "Limpieza de carbonilla en EGR y recalibración de mariposa.",
          autor: "Soporte GT Premium",
          verificado: true,
        },
      ];
    } catch {
      return [
        {
          id: 1,
          titulo: "Fallo Tirones - VAG 2.0 TDI",
          sintomas: "Pérdida de potencia transitoria en bajas revoluciones con tirones.",
          solucion: "Limpieza de carbonilla en EGR y recalibración de mariposa.",
          autor: "Soporte GT Premium",
          verificado: true,
        },
      ];
    }
  });

  // State initialization flags for view routing compatibility
  const isConfigInit = !authLoading;
  const isClientesInit = !authLoading;
  const isDocsInit = !authLoading;

  // Sync / Write functions for Firestore synchronization
  const syncClientesToFirestore = async (newClientes: Cliente[], oldClientes: Cliente[]) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Add / Update
    for (const c of newClientes) {
      const prev = oldClientes.find((o) => o.id === c.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(c)) {
        try {
          await setDoc(doc(db, "clientes", String(c.id)), {
            ...c,
            id: String(c.id),
            userId: currentUser.uid,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `clientes/${c.id}`);
        }
      }
    }

    // Delete
    for (const o of oldClientes) {
      const exists = newClientes.some((c) => c.id === o.id);
      if (!exists) {
        try {
          await deleteDoc(doc(db, "clientes", String(o.id)));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `clientes/${o.id}`);
        }
      }
    }
  };

  const syncDocumentosToFirestore = async (newDocs: DocumentoDraft[], oldDocs: DocumentoDraft[]) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Add / Update
    for (const d of newDocs) {
      const prev = oldDocs.find((o) => o.id === d.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(d)) {
        try {
          await setDoc(doc(db, "documentos", String(d.id)), {
            ...d,
            id: String(d.id),
            userId: currentUser.uid,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `documentos/${d.id}`);
        }
      }
    }

    // Delete
    for (const o of oldDocs) {
      const exists = newDocs.some((d) => d.id === o.id);
      if (!exists) {
        try {
          await deleteDoc(doc(db, "documentos", String(o.id)));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `documentos/${o.id}`);
        }
      }
    }
  };

  const syncComunidadToFirestore = async (newAverias: AveriaResuelta[], oldAverias: AveriaResuelta[]) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Add / Update
    for (const a of newAverias) {
      const prev = oldAverias.find((o) => o.id === a.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(a)) {
        try {
          await setDoc(doc(db, "comunidad", String(a.id)), {
            ...a,
            id: String(a.id),
            userId: currentUser.uid,
            createdAt: a.createdAt || Date.now(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `comunidad/${a.id}`);
        }
      }
    }

    // Delete
    for (const o of oldAverias) {
      const exists = newAverias.some((a) => a.id === o.id);
      if (!exists) {
        try {
          await deleteDoc(doc(db, "comunidad", String(o.id)));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `comunidad/${o.id}`);
        }
      }
    }
  };

  // State wrappers to seamlessly route storage writes to Cloud or LocalStorage
  const setConfigTaller = (valOrFn: TallerConfig | ((prev: TallerConfig) => TallerConfig)) => {
    _setConfigTaller((prev) => {
      const newValue = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      if (auth.currentUser) {
        setDoc(doc(db, "taller_config", auth.currentUser.uid), newValue)
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `taller_config/${auth.currentUser?.uid}`));
      } else {
        window.localStorage.setItem("mecanico_local_config", JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  const setClientesDB = (valOrFn: Cliente[] | ((prev: Cliente[]) => Cliente[])) => {
    _setClientesDB((prev) => {
      const newValue = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      if (auth.currentUser) {
        syncClientesToFirestore(newValue, prev);
      } else {
        window.localStorage.setItem("mecanico_local_clientes", JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  const setDocumentosDB = (valOrFn: DocumentoDraft[] | ((prev: DocumentoDraft[]) => DocumentoDraft[])) => {
    _setDocumentosDB((prev) => {
      const newValue = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      if (auth.currentUser) {
        syncDocumentosToFirestore(newValue, prev);
      } else {
        window.localStorage.setItem("mecanico_local_documentos", JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  const setMemoriaComunidad = (valOrFn: AveriaResuelta[] | ((prev: AveriaResuelta[]) => AveriaResuelta[])) => {
    _setMemoriaComunidad((prev) => {
      const newValue = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      if (auth.currentUser) {
        syncComunidadToFirestore(newValue, prev);
      } else {
        window.localStorage.setItem("mecanico_local_memoria_comunidad", JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  // Migrates existing offline storage records up to Firestore upon login
  const migrarDatosALaNube = async (currentUser: any) => {
    try {
      const localConfig = window.localStorage.getItem("mecanico_local_config");
      if (localConfig) {
        const parsed = JSON.parse(localConfig);
        await setDoc(doc(db, "taller_config", currentUser.uid), parsed);
      }

      const localClientes = window.localStorage.getItem("mecanico_local_clientes");
      if (localClientes) {
        const parsed = JSON.parse(localClientes) as Cliente[];
        for (const c of parsed) {
          await setDoc(doc(db, "clientes", String(c.id)), {
            ...c,
            id: String(c.id),
            userId: currentUser.uid,
          });
        }
      }

      const localDocs = window.localStorage.getItem("mecanico_local_documentos");
      if (localDocs) {
        const parsed = JSON.parse(localDocs) as DocumentoDraft[];
        for (const d of parsed) {
          await setDoc(doc(db, "documentos", String(d.id)), {
            ...d,
            id: String(d.id),
            userId: currentUser.uid,
          });
        }
      }

      // Clean local storage files once synchronized safely to the cloud
      window.localStorage.removeItem("mecanico_local_config");
      window.localStorage.removeItem("mecanico_local_clientes");
      window.localStorage.removeItem("mecanico_local_documentos");
    } catch (err) {
      console.error("No se pudo completar la migración inicial de datos:", err);
    }
  };

  // Firebase Auth initialization and real-time listeners registration
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        migrarDatosALaNube(currentUser);
      }
    });

    return () => unsubAuth();
  }, []);

  // Set up Firestore collection snapshot listeners
  useEffect(() => {
    if (!user) return;

    const unsubConfig = onSnapshot(doc(db, "taller_config", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        _setConfigTaller(docSnap.data() as TallerConfig);
      } else {
        const defaultVal = {
          nombreComercial: "",
          razonSocial: "",
          cif: "",
          direccion: "",
          telefono: "",
          precioManoObra: 45,
          textoLegal: "El cliente autoriza las pruebas de carretera necesarias y acepta los términos de garantía oficiales.",
          logoUrl: null,
        };
        setDoc(doc(db, "taller_config", user.uid), defaultVal)
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `taller_config/${user.uid}`));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `taller_config/${user.uid}`);
    });

    const qClientes = query(collection(db, "clientes"), where("userId", "==", user.uid));
    const unsubClientes = onSnapshot(qClientes, (snap) => {
      const list: Cliente[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          ...data,
          id: Number(data.id) || data.id,
        } as Cliente);
      });
      _setClientesDB(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "clientes");
    });

    const qDocs = query(collection(db, "documentos"), where("userId", "==", user.uid));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      const list: DocumentoDraft[] = [];
      snap.forEach((d) => {
        list.push(d.data() as DocumentoDraft);
      });
      _setDocumentosDB(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "documentos");
    });

    const unsubComunidad = onSnapshot(collection(db, "comunidad"), (snap) => {
      const list: AveriaResuelta[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          ...data,
          id: Number(data.id) || data.id,
        } as AveriaResuelta);
      });
      if (list.length > 0) {
        _setMemoriaComunidad(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "comunidad");
    });

    return () => {
      unsubConfig();
      unsubClientes();
      unsubDocs();
      unsubComunidad();
    };
  }, [user]);

  const pedirConfirmacion = (mensaje: string, accion: () => void) => {
    setDialogoConfirmacion({ visible: true, mensaje, accion });
  };

  const mostrarNotificacion = (mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(""), 4000);
  };

  const añadirItemAlPresupuesto = (item: { nombre: string; cantidad: number; precio: number }) => {
    setPresupuestoDraft((prev) => ({
      ...prev,
      items: [
        ...(prev?.items || []),
        { id: Date.now() + Math.random(), concepto: item.nombre, cantidad: item.cantidad || 1, precio: item.precio },
      ],
    }));
    mostrarNotificacion(`¡Añadido al borrador del documento!`);
  };

  const registrarIngresoEnTaller = (datos: {
    nombre: string;
    dni: string;
    telefono: string;
    direccion: string;
    matricula: string;
    marcaModelo: string;
    bastidor: string;
    kilometros: string;
    motivo: string;
  }) => {
    setClientesDB((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const existe = arr.find((c) => c.matricula === datos.matricula);
      if (existe) {
        return arr.map((c) =>
          c.matricula === datos.matricula
            ? {
                ...c,
                nombre: datos.nombre,
                dni: datos.dni,
                telefono: datos.telefono,
                marcaModelo: datos.marcaModelo,
                enTaller: true,
                estadoActual: "Recibido",
              }
            : c
        );
      }
      return [
        {
          id: Date.now(),
          nombre: datos.nombre,
          dni: datos.dni,
          matricula: datos.matricula,
          telefono: datos.telefono,
          marcaModelo: datos.marcaModelo,
          historial: [],
          enTaller: true,
          estadoActual: "Recibido",
        },
        ...arr,
      ];
    });
  };

  const guardarDocumento = (doc: DocumentoDraft) => {
    const nuevoDoc = { ...doc, fecha: new Date().toLocaleDateString("es-ES") };
    setDocumentosDB((prev) => [nuevoDoc, ...(Array.isArray(prev) ? prev : [])]);
    
    setClientesDB((prevClientes) => {
      const arr = Array.isArray(prevClientes) ? prevClientes : [];
      const c = arr.find((x) => x.matricula === doc.matricula);
      const docTotal =
        (doc?.items || []).reduce((acc, i) => acc + (i?.cantidad || 0) * (i?.precio || 0), 0) * 1.21;
      
      if (c) {
        return arr.map((x) =>
          x.matricula === doc.matricula
            ? {
                ...x,
                historial: [
                  { idDoc: doc.id, fecha: nuevoDoc.fecha || "", total: docTotal },
                  ...(x.historial || []),
                ],
              }
            : x
        );
      }
      return [
        {
          id: Date.now(),
          nombre: doc.cliente,
          dni: doc.dni,
          matricula: doc.matricula,
          telefono: doc.telefono,
          marcaModelo: doc.vehiculo,
          historial: [{ idDoc: doc.id, fecha: nuevoDoc.fecha || "", total: docTotal }],
          enTaller: false,
          estadoActual: "Entregado",
        },
        ...arr,
      ];
    });

    mostrarNotificacion("Documento guardado con éxito.");
    setPresupuestoDraft({
      id: "PRE-" + Math.floor(Math.random() * 10000),
      cliente: "",
      dni: "",
      telefono: "",
      matricula: "",
      vehiculo: "",
      items: [],
    });
  };

  const handleLogoUploadHome = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setConfigTaller({ ...configTaller, logoUrl: event.target.result as string });
          mostrarNotificacion("Logotipo guardado en perfil.");
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!isConfigInit || !isClientesInit || !isDocsInit || !isDraftInit) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="font-bold tracking-widest uppercase text-slate-400 text-xs font-mono">
          Cargando Datos de Taller...
        </h2>
      </div>
    );
  }

  // Si no hay sesión iniciada, mostrar el portal de acceso/registro
  if (!user && !demoMode) {
    return (
      <div className="min-h-screen bg-slate-950">
        {notificacion && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-semibold animate-slide-up border border-slate-700 w-[90%] md:w-auto max-w-md justify-center">
            <span className="text-sm leading-tight">{notificacion}</span>
          </div>
        )}
        <ModuloAuth 
          onDemoAccess={() => setDemoMode(true)} 
          onSuccess={(msg) => mostrarNotificacion(msg)} 
        />
      </div>
    );
  }

  // Specialty Landing Selector
  if (!appMode) {
    return (
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in print-hidden relative">
        {notificacion && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-semibold animate-slide-up border border-white/20 w-[90%] md:w-auto max-w-md justify-center">
            <span className="text-sm leading-tight">{notificacion}</span>
          </div>
        )}

        <div className="mb-6 animate-slide-up mt-8">
          <label className="cursor-pointer group relative block mx-auto w-max" title="Personalizar logotipo">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadHome} />
            {configTaller?.logoUrl ? (
              <div className="relative">
                <img
                  src={configTaller.logoUrl}
                  alt="Logo"
                  className="w-24 h-24 md:w-28 md:h-28 object-contain bg-white/5 backdrop-blur-xl rounded-[2rem] p-4 mx-auto shadow-2xl border border-white/10 group-hover:opacity-40 transition-opacity"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/30 border border-amber-400/30 group-hover:scale-105 transition-transform relative overflow-hidden">
                <Wrench className="w-10 h-10 text-white animate-pulse" />
              </div>
            )}
          </label>
        </div>

        <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight animate-slide-up">
          {configTaller?.nombreComercial || "Mecánico Particular"}
        </h1>
        <p className="text-slate-400 font-medium mb-6 max-w-lg text-sm md:text-base animate-slide-up">
          Panel Operativo de Taller. Selecciona tu especialidad de trabajo.
        </p>

        {/* Banner de Sincronización en la nube */}
        <div className="mb-10 p-5 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 max-w-md mx-auto w-full animate-slide-up">
          {user ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5 text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute"></span>
                <span>Base de Datos Cloud Activa</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Conectado como <strong className="text-slate-300 font-semibold">{user.displayName || user.email}</strong>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="text-xs text-slate-400 font-medium leading-relaxed">
                ¿Quieres guardar y sincronizar tu taller en tiempo real?
              </div>
              <button
                onClick={async () => {
                  try {
                    const provider = new GoogleAuthProvider();
                    const result = await signInWithPopup(auth, provider);
                    mostrarNotificacion(`¡Sincronizado como ${result.user.displayName || "Usuario"}!`);
                  } catch (err) {
                    mostrarNotificacion("Error de conexión de red o acceso.");
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Activar Sincronización Cloud</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-slide-up">
          <button
            onClick={() => {
              setAppMode("mecanica");
              setActiveTab("dashboard");
            }}
            className="bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center group border border-slate-800 hover:border-blue-500/50 cursor-pointer"
          >
            <div className="w-20 h-20 flex items-center justify-center mb-6 bg-blue-500/10 rounded-2xl">
              <Wrench className="w-10 h-10 text-blue-400 group-hover:rotate-12 transition-transform" />
            </div>
            <h2 className="text-2xl font-black text-white">Mecánica</h2>
            <p className="text-slate-500 mt-2 text-sm">Tempario, averías motor, lubricantes y diagnosis</p>
          </button>

          <button
            onClick={() => {
              setAppMode("chapa");
              setActiveTab("dashboard");
            }}
            className="bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center group border border-slate-800 hover:border-red-500/50 cursor-pointer"
          >
            <div className="w-20 h-20 flex items-center justify-center mb-6 bg-red-500/10 rounded-2xl">
              <Palette className="w-10 h-10 text-red-400 group-hover:translate-y-[-2px] transition-transform" />
            </div>
            <h2 className="text-2xl font-black text-white">Chapa y Pintura</h2>
            <p className="text-slate-500 mt-2 text-sm">Colorimetría por IA, tasación y escáner óptico de golpes</p>
          </button>
        </div>
      </div>
    );
  }

  const themeColor = appMode === "chapa" ? "red" : "blue";

  return (
    <div className="flex flex-col h-screen font-sans print:bg-white print:h-auto bg-slate-50">
      {/* Toast Notification Bar */}
      {notificacion && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-semibold animate-slide-up print-hidden border border-slate-700 w-[90%] md:w-auto max-w-md justify-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            themeColor === "red" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
          }`}>
            <Check className="w-4 h-4" />
          </div>
          <span className="text-sm md:text-base leading-tight">{notificacion}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {dialogoConfirmacion?.visible && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm print-hidden">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-slide-up">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-black text-2xl mb-2 text-slate-900 tracking-tight">Confirmar Acción</h3>
            <p className="text-slate-500 font-medium mb-8 text-sm md:text-base leading-relaxed">
              {dialogoConfirmacion.mensaje}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (dialogoConfirmacion.accion) dialogoConfirmacion.accion();
                  setDialogoConfirmacion({ visible: false, mensaje: "", accion: null });
                }}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all cursor-pointer active:scale-95"
              >
                Sí, continuar
              </button>
              <button
                onClick={() => setDialogoConfirmacion({ visible: false, mensaje: "", accion: null })}
                className="w-full py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="glass-header text-white px-4 md:px-6 py-4 pt-safe shadow-md flex justify-between items-center print-hidden z-30 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="cursor-pointer group relative" onClick={() => setActiveTab("dashboard")}>
            {configTaller?.logoUrl ? (
              <img
                src={configTaller.logoUrl}
                alt="Logo"
                className="h-10 w-10 object-contain bg-white rounded-xl p-1 shadow-sm"
              />
            ) : (
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                themeColor === "red" ? "bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-blue-500 to-blue-700"
              }`}>
                {appMode === "chapa" ? <Palette className="w-5 h-5 text-white" /> : <Wrench className="w-5 h-5 text-white" />}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-base md:text-lg font-black tracking-tight leading-none text-white">
              {configTaller?.nombreComercial || "MECÁNICO PARTICULAR"}
            </h1>
            <button
              onClick={() => setAppMode(null)}
              className={`mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors w-max cursor-pointer ${
                themeColor === "red" ? "text-red-300 hover:text-white" : "text-blue-300 hover:text-white"
              }`}
            >
              {appMode === "mecanica" ? "Modo Mecánica" : "Modo Chapa y Pintura"}{" "}
              <span className="opacity-50 ml-1">(Cambiar)</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          {/* Google Sign-In button / User Profile */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-800/80 pl-2 pr-3 py-1.5 rounded-full border border-slate-700 max-w-[150px] sm:max-w-none">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-5 h-5 rounded-full border border-amber-500/50" />
              ) : (
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <span className="text-[10px] font-semibold text-slate-200 truncate hidden md:inline max-w-[80px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={async () => {
                  if (confirm("¿Cerrar sesión de tu taller?")) {
                    await signOut(auth);
                    setDemoMode(false);
                    mostrarNotificacion("Sesión cerrada.");
                  }
                }}
                className="text-[9px] bg-slate-700 hover:bg-red-600/30 hover:text-red-300 text-slate-400 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDemoMode(false)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-[10px] px-3 py-2 rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Iniciar Sesión / Registro</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("config")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div
            className={`text-xs px-4 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer font-bold shadow-lg transition-all transform hover:scale-102 ${
              themeColor === "red"
                ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
            }`}
            onClick={() => setActiveTab("presupuestos")}
          >
            <FileText className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Facturar</span>
            <span className={`bg-white text-xs px-2 py-0.5 rounded-md font-black ${
              themeColor === "red" ? "text-red-700" : "text-blue-700"
            }`}>
              {(presupuestoDraft?.items || []).length}
            </span>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32 print:p-0 relative z-0 scroll-smooth">
        <div className="max-w-5xl mx-auto min-h-full print:shadow-none print:border-none print:p-0">
          {activeTab === "dashboard" && (
            <ModuloDashboard
              config={configTaller}
              clientesDB={clientesDB}
              documentosDB={documentosDB}
              setActiveTab={setActiveTab}
              appMode={appMode}
              themeColor={themeColor}
            />
          )}
          {activeTab === "recepcion" && (
            <ModuloRecepcion
              syncConPresupuesto={setPresupuestoDraft}
              registrarIngresoEnTaller={registrarIngresoEnTaller}
              mostrarNotificacion={mostrarNotificacion}
              clientesDB={clientesDB}
              config={configTaller}
              setActiveTab={setActiveTab}
              appMode={appMode}
              themeColor={themeColor}
            />
          )}
          {activeTab === "taller" && (
            <ModuloTallerVivo
              clientesDB={clientesDB}
              setClientesDB={setClientesDB}
              config={configTaller}
              mostrarNotificacion={mostrarNotificacion}
              pedirConfirmacion={pedirConfirmacion}
              themeColor={themeColor}
            />
          )}
          {activeTab === "historial" && (
            <ModuloHistorial
              clientesDB={clientesDB}
              setClientesDB={setClientesDB}
              documentosDB={documentosDB}
              onEditarDoc={(id) => {
                const doc = documentosDB.find((d) => d.id === id);
                if (doc) {
                  setPresupuestoDraft(doc);
                  setActiveTab("presupuestos");
                } else {
                  mostrarNotificacion("Error: Documento no encontrado.");
                }
              }}
              mostrarNotificacion={mostrarNotificacion}
              pedirConfirmacion={pedirConfirmacion}
              themeColor={themeColor}
            />
          )}
          {activeTab === "presupuestos" && (
            <ModuloPresupuestos
              draft={presupuestoDraft}
              setDraft={setPresupuestoDraft}
              config={configTaller}
              onGuardar={guardarDocumento}
              clientesDB={clientesDB}
              mostrarNotificacion={mostrarNotificacion}
              pedirConfirmacion={pedirConfirmacion}
              themeColor={themeColor}
            />
          )}
          {activeTab === "data_ia" && (
            <ModuloAsistenteTaller
              onAdd={añadirItemAlPresupuesto}
              memoriaLocal={memoriaComunidad}
              mostrarNotificacion={mostrarNotificacion}
              config={configTaller}
              appMode={appMode}
              clientesDB={clientesDB}
              themeColor={themeColor}
            />
          )}
          {activeTab === "comunidad" && (
            <ModuloComunidadGlobal
              configTaller={configTaller}
              mostrarNotificacion={mostrarNotificacion}
              averias={memoriaComunidad}
              setAverias={setMemoriaComunidad}
              themeColor={themeColor}
            />
          )}
          {activeTab === "config" && (
            <ModuloConfiguracion
              config={configTaller}
              setConfig={setConfigTaller}
              mostrarNotificacion={mostrarNotificacion}
              themeColor={themeColor}
            />
          )}
        </div>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 w-full print-hidden z-40 pb-safe px-2 sm:px-0 pointer-events-none">
        <div className="max-w-4xl mx-auto glass-nav rounded-t-3xl sm:rounded-full sm:mb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border border-slate-200 pointer-events-auto p-2">
          <div className="flex justify-between sm:justify-center items-center gap-1 sm:gap-2 px-1 overflow-x-auto scrollbar-hide">
            <NavButton
              icon={<Home className="w-5 h-5" />}
              label="Inicio"
              isActive={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
              themeColor={themeColor}
            />
            <NavButton
              icon={<Car className="w-5 h-5" />}
              label="Recepción"
              isActive={activeTab === "recepcion"}
              onClick={() => setActiveTab("recepcion")}
              themeColor={themeColor}
            />
            <NavButton
              icon={<Wrench className="w-5 h-5" />}
              label="Taller"
              isActive={activeTab === "taller"}
              onClick={() => setActiveTab("taller")}
              themeColor={themeColor}
            />
            <NavButton
              icon={<FileText className="w-5 h-5" />}
              label="Doc"
              isActive={activeTab === "presupuestos"}
              onClick={() => setActiveTab("presupuestos")}
              themeColor={themeColor}
            />
            <NavButton
              icon={<Users className="w-5 h-5" />}
              label="Clientes"
              isActive={activeTab === "historial"}
              onClick={() => setActiveTab("historial")}
              themeColor={themeColor}
            />

            <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

            <NavButton
              icon={<Sparkles className="w-5 h-5" />}
              label="IA"
              isActive={activeTab === "data_ia"}
              onClick={() => setActiveTab("data_ia")}
              special={true}
              themeColor={themeColor}
            />
            <NavButton
              icon={<Globe className="w-5 h-5" />}
              label="Red"
              isActive={activeTab === "comunidad"}
              onClick={() => setActiveTab("comunidad")}
              themeColor={themeColor}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}

// Bottom Nav Button Component
interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  special?: boolean;
  themeColor: string;
}

function NavButton({ icon, label, isActive, onClick, special = false, themeColor }: NavButtonProps) {
  if (special) {
    const specialClass =
      themeColor === "red"
        ? "bg-gradient-to-tr from-red-600 to-indigo-600 shadow-red-500/40"
        : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/40";

    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] transition-all duration-200 rounded-2xl relative cursor-pointer ${
          isActive
            ? `${specialClass} text-white shadow-lg transform -translate-y-1 scale-105`
            : "bg-slate-900 text-slate-100 hover:bg-slate-800"
        }`}
      >
        {isActive && <div className="absolute inset-0 rounded-2xl border-2 border-white/20"></div>}
        <div className="mb-0.5">{icon}</div>
        <span className="text-[8px] font-black uppercase tracking-wider">{label}</span>
      </button>
    );
  }

  const activeTextClass = themeColor === "red" ? "text-red-700 bg-red-50" : "text-blue-700 bg-blue-50";
  const activeIconClass = themeColor === "red" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-1 sm:px-3 min-w-[58px] sm:min-w-[70px] transition-all duration-200 rounded-2xl cursor-pointer ${
        isActive ? `${activeTextClass} scale-105` : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-0.5 transition-colors ${
        isActive ? activeIconClass : ""
      }`}>
        {icon}
      </div>
      <span className={`text-[8px] sm:text-[9px] uppercase font-bold text-center leading-tight ${isActive ? "font-black" : ""}`}>
        {label}
      </span>
    </button>
  );
}
