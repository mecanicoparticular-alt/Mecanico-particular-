import React, { useState } from "react";
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { 
  Wrench, Mail, Lock, Sparkles, Eye, EyeOff, User, ArrowRight, CheckCircle, ShieldCheck
} from "lucide-react";

interface ModuloAuthProps {
  onDemoAccess: () => void;
  onSuccess: (mensaje: string) => void;
}

export default function ModuloAuth({ onDemoAccess, onSuccess }: ModuloAuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreTaller, setNombreTaller] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, rellena todos los campos.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (isRegister && !nombreTaller.trim()) {
      setErrorMsg("Por favor, introduce el nombre de tu taller.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile display name with Workshop name
        await updateProfile(userCredential.user, { 
          displayName: nombreTaller.trim() 
        });

        // Seed initial workshop configuration in Firestore
        const defaultConfig = {
          nombreComercial: nombreTaller.trim(),
          razonSocial: "",
          cif: "",
          direccion: "",
          telefono: "",
          precioManoObra: 45,
          textoLegal: "El cliente autoriza las pruebas de carretera necesarias y acepta los términos de garantía oficiales.",
          logoUrl: null,
        };

        await setDoc(doc(db, "taller_config", userCredential.user.uid), defaultConfig);
        onSuccess(`¡Taller "${nombreTaller.trim()}" registrado correctamente!`);
      } else {
        // Sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(`¡Bienvenido de nuevo, ${userCredential.user.displayName || "Mecánico"}!`);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let localizedError = "Ha ocurrido un error en la autenticación. Inténtalo de nuevo.";
      
      if (error.code === "auth/email-already-in-use") {
        localizedError = "Este correo electrónico ya está registrado.";
      } else if (error.code === "auth/invalid-email") {
        localizedError = "El formato de correo electrónico no es válido.";
      } else if (error.code === "auth/weak-password") {
        localizedError = "La contraseña debe tener un mínimo de 6 caracteres.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        localizedError = "Correo electrónico o contraseña incorrectos.";
      }
      
      setErrorMsg(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onSuccess(`¡Sesión iniciada con Google como ${result.user.displayName || "Usuario"}!`);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      setErrorMsg("No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 border border-amber-400/30 mb-4 animate-bounce">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-center bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Mecánico Particular
          </h1>
          <p className="text-slate-400 font-semibold text-xs tracking-wider uppercase mt-1">
            Gestión Profesional de Talleres
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/60 mb-6">
          <button
            onClick={() => {
              setIsRegister(false);
              setErrorMsg("");
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isRegister 
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setErrorMsg("");
            }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isRegister 
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Validation Errors */}
        {errorMsg && (
          <div className="mb-5 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3 animate-head-shake">
            <span className="w-2 h-2 mt-1.5 bg-red-500 rounded-full shrink-0"></span>
            <span className="text-xs font-semibold text-red-300 leading-normal">{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block ml-1">
                Nombre de tu Taller
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ej. Taller Hermanos Gómez"
                  value={nombreTaller}
                  onChange={(e) => setNombreTaller(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 rounded-2xl py-3.5 pl-11.5 pr-4 text-xs font-semibold text-white placeholder-slate-600 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block ml-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="mecanico@taller.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 rounded-2xl py-3.5 pl-11.5 pr-4 text-xs font-semibold text-white placeholder-slate-600 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block ml-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isRegister ? "Mínimo 6 caracteres" : "••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 rounded-2xl py-3.5 pl-11.5 pr-12 text-xs font-semibold text-white placeholder-slate-600 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs py-3.5 rounded-2xl shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isRegister ? "Crear Mi Cuenta de Taller" : "Iniciar Sesión"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-[1px] bg-slate-800 grow"></div>
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">O</span>
          <div className="h-[1px] bg-slate-800 grow"></div>
        </div>

        {/* Google sign-in option */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-md"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Demo local access link */}
        <div className="text-center mt-6">
          <button
            onClick={onDemoAccess}
            className="text-amber-500/70 hover:text-amber-400 text-[11px] font-bold tracking-wider hover:underline transition-all cursor-pointer uppercase font-mono"
          >
            Probar sin cuenta (Modo Demo Offline)
          </button>
        </div>

      </div>

      {/* Security notice banner */}
      <div className="mt-8 flex items-center gap-2 text-slate-500 font-medium text-[10px] tracking-wide relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-500/60" />
        <span>Conexión cifrada de alta seguridad SSL</span>
      </div>
    </div>
  );
}
