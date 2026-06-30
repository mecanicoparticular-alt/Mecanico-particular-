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
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { 
  Wrench, 
  Mail, 
  Lock, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building 
} from "lucide-react";

interface MenuInicioSesionProps {
  onSuccess: (mensaje: string) => void;
}

export default function MenuInicioSesion({ onSuccess }: MenuInicioSesionProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombreTaller, setNombreTaller] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Por favor, rellena todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
      if (!nombreTaller.trim()) {
        setError("Por favor, introduce el nombre de tu taller.");
        setLoading(false);
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase profile with workshop name
        await updateProfile(user, {
          displayName: nombreTaller.trim(),
        });

        // Initialize taller_config document for this user in Firestore
        const defaultVal = {
          nombreComercial: nombreTaller.trim(),
          razonSocial: nombreTaller.trim(),
          cif: "",
          direccion: "",
          telefono: "",
          precioManoObra: 45,
          textoLegal: "El cliente autoriza las pruebas de carretera necesarias y acepta los términos de garantía oficiales.",
          logoUrl: null,
          geminiApiKey: ""
        };

        await setDoc(doc(db, "taller_config", user.uid), defaultVal);
        onSuccess(`¡Cuenta creada con éxito para ${nombreTaller}!`);
      } catch (err: any) {
        console.error("Registration error:", err);
        if (err.code === "auth/email-already-in-use") {
          setError("Este correo electrónico ya está registrado.");
        } else if (err.code === "auth/invalid-email") {
          setError("El formato del correo electrónico no es válido.");
        } else {
          setError(err.message || "Error al crear la cuenta.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(`¡Sesión iniciada con éxito!`);
      } catch (err: any) {
        console.error("Login error:", err);
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          setError("Correo o contraseña incorrectos.");
        } else {
          setError(err.message || "Error al iniciar sesión.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // If no displayName is found, we use a generic name
      const name = result.user.displayName || "Taller Mecánico";
      
      // We check if the taller_config exists inside onSnapshot in App.tsx. 
      // If not, App.tsx will write the default document.
      onSuccess(`¡Bienvenido, ${name}!`);
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Logo and Brand Heading */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20 border border-amber-400/20 mb-4 animate-slide-up">
            <Wrench className="w-9 h-9 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            MECÁNICO PARTICULAR
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            Gestión profesional de talleres en la nube
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-slide-up">
          
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950/60 p-1.5 rounded-2xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError("");
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isRegister 
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/10" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Acceder</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError("");
              }}
              className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isRegister 
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/10" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrarse</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl flex items-start gap-3 text-red-300 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Workshop Name (Register Only) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Nombre de tu Taller / Comercial
                </label>
                <div className="relative">
                  <Building className="w-4.5 h-4.5 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nombreTaller}
                    onChange={(e) => setNombreTaller(e.target.value)}
                    placeholder="Ej. Talleres Perez o Tu Nombre"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register Only) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/15 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isRegister ? "Crear Cuenta de Taller" : "Iniciar Sesión"}</span>
                </>
              )}
            </button>

          </form>

          {/* Social Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-slate-950/60 px-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">
              o continuar con
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Inicia sesión con Google</span>
          </button>

          {/* Isolation Info Message */}
          <p className="text-[10px] text-center text-slate-500 font-semibold leading-relaxed mt-6">
            Al registrarte se crea una base de datos segura y exclusiva en la nube para tu taller, manteniendo tus clientes, presupuestos y facturas totalmente privados.
          </p>

        </div>

      </div>
    </div>
  );
}
