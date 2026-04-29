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
    { to: '/caixa', icon: Wallet, label: 'Caixa' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-red selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden h-20 border-b border-zinc-900 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
           <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-brand-red">
              <Beer className="w-6 h-6" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red">2</span></span>
             <span className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Test Mode Active</span>
           </div>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 active:scale-95 transition-all">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <>
            <motion.aside 
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed inset-y-0 left-0 w-80 bg-black border-r border-zinc-900 z-[60] flex flex-col shadow-2xl",
                !isSidebarOpen && "hidden lg:flex"
              )}
            >
              <div className="p-10 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-16 px-2">
                  <div className="w-14 h-14 bg-zinc-900 border-2 border-brand-red/20 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-brand-red/10 group-hover:border-brand-red/60 transition-all">
                    <Beer className="text-brand-red w-8 h-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red font-black drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">2</span></span>
                    <span className="text-[10px] text-zinc-600 font-black tracking-[0.3em] uppercase mt-1">Premium Suite</span>
                  </div>
                </div>

                <nav className="space-y-2 flex-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all group relative overflow-hidden border-2",
                        isActive 
                          ? "bg-brand-red border-brand-red text-white font-black shadow-2xl shadow-red-600/30" 
                          : "text-zinc-600 border-transparent hover:text-white hover:bg-zinc-900/50 hover:border-zinc-800"
                      )}
                    >
                      <item.icon className={cn("w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110")} />
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]">{item.label}</span>
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div layoutId="activeNav" className="absolute left-0 w-1.5 h-6 bg-white rounded-full ml-1" />
                      )}
                    </NavLink>
                  ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-zinc-900">
                  <div className="flex items-center gap-4 mb-8 bg-zinc-900/40 p-4 rounded-3xl border border-zinc-900">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=ff0000&color=fff`} className="w-12 h-12 rounded-2xl border-2 border-zinc-800 shadow-xl" referrerPolicy="no-referrer" alt={user.displayName || 'User'} />
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-black text-white truncate uppercase tracking-tight">{user.displayName || 'ADMIN TESTE'}</span>
                      <span className="text-[10px] text-zinc-600 truncate font-bold">{user.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-zinc-900 hover:bg-rose-950/20 text-zinc-500 hover:text-rose-500 border border-zinc-800 hover:border-rose-900/50 rounded-[1.5rem] transition-all font-black text-[10px] uppercase tracking-[0.2em]"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair do Sistema
                  </button>
                </div>
              </div>

              {/* Close Button Mobile */}
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-8 right-8 p-4 bg-zinc-900 rounded-2xl text-zinc-400">
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
                className="lg:hidden fixed inset-0 bg-black/90 backdrop-blur-xl z-[55]"
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-80 pt-20 lg:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
