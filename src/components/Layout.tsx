import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ user, role }: { user: User, role?: string | null }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = role === 'admin' ? [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { to: '/caixa', icon: Wallet, label: 'Caixa' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/orcamentos', icon: FileText, label: 'Orçamentos' },
    { to: '/alugueis', icon: CalendarClock, label: 'Aluguéis' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ] : [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { to: '/caixa', icon: Wallet, label: 'Caixa' },
    { to: '/entregas', icon: Truck, label: 'Entregas' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/estoque', icon: Package, label: 'Estoque' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-brand-red selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden h-20 border-b border-zinc-900 flex items-center justify-between px-6 bg-black/80 backdrop-blur-xl fixed top-0 w-full z-40">
        <div className="flex items-center gap-3">
           <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 text-brand-red">
              <Beer className="w-6 h-6" />
           </div>
           <span className="font-black text-xl tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red">2</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 active:scale-95 transition-all outline-none"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar Desktop & Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 w-80 bg-black border-r border-zinc-900 z-[110] flex flex-col shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-4 mb-12 px-2">
            <div className="w-12 h-12 bg-zinc-900 border-2 border-brand-red/20 rounded-[1.2rem] flex items-center justify-center shadow-xl">
              <Beer className="text-brand-red w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red">2</span></span>
              <span className="text-[9px] text-zinc-600 font-black tracking-[0.3em] uppercase mt-1">Premium Suite</span>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-5 px-6 py-4 rounded-2xl transition-all group relative border-2",
                  isActive 
                    ? "bg-brand-red border-brand-red text-white font-black shadow-lg shadow-red-600/20" 
                    : "text-zinc-500 border-transparent hover:text-white hover:bg-zinc-900/50 hover:border-zinc-800"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    {isActive && (
                      <motion.div layoutId="activeNavIndicator" className="absolute left-0 w-1 h-5 bg-white rounded-full ml-1.5" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-zinc-900">
            <div className="flex items-center gap-4 mb-6 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=ff0000&color=fff`} 
                className="w-10 h-10 rounded-xl border border-zinc-800" 
                referrerPolicy="no-referrer" 
                alt="Avatar" 
              />
              <div className="flex flex-col truncate">
                <span className="text-[10px] font-black text-white truncate uppercase tracking-tight">{user.displayName || 'ADMIN'}</span>
                <span className="text-[9px] text-zinc-600 truncate font-bold">{user.email}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 hover:bg-rose-950/20 text-zinc-500 hover:text-rose-500 border border-zinc-800 hover:border-rose-900/50 rounded-2xl transition-all font-black text-[9px] uppercase tracking-widest"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Close Button Mobile Header Inside Drawer */}
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="lg:hidden absolute top-6 right-6 p-3 bg-zinc-900 rounded-xl text-zinc-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 lg:pt-0 scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10 pb-32">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
