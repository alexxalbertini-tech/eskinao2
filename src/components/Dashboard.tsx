import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db, 
  auth,
  orderBy,
  limit
} from '../lib/firebase';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CalendarClock, 
  ArrowUpRight,
  TrendingUp as ProfitIcon,
  Plus, 
  PlusCircle, 
  Grip,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [stats, setStats] = useState({
    cashToday: 0,
    entriesToday: 0,
    exitsToday: 0,
    profitToday: 0,
    pendingRentals: 0,
    lowStock: 0,
    pendingDeliveries: 0
  });

  const isAdmin = role === 'admin';
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  useEffect(() => {
    if (!businessId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch transactions today
    const q = query(
      collection(db, 'caixa'),
      where('userId', '==', businessId),
      where('date', '>=', today.toISOString()),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let income = 0;
      let expense = 0;
      const txs: any[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'income' || data.type === 'sale') income += data.amount;
        if (data.type === 'expense') expense += data.amount;
        txs.push({ id: doc.id, ...data });
      });

      setStats(prev => ({
        ...prev,
        entriesToday: income,
        exitsToday: expense,
        cashToday: income - expense,
        profitToday: income * 0.3,
      }));
      setRecentTransactions(txs.slice(0, 5));
    });

    // Fetch low stock
    const stockQ = query(
      collection(db, 'produtos'),
      where('userId', '==', businessId),
    );

    const unsubscribeStore = onSnapshot(stockQ, (snapshot) => {
      let low = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.quantity <= (data.alertThreshold || 5)) low++;
      });
      setStats(prev => ({ ...prev, lowStock: low }));
    });

    // Fetch pending rentals
    const rentalsQ = query(
      collection(db, 'alugueis'),
      where('userId', '==', businessId),
      where('status', '==', 'pending')
    );

    const unsubscribeRentals = onSnapshot(rentalsQ, (snapshot) => {
      setStats(prev => ({ ...prev, pendingRentals: snapshot.size }));
    });

    // Fetch pending deliveries
    const deliveriesQ = query(
      collection(db, 'entregas'),
      where('userId', '==', businessId),
      where('status', 'in', ['pending', 'preparing', 'shipped'])
    );

    const unsubscribeDeliveries = onSnapshot(deliveriesQ, (snapshot) => {
      setStats(prev => ({ ...prev, pendingDeliveries: snapshot.size }));
    });

    return () => {
      unsubscribe();
      unsubscribeStore();
      unsubscribeRentals();
      unsubscribeDeliveries();
    };
  }, [businessId]);

  const quickActions = [
    { label: 'Nova Venda', icon: PlusCircle, path: '/vendas', color: 'bg-emerald-500' },
    { label: 'Novo Aluguel', icon: CalendarClock, path: '/alugueis', color: 'bg-amber-500' },
    { label: 'Entrada', icon: TrendingUp, path: '/caixa', color: 'bg-blue-500' },
    { label: 'Saída', icon: TrendingDown, path: '/caixa', color: 'bg-rose-500' },
  ];

  const chartData = [
    { name: 'Seg', v: 400 },
    { name: 'Ter', v: 300 },
    { name: 'Qua', v: 600 },
    { name: 'Qui', v: 800 },
    { name: 'Sex', v: 1200 },
    { name: 'Sáb', v: 1500 },
    { name: 'Dom', v: 1100 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* PWA Install Banner */}
      {showInstallBtn && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-red p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-red-600/20 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Package className="text-white w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-tighter">Instalar Aplicativo Oficial</p>
              <p className="text-white/80 text-[10px] font-medium uppercase tracking-widest">Tenha o Eskinão 2 sempre com você</p>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-white text-brand-red px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors"
          >
            Instalar Agora
          </button>
        </motion.div>
      )}

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Resumo de Caixa</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">VISÃO GERAL DO DIA</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shrink-0">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-black border-2 border-zinc-900">EF</div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-900">+</div>
          </div>
          <span className="text-xs font-bold text-zinc-400 px-2 uppercase tracking-tighter">Equipe Online</span>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {isAdmin && (
           <>
             <StatCard 
                title="Caixa Hoje" 
                value={formatCurrency(stats.cashToday)} 
                icon={Wallet} 
                color="amber" 
                trend="+12%"
             />
             <StatCard 
                title="Entradas" 
                value={formatCurrency(stats.entriesToday)} 
                icon={TrendingUp} 
                color="emerald" 
             />
             <StatCard 
                title="Saídas" 
                value={formatCurrency(stats.exitsToday)} 
                icon={TrendingDown} 
                color="rose" 
             />
             <StatCard 
                title="Lucro Estimado" 
                value={formatCurrency(stats.profitToday)} 
                icon={ProfitIcon} 
                color="indigo" 
             />
           </>
         )}
         {!isAdmin && (
           <>
             <StatCard 
                title="Entregas Ativas" 
                value={stats.pendingDeliveries} 
                icon={Truck} 
                color="emerald" 
             />
             <StatCard 
                title="Estoque Crítico" 
                value={stats.lowStock} 
                icon={Package} 
                color="rose" 
             />
             <StatCard 
                title="Aluguéis Pendentes" 
                value={stats.pendingRentals} 
                icon={CalendarClock} 
                color="amber" 
             />
           </>
         )}
      </section>

      {/* Secondary Info Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Ações Rápidas</h3>
           <div className="grid grid-cols-2 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all group"
                >
                  <div className={cn("p-4 rounded-2xl group-hover:scale-110 transition-transform", action.color)}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tighter text-zinc-300">{action.label}</span>
                </button>
              ))}
           </div>

           {/* Alerts */}
           <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500 rounded-lg text-white">
                       <Package className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-rose-500 uppercase tracking-tighter">Estoque Baixo</span>
                 </div>
                 <span className="text-xl font-black text-rose-500">{stats.lowStock}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-lg text-white">
                       <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-emerald-500 uppercase tracking-tighter">Entregas Ativas</span>
                 </div>
                 <span className="text-xl font-black text-emerald-500">{stats.pendingDeliveries}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg text-white">
                       <CalendarClock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-blue-500 uppercase tracking-tighter">Aluguéis Ativos</span>
                 </div>
                 <span className="text-xl font-black text-blue-500">{stats.pendingRentals}</span>
              </div>
           </div>
        </div>

        {/* Charts & Table */}
        <div className="lg:col-span-2 space-y-6">
           {isAdmin && (
             <>
               {/* Chart */}
               <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Faturamento Semanal</h3>
                     <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-bold text-amber-500 uppercase">
                        Este Mês
                     </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#f59e0b', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Recent Transactions */}
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Transações Recentes</h3>
                     <button onClick={() => navigate('/caixa')} className="text-xs font-bold text-amber-500 uppercase tracking-widest hover:underline">Ver Todas</button>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map(tx => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                tx.type === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                              )}>
                                 {tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-sm font-bold uppercase tracking-tighter truncate max-w-[120px] sm:max-w-none">{tx.description}</span>
                                 <span className="text-[10px] text-zinc-500 font-bold uppercase">{tx.category} • {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                           </div>
                           <span className={cn(
                             "text-sm font-black",
                             tx.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'
                           )}>
                             {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                           </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-zinc-600 uppercase text-xs font-bold tracking-widest">Nenhuma transação hoje</div>
                    )}
                  </div>
               </div>
            </>
           )}
           {!isAdmin && (
             <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-amber-500">
                   <LayoutDashboard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Bem-vindo ao Painel Eskinão 2</h3>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest max-w-sm mx-auto">
                   Utilize as ações rápidas ao lado para gerenciar as operações do dia. Dúvidas? Fale com o administrador.
                </p>
             </div>
           )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    amber: 'bg-amber-500 text-black',
    emerald: 'bg-emerald-500 text-white',
    rose: 'bg-rose-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-3 rounded-2xl", colors[color])}>
           <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</p>
        <h2 className="text-2xl font-black tracking-tighter text-white uppercase">{value}</h2>
      </div>
    </motion.div>
  );
}
