import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db, 
  auth,
  orderBy
} from '../lib/firebase';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  CalendarClock, 
  ArrowUpRight,
  PlusCircle, 
  Truck,
  LayoutDashboard,
  Zap,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ businessId }: { role?: string | null, businessId?: string | null }) {
  const [stats, setStats] = useState({
    cashToday: 0,
    entriesToday: 0,
    exitsToday: 0,
    profitToday: 0,
    pendingRentals: 0,
    lowStock: 0,
    pendingDeliveries: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!businessId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        profitToday: income * 0.35, // Premium Margin logic
      }));
      setRecentTransactions(txs.slice(0, 5));
    });

    const stockQ = query(collection(db, 'produtos'), where('userId', '==', businessId));
    const unsubscribeStore = onSnapshot(stockQ, (snapshot) => {
      let low = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.quantity <= (data.alertThreshold || 5)) low++;
      });
      setStats(prev => ({ ...prev, lowStock: low }));
    });

    const rentalsQ = query(collection(db, 'alugueis'), where('userId', '==', businessId), where('status', '==', 'pending'));
    const unsubscribeRentals = onSnapshot(rentalsQ, (snapshot) => {
      setStats(prev => ({ ...prev, pendingRentals: snapshot.size }));
    });

    const deliveriesQ = query(collection(db, 'entregas'), where('userId', '==', businessId), where('status', 'in', ['pending', 'preparing', 'shipped']));
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
    { label: 'Nova Venda', icon: PlusCircle, path: '/vendas', color: 'bg-brand-red' },
    { label: 'Meu Caixa', icon: Wallet, path: '/caixa', color: 'bg-zinc-800' },
    { label: 'Estoque', icon: Package, path: '/estoque', color: 'bg-zinc-800' },
    { label: 'Logística', icon: Truck, path: '/entregas', color: 'bg-zinc-800' },
  ];

  const chartData = [
    { name: '08h', v: 400 }, { name: '10h', v: 800 }, { name: '12h', v: 1600 },
    { name: '14h', v: 1100 }, { name: '16h', v: 1900 }, { name: '18h', v: 2800 },
    { name: '20h', v: 2400 },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 pb-24 font-sans">
            {/* Header Optimized Dashboard */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            CENTRAL DE <span className="text-brand-red">CONTROLE</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">SISTEMA ESKINÃO SERVE FEST 2.0</p>
        </div>
        <div className="flex items-center gap-3 bg-[#121212] shadow-lg border border-zinc-900 p-2 px-4 rounded-full self-start md:self-auto">
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#121212] group relative cursor-pointer hover:z-10 hover:border-brand-red transition-all">
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white">AI</div>
               </div>
             ))}
          </div>
          <div className="h-4 w-[1px] bg-zinc-800" />
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">SISTEMA ATIVO</span>
        </div>
      </section>

      {/* Primary KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 font-sans uppercase">
         <StatCard 
            title="Receita" 
            value={formatCurrency(stats.entriesToday)} 
            icon={TrendingUp} 
            variant="highlight" 
            sub="Bruto"
         />
         <StatCard 
            title="Caixa" 
            value={formatCurrency(stats.cashToday)} 
            icon={Wallet} 
            variant="dark"
            sub="Saldo"
         />
         <StatCard 
            title="Saídas" 
            value={formatCurrency(stats.exitsToday)} 
            icon={TrendingDown} 
            variant="dark"
            sub="Hoje"
         />
         <StatCard 
            title="Lucro" 
            value={formatCurrency(stats.profitToday)} 
            icon={Zap} 
            variant="dark"
            sub="Previsto"
         />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
         {/* Left Column: Quick Actions & Alerts */}
         <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
               <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2">AÇÕES RÁPIDAS</h3>
               <div className="grid grid-cols-2 gap-3">
                  {quickActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="group flex flex-col items-center justify-center gap-2 p-4 bg-[#121212] border border-zinc-900 rounded-xl hover:border-brand-red/30 transition-all active:scale-95 shadow-lg"
                    >
                      <div className={cn("p-3 rounded-lg group-hover:scale-110 transition-transform shadow-md", action.color)}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-zinc-400 group-hover:text-white leading-none mt-1">{action.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Quick Alerts Optimized */}
            <div className="bg-[#0c0c0c] border border-zinc-900 rounded-2xl p-4 space-y-3 shadow-inner">
               <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] px-1">ALERTAS</h3>
               
               <AlertRow 
                  icon={Package} 
                  label="Faltando" 
                  value={stats.lowStock} 
                  color="rose" 
                  onClick={() => navigate('/estoque')} 
               />
               <AlertRow 
                  icon={Truck} 
                  label="Entregas" 
                  value={stats.pendingDeliveries} 
                  color="emerald" 
                  onClick={() => navigate('/entregas')} 
               />
               <AlertRow 
                  icon={CalendarClock} 
                  label="Aluguéis" 
                  value={stats.pendingRentals} 
                  color="amber" 
                  onClick={() => navigate('/alugueis')} 
               />
            </div>
         </div>

         {/* Right Column: Chart & Transactions */}
         <div className="lg:col-span-8 space-y-6">
            {/* Sales Chart Optimized */}
            <section className="bg-[#121212] border border-zinc-900 p-6 rounded-2xl shadow-xl overflow-hidden relative">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">FLUXO <span className="text-brand-red">DIÁRIO</span></h3>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none">Performance em tempo real</p>
                  </div>
                  <div className="bg-[#0a0a0a] p-1 rounded-xl border border-zinc-900 flex gap-1">
                     <span className="px-3 py-1.5 bg-brand-red text-white text-[8px] font-black rounded-lg">HOJE</span>
                     <span className="px-3 py-1.5 text-zinc-600 text-[8px] font-black rounded-lg">HISTÓRICO</span>
                  </div>
               </div>

               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#3f3f46', fontSize: 8, fontBold: 'bold'}} 
                        dy={10} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '0.75rem', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#gradientRed)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </section>

            {/* Transactions Optimized List */}
            <section className="bg-[#121212] border border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
               <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter">MOVIMENTAÇÕES</h3>
                  <button onClick={() => navigate('/caixa')} className="flex items-center gap-2 text-[8px] font-black text-zinc-500 hover:text-white transition-all group uppercase tracking-widest">
                    VER TUDO
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
               <div className="divide-y border-zinc-800/10">
                 {recentTransactions.length > 0 ? (
                   recentTransactions.map(tx => (
                     <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/20 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "w-10 h-10 rounded-lg flex items-center justify-center shadow-md",
                             tx.type === 'expense' ? 'bg-zinc-800 text-brand-red' : 'bg-emerald-600/10 text-emerald-500'
                           )}>
                              {tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                           </div>
                           <div className="flex flex-col -space-y-0.5">
                              <span className="text-[11px] font-black uppercase text-zinc-200 tracking-tight leading-none group-hover:text-white">{tx.description}</span>
                              <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{tx.category} • {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                        <span className={cn(
                          "text-base font-black tabular-nums tracking-tighter",
                          tx.type === 'expense' ? 'text-brand-red' : 'text-emerald-500'
                        )}>
                          {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                        </span>
                     </div>
                   ))
                 ) : (
                   <div className="p-16 text-center">
                      <LayoutDashboard className="w-12 h-12 text-zinc-800/50 mx-auto mb-4" />
                      <p className="text-zinc-700 uppercase text-[8px] font-black tracking-widest">Aguardando dados...</p>
                   </div>
                 )}
               </div>
            </section>
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, variant, sub }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-4 md:p-6 flex flex-col gap-4 shadow-xl relative overflow-hidden group border transition-all active:scale-95",
        variant === 'highlight' ? "bg-brand-red border-brand-red" : "bg-[#121212] border-zinc-900"
      )}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className={cn(
          "p-3 rounded-lg shadow-lg group-hover:scale-110 transition-transform",
          variant === 'highlight' ? "bg-white/20 text-white" : "bg-zinc-900 text-brand-red"
        )}>
           <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10 space-y-0.5">
        <p className={cn("text-[8px] font-black uppercase tracking-widest", variant === 'highlight' ? "text-white/60" : "text-zinc-600")}>{title}</p>
        <h2 className={cn("text-xl md:text-2xl font-black tracking-tighter leading-none whitespace-nowrap", variant === 'highlight' ? "text-white" : "text-zinc-100")}>{value}</h2>
        <p className={cn("text-[7px] font-bold uppercase tracking-widest", variant === 'highlight' ? "text-white/40" : "text-zinc-700")}>{sub}</p>
      </div>
    </motion.div>
  );
}

function AlertRow({ icon: Icon, label, value, color, onClick }: any) {
  const colors: any = {
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };
  
  const iconColors: any = {
    rose: 'bg-rose-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-black',
  };

  return (
    <button 
      onClick={onClick}
      className={cn("w-full flex items-center justify-between p-3.5 px-4 rounded-xl border transition-all active:scale-95 group", colors[color])}
    >
       <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg shadow-md group-hover:scale-110 transition-transform", iconColors[color])}>
             <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight leading-none">{label}</span>
       </div>
       <span className="text-xl font-black tabular-nums tracking-tighter leading-none">{value}</span>
    </button>
  );
}
