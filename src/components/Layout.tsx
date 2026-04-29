import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { auth, signOut } from '../lib/firebase';
import { 
  LayoutDashboard, 
  Wallet, 
  Package, 
  CalendarClock, 
  ShoppingCart, 
  BarChart3, 
  Users,
  LogOut,
  Menu,
  X,
  Beer,
  Truck,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, role }: { user: User, role?: string | null }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = role === 'admin' ? [
    { to: '/', icon: LayoutDashboard, label: 'Painel' },
    { to: '/caixa', icon: Wallet, label: 'Caixa' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
    { to: '/alugueis', icon: CalendarClock, label: 'Aluguéis' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ] : [
    { to: '/', icon: LayoutDashboard, label: 'Painel' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-amber-500 selection:text-black">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-zinc-900 flex items-center justify-between px-4 bg-black/80 backdrop-blur-lg fixed top-0 w-full z-50">
        <div className="flex items-center gap-2">
           <div className="flex items-baseline font-black leading-tight tracking-tighter uppercase italic text-lg lg:text-xl">
             <span className="text-brand-red drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">ESKINÃO</span>
             <span className="text-brand-silver ml-1.5 text-xs lg:text-sm brightness-110">SERV FEST</span>
             <span className="text-brand-gold ml-1 text-base lg:text-lg drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">2</span>
           </div>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <>
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col",
                !isSidebarOpen && "hidden lg:flex"
              )}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-zinc-900 border border-brand-red/30 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/10 group-hover:border-brand-red/60 transition-all">
                    <Beer className="text-brand-red w-8 h-8 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter leading-[0.8] uppercase text-brand-red drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">ESKINÃO</span>
                    <span className="text-[11px] text-brand-silver font-bold tracking-[0.25em] uppercase mt-1">SERV FEST <span className="text-brand-gold ml-1">2</span></span>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                        isActive 
                          ? "bg-amber-500 text-black font-bold" 
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium uppercase tracking-wider">{item.label}</span>
                      {/* Active indicator bar */}
                      <span className="absolute left-0 w-1 h-full bg-black translate-x-[-100%] group-active:translate-x-0 transition-transform" />
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="mt-auto p-4 border-t border-zinc-900 bg-zinc-950/50">
                <div className="flex items-center gap-3 mb-4 p-2">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border border-zinc-800" referrerPolicy="no-referrer" alt={user.displayName || 'User'} />
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-white truncate">{user.displayName || 'Usuário'}</span>
                    <span className="text-xs text-zinc-500 truncate">{user.email}</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
              </div>

              {/* Close Button Mobile */}
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 text-zinc-400">
                <X className="w-6 h-6" />
              </button>
            </motion.aside>

            {/* Backdrop Mobile */}
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
