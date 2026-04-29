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
    <div className="flex min-h-screen bg-[#0f0f0f] text-[#eaeaea] font-sans selection:bg-brand-red selection:text-white">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-zinc-900/50 flex items-center justify-between px-4 bg-[#0f0f0f]/80 backdrop-blur-xl fixed top-0 w-full z-40">
        <div className="flex items-center gap-2">
           <div className="bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 text-brand-red">
              <Beer className="w-5 h-5" />
           </div>
           <span className="font-black text-lg tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red">2</span></span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="p-2 bg-zinc-900 rounded-lg text-zinc-400 active:scale-95 transition-all outline-none"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
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
        "fixed inset-y-0 left-0 w-72 bg-[#0c0c0c] border-r border-zinc-900 z-[110] flex flex-col shadow-2xl transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col h-full overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-3 mb-10 px-1">
            <div className="w-10 h-10 bg-zinc-900 border border-brand-red/20 rounded-lg flex items-center justify-center shadow-lg">
              <Beer className="text-brand-red w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter leading-none uppercase text-white">ESKINÃO <span className="text-brand-red">2</span></span>
              <span className="text-[8px] text-zinc-600 font-black tracking-[0.3em] uppercase mt-0.5">Premium Suite</span>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-all group relative border-2 border-transparent",
                  isActive 
                    ? "bg-brand-red/10 border-brand-red/30 text-brand-red font-black" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    {isActive && (
                      <motion.div layoutId="activeNavIndicator" className="absolute left-0 w-0.5 h-4 bg-brand-red rounded-full ml-1" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-zinc-900">
            <div className="flex items-center gap-3 mb-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=ff0000&color=fff`} 
                className="w-8 h-8 rounded-lg border border-zinc-800" 
                referrerPolicy="no-referrer" 
                alt="Avatar" 
              />
              <div className="flex flex-col truncate">
                <span className="text-[9px] font-black text-white truncate uppercase tracking-tight">{user.displayName || 'ADMIN'}</span>
                <span className="text-[8px] text-zinc-600 truncate font-bold">{user.email}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-rose-950/20 text-zinc-500 hover:text-rose-500 border border-zinc-800 hover:border-rose-900/50 rounded-lg transition-all font-black text-[8px] uppercase tracking-widest"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>

        {/* Close Button Mobile Header Inside Drawer */}
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="lg:hidden absolute top-4 right-4 p-2 bg-zinc-900 rounded-lg text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 lg:pt-0 scroll-smooth">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pb-32">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
