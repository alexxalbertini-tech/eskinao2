import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from '../lib/firebase';
import { LogIn, Key, Mail, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!email.includes('@')) {
        throw { code: 'auth/invalid-email' };
      }

      const adminEmail = 'eskinaoservefest@gmail.com';
      const adminPass = 'Eskinao@2026';

      try {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Acesso concedido! Redirecionando...');
      } catch (logErr: any) {
        // Special case: If it's the requested admin and it doesn't exist, create it
        if (email.toLowerCase() === adminEmail && (logErr.code === 'auth/user-not-found' || logErr.code === 'auth/invalid-credential')) {
          try {
            // Check if password matches the requested default password for auto-creation
            if (password === adminPass) {
              await createUserWithEmailAndPassword(auth, email, password);
              setSuccess('Administrador padrão criado e logado com sucesso!');
            } else {
              throw logErr; // Wrong password for existing or attempt with wrong pass for new admin
            }
          } catch (regErr: any) {
             throw regErr;
          }
        } else {
          throw logErr;
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(translateError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (password.length < 6) {
        throw { code: 'auth/weak-password' };
      }
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Conta criada com sucesso! Bem-vindo.');
      // App.tsx handles the profile creation
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(translateError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => setIsForgotPassword(false), 3000);
    } catch (err: any) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const translateError = (code: string) => {
    const errorStr = String(code).toLowerCase();
    console.warn("Auth Error Captured:", errorStr);

    if (errorStr.includes('invalid-credential') || errorStr.includes('wrong-password') || errorStr.includes('user-not-found')) {
      return 'E-mail ou senha incorretos. Verifique seus dados.';
    }
    if (errorStr.includes('email-already-in-use')) {
      return 'Este e-mail já está sendo usado em outra conta.';
    }
    if (errorStr.includes('weak-password')) {
      return 'Segurança baixa: a senha deve ter no mínimo 6 caracteres.';
    }
    if (errorStr.includes('invalid-email')) {
      return 'O formato do e-mail digitado não é válido.';
    }
    if (errorStr.includes('network-request-failed')) {
      return 'Erro de conexão: Não conseguimos alcançar o servidor. Verifique sua internet.';
    }
    if (errorStr.includes('too-many-requests')) {
      return 'Muitas tentativas malsucedidas. Tente novamente em alguns minutos.';
    }
    if (errorStr.includes('operation-not-allowed')) {
      return 'O login por e-mail/senha não está habilitado no Firebase.';
    }
    if (errorStr.includes('user-disabled')) {
      return 'Esta conta foi desativada pelo administrador.';
    }
    
    return 'Ocorreu um erro inesperado. Verifique os dados e tente novamente.';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-brand-red rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-brand-gold rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md"
      >
        <div className="bg-zinc-950/80 backdrop-blur-3xl border border-zinc-800 p-10 rounded-[3rem] shadow-2xl space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex flex-col items-center">
              <h1 className="text-6xl font-black tracking-tighter leading-[0.8] uppercase italic">
                <span className="text-brand-red drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">ESKINÃO</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-brand-silver font-bold tracking-[0.3em] text-sm uppercase">SERV FEST</span>
                <span className="text-brand-gold font-black text-2xl drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">2</span>
              </div>
            </div>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em] pt-4">
              GESTÃO PROFISSIONAL DE BEBIDAS
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-tight"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold uppercase tracking-tight"
              >
                <CheckCircle2 className="w-5 h-5" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form 
            onSubmit={isForgotPassword ? handleResetPassword : (isRegistering ? handleRegister : handleLogin)}
            className="space-y-4"
          >
            {isRegistering && !isForgotPassword && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-red transition-colors">
                    <LogIn className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" required
                    className="w-full bg-zinc-900 border border-zinc-900 focus:border-brand-red/50 rounded-2xl p-4 pl-12 text-white text-sm font-bold uppercase outline-none transition-all"
                    placeholder="DIGITE SEU NOME"
                    value={name} onChange={e => setName(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-red transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" required
                  className="w-full bg-zinc-900 border border-zinc-900 focus:border-brand-red/50 rounded-2xl p-4 pl-12 text-white text-sm font-bold outline-none transition-all"
                  placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Senha</label>
                  {!isRegistering && (
                    <button 
                      type="button" onClick={() => setIsForgotPassword(true)}
                      className="text-[10px] font-bold text-brand-gold/60 hover:text-brand-gold uppercase tracking-tighter"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-red transition-colors">
                    <Key className="w-4 h-4" />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full bg-zinc-900 border border-zinc-900 focus:border-brand-red/50 rounded-2xl p-4 pl-12 pr-12 text-white text-sm font-bold outline-none transition-all"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-red hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-red-600/10 uppercase tracking-[0.2em] relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   <span>AGUARDE...</span>
                </div>
              ) : (
                <span>{isForgotPassword ? 'ENVIAR RECUPERAÇÃO' : (isRegistering ? 'CRIAR CONTA AGORA' : 'ENTRAR NO SISTEMA')}</span>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-zinc-900 text-center space-y-4">
             {isForgotPassword ? (
                <button 
                  onClick={() => setIsForgotPassword(false)}
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white"
                >
                  Voltar para o Login
                </button>
             ) : (
                <button 
                  onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                  className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  {isRegistering ? (
                    'Já tem uma conta? Clique aqui'
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      Não tem acesso? Solicite agora
                    </>
                  )}
                </button>
             )}
             
             <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest">
               Eskinão 2 &copy; {new Date().getFullYear()} - Versão Premium
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
