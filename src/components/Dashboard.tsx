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
      
      {/* Header Premium Dashboard */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
            CENTRAL DE <span className="text-brand-red">CONTROLE</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-3">SISTEMA ESKINÃO SERVE FEST 2.0</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900 shadow-xl border border-zinc-800 p-4 rounded-[2rem] self-center md:self-auto">
          <div className="flex -space-x-3">
             {[1,2,3].map(i => (
               <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-4 border-zinc-900 group relative cursor-pointer hover:z-10 hover:border-brand-red transition-all">
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">AI</div>
               </div>
             ))}
          </div>
          <div className="h-6 w-[1px] bg-zinc-800" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">SISTEMA OPERACIONAL ATIVO</span>
        </div>
      </section>

      {/* Primary KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
            title="Receita Hoje" 
            value={formatCurrency(stats.entriesToday)} 
            icon={TrendingUp} 
            variant="highlight" 
            sub="Bruto processado"
         />
         <StatCard 
            title="Caixa Disponível" 
            value={formatCurrency(stats.cashToday)} 
            icon={Wallet} 
            variant="dark"
            sub="Saldo imediato"
         />
         <StatCard 
            title="Despesas Dia" 
            value={formatCurrency(stats.exitsToday)} 
            icon={TrendingDown} 
            variant="dark"
            sub="Pagamentos realizados"
         />
         <StatCard 
            title="Margem Prevista" 
            value={formatCurrency(stats.profitToday)} 
            icon={Zap} 
            variant="dark"
            sub="Lucro operacional"
         />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         {/* Left Column: Quick Actions & Alerts */}
         <div className="lg:col-span-4 space-y-10">
            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] px-4">AÇÕES PRIORITÁRIAS</h3>
               <div className="grid grid-cols-2 gap-4">
                  {quickActions.map(action => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="group flex flex-col items-center justify-center gap-5 p-8 bg-zinc-900/50 border-2 border-zinc-900 rounded-[2.5rem] hover:border-brand-red/30 hover:bg-zinc-900 transition-all active:scale-95 shadow-xl"
                    >
                      <div className={cn("p-5 rounded-[1.5rem] group-hover:scale-110 transition-transform shadow-lg", action.color)}>
                        <action.icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 group-hover:text-white">{action.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            {/* Quick Alerts Premium */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-[3rem] p-8 space-y-6 shadow-inner">
               <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] px-2">STATUS CRÍTICO</h3>
               
               <AlertRow 
                  icon={Package} 
                  label="Itens em Falta" 
                  value={stats.lowStock} 
                  color="rose" 
                  onClick={() => navigate('/estoque')} 
               />
               <AlertRow 
                  icon={Truck} 
                  label="Entregas Ativas" 
                  value={stats.pendingDeliveries} 
                  color="emerald" 
                  onClick={() => navigate('/entregas')} 
               />
               <AlertRow 
                  icon={CalendarClock} 
                  label="Aluguéis Pendentes" 
                  value={stats.pendingRentals} 
                  color="amber" 
                  onClick={() => navigate('/alugueis')} 
               />
            </div>
         </div>

         {/* Right Column: Chart & Transactions */}
         <div className="lg:col-span-8 space-y-10">
            {/* Sales Chart Premium */}
            <section className="bg-zinc-900/40 border border-zinc-900 p-10 rounded-[4rem] shadow-2xl overflow-hidden relative">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">PICO DE <span className="text-brand-red">FLUXO</span></h3>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Performancê em tempo real</p>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 flex gap-2">
                     <span className="px-5 py-2 bg-brand-red text-white text-[9px] font-black rounded-xl">DIA ATUAL</span>
                     <span className="px-5 py-2 text-zinc-600 text-[9px] font-black rounded-xl">HISTÓRICO</span>
                  </div>
               </div>

               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#18181b" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#3f3f46', fontSize: 10, fontWeight: 900}} 
                        dy={20} 
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ background: '#09090b', border: '2px solid #18181b', borderRadius: '1.5rem', color: '#fff', fontSize: '12px', fontWeight: '900' }}
                      />
                      <Area type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={5} fillOpacity={1} fill="url(#gradientRed)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </section>

            {/* Transactions Premium List */}
            <section className="bg-zinc-900 border-2 border-zinc-900 rounded-[4rem] overflow-hidden shadow-2xl">
               <div className="p-10 border-b-2 border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">FLUXO RECENTE</h3>
                  <button onClick={() => navigate('/caixa')} className="flex items-center gap-3 text-[10px] font-black text-zinc-500 hover:text-white transition-all group uppercase tracking-widest">
                    VER HISTÓRICO COMPLETO
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
               <div className="divide-y-2 divide-zinc-800">
                 {recentTransactions.length > 0 ? (
                   recentTransactions.map(tx => (
                     <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-zinc-800/30 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform",
                             tx.type === 'expense' ? 'bg-zinc-800 text-brand-red' : 'bg-emerald-600/10 text-emerald-500'
                           )}>
                              {tx.type === 'expense' ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
                           </div>
                           <div className="flex flex-col space-y-1">
                              <span className="text-lg font-black uppercase text-zinc-100 tracking-tight group-hover:text-white">{tx.description}</span>
                              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{tx.category} • {new Date(tx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                        <span className={cn(
                          "text-2xl font-black tabular-nums tracking-tighter drop-shadow-sm",
                          tx.type === 'expense' ? 'text-brand-red' : 'text-emerald-500'
                        )}>
                          {tx.type === 'expense' ? '-' : '+'} {formatCurrency(tx.amount)}
                        </span>
                     </div>
                   ))
                 ) : (
                   <div className="p-24 text-center">
                      <LayoutDashboard className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                      <p className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.4em]">Aguardando movimentação...</p>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[3.5rem] p-10 flex flex-col gap-6 shadow-2xl relative overflow-hidden group border-2 transition-all hover:-translate-y-2",
        variant === 'highlight' ? "bg-brand-red border-brand-red shadow-red-600/20" : "bg-zinc-900 border-zinc-900"
      )}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className={cn(
          "p-5 rounded-[1.5rem] shadow-xl group-hover:scale-110 transition-transform",
          variant === 'highlight' ? "bg-white/20 text-white" : "bg-zinc-800 text-brand-red"
        )}>
           <Icon className="w-8 h-8" />
        </div>
      </div>
      <div className="relative z-10 space-y-1">
        <p className={cn("text-[10px] font-black uppercase tracking-[0.3em]", variant === 'highlight' ? "text-white/60" : "text-zinc-600")}>{title}</p>
        <h2 className={cn("text-3xl font-black tracking-tighter leading-none mb-1", variant === 'highlight' ? "text-white" : "text-white")}>{value}</h2>
        <p className={cn("text-[9px] font-bold uppercase tracking-widest", variant === 'highlight' ? "text-white/40" : "text-zinc-700")}>{sub}</p>
      </div>
      {variant === 'highlight' && (
         <div className="absolute top-0 right-0 p-8 text-white/5 -rotate-12 translate-x-1/2 -translate-y-1/2">
            <Icon className="w-48 h-48" />
         </div>
      )}
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
      className={cn("w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all active:scale-95 group", colors[color])}
    >
       <div className="flex items-center gap-5">
          <div className={cn("p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform", iconColors[color])}>
             <Icon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-tighter leading-none">{label}</span>
       </div>
       <span className="text-3xl font-black tabular-nums tracking-tighter leading-none">{value}</span>
    </button>
  );
}
