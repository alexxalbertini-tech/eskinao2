import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAUpdater() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setInstallPrompt(null);
  };

  useEffect(() => {
    if (offlineReady) {
      setTimeout(() => setOfflineReady(false), 5000);
    }
  }, [offlineReady]);

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh || installPrompt) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[999] md:left-auto md:right-8 md:bottom-8 md:w-[400px]"
        >
          <div className="bg-zinc-900 border-2 border-brand-red/30 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-xl flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-red rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 text-white">
                {needRefresh ? <RefreshCw className="w-6 h-6 animate-spin-slow" /> : installPrompt ? <Download className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-black uppercase text-white tracking-tighter leading-none mb-1 text-sm">
                  {needRefresh ? 'Nova versão disponível!' : installPrompt ? 'Eskinão no seu Celular' : 'Pronto para uso offline'}
                </h3>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">
                  {needRefresh ? 'Atualize para as últimas melhorias' : installPrompt ? 'Instale o app na tela inicial' : 'O app agora funciona sem internet'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex-1 bg-brand-red hover:bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
                >
                  Atualizar Agora
                </button>
              )}
              {installPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg active:scale-95"
                >
                  Instalar Aplicativo
                </button>
              )}
              <button
                onClick={close}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
