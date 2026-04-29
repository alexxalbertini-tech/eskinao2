import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db
} from '../lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  CircleDollarSign
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Reports({ businessId }: { role?: string | null, businessId?: string | null }) {
  const [data, setData] = useState({
    transactions: [] as any[],
    products: [] as any[],
    rentals: [] as any[],
  });

  useEffect(() => {
    if (!businessId) return;

    const unsubscribeTxs = onSnapshot(query(collection(db, 'vendas'), where('userId', '==', businessId)), (snap) => {
      setData(prev => ({ ...prev, transactions: snap.docs.map(doc => doc.data()) }));
    });
    const unsubscribeProd = onSnapshot(query(collection(db, 'produtos'), where('userId', '==', businessId)), (snap) => {
      setData(prev => ({ ...prev, products: snap.docs.map(doc => doc.data()) }));
    });
    const unsubscribeRent = onSnapshot(query(collection(db, 'alugueis'), where('userId', '==', businessId)), (snap) => {
      setData(prev => ({ ...prev, rentals: snap.docs.map(doc => doc.data()) }));
    });

    return () => {
      unsubscribeTxs();
      unsubscribeProd();
      unsubscribeRent();
    };
  }, [businessId]);

  const salesByCategory = data.products.reduce((acc: any, p: any) => {
    const existing = acc.find((a: any) => a.name === p.category);
    if (existing) existing.value += 1;
    else acc.push({ name: p.category, value: 1 });
    return acc;
  }, []);

  const totalSalesFromVendas = data.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const lowStockCount = data.products.filter(p => p.quantity <= (p.alertThreshold || 5)).length;

  const PREMIUM_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff', '#4b5563'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Optimized */}
      <section className="flex flex-col gap-2">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            ANÁLISE <span className="text-brand-red">ESTRATÉGICA</span>
          </h1>
          <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.4em] mt-1">RELATÓRIOS E INTELIGÊNCIA DE NEGÓCIO</p>
        </div>
      </section>

      {/* Stats Overview Optimized */}
      <section className="grid grid-cols-1 gap-3">
         <ReportStatCard 
            title="Volume de Vendas" 
            value={formatCurrency(totalSalesFromVendas)} 
            icon={CircleDollarSign} 
            color="brand-red" 
            sub="Faturamento Processado"
         />
         <div className="grid grid-cols-2 gap-3">
            <ReportStatCard 
               title="Inventário" 
               value={data.products.length} 
               icon={Package} 
               color="zinc-900" 
               sub="SKUs Cadastrados"
            />
            <ReportStatCard 
               title="Ruptura" 
               value={lowStockCount} 
               icon={AlertCircle} 
               color={lowStockCount > 0 ? "rose-500" : "emerald-500"} 
               sub="Estoque baixo"
            />
         </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
         {/* Pie Chart - Category Distribution Optimized */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-[#121212] border border-zinc-900 p-6 rounded-2xl shadow-lg"
         >
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-brand-red/10 p-2 rounded-lg">
                 <PieIcon className="w-4 h-4 text-brand-red" />
               </div>
               <h3 className="text-sm font-black text-white uppercase tracking-tighter">MIX DE PRODUTOS</h3>
            </div>

            <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      paddingAngle={4}
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                    >
                      {salesByCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ background: '#09090b', border: 'none', borderRadius: '1rem', fontSize: '9px', padding: '10px' }}
                       itemStyle={{ fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value) => <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">{value}</span>}
                    />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         {/* Bar Chart - Ranking Stocks Optimized */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-[#121212] border border-zinc-900 p-6 rounded-2xl shadow-lg"
         >
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-brand-red/10 p-2 rounded-lg">
                 <BarChart3 className="w-4 h-4 text-brand-red" />
               </div>
               <h3 className="text-sm font-black text-white uppercase tracking-tighter">TOP 10 ESTOQUES</h3>
            </div>

            <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.products.sort((a,b) => b.quantity - a.quantity).slice(0, 10)} margin={{bottom: 40}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#3f3f46', fontSize: 8, fontWeight: 900}} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#3f3f46', fontSize: 8}} />
                    <Tooltip 
                      cursor={{fill: '#18181b'}}
                      contentStyle={{ background: '#09090b', border: 'none', borderRadius: '1rem', fontWeight: '900', color: '#fff', fontSize: '9px' }}
                    />
                    <Bar dataKey="quantity" fill="#ef4444" radius={[6, 6, 0, 0]}>
                       {data.products.slice(0, 10).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#27272a'} />
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </motion.div>
      </div>

      {/* Transaction Efficiency Section Optimized */}
      <section className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 flex flex-col items-center gap-6">
         <div className="w-16 h-16 bg-brand-red rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-red-900/20">
            <TrendingUp className="w-7 h-7 text-white" />
         </div>
         <div className="space-y-1.5 text-center">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Insights de Lucratividade</h3>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
               Sua média de vendas diária cresceu 15% nos últimos 7 dias. Foque em repor <span className="text-brand-red">Cervejas</span> para o fim de semana.
            </p>
         </div>
         <div className="w-full bg-black/40 p-4 rounded-xl border border-zinc-900/50 text-center">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Checkout Médio</span>
            <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(totalSalesFromVendas / (data.transactions.length || 1))}</span>
         </div>
      </section>
    </div>
  );
}

function ReportStatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className={cn(
      "p-5 rounded-2xl border transition-all flex flex-col gap-4 relative overflow-hidden",
      color === 'brand-red' ? "bg-brand-red border-brand-red text-white" : "bg-[#121212] border-zinc-900 text-white"
    )}>
       <div className={cn(
         "p-2.5 rounded-lg w-fit shadow-sm",
         color === 'brand-red' ? "bg-white/20" : "bg-zinc-950 text-brand-red border border-zinc-900"
       )}>
          <Icon className="w-5 h-5" />
       </div>
       <div>
          <span className={cn("text-[8px] font-black uppercase tracking-widest block mb-1", color === 'brand-red' ? "text-white/60" : "text-zinc-600")}>
            {title}
          </span>
          <p className="text-xl font-black uppercase tracking-tighter leading-none">{value}</p>
          <p className={cn("text-[7px] font-bold uppercase tracking-widest mt-1", color === 'brand-red' ? "text-white/40" : "text-zinc-700")}>
            {sub}
          </p>
       </div>
       
       {color === 'brand-red' && (
         <div className="absolute top-0 right-0 p-4 text-white/5 opacity-10 -rotate-12 translate-x-1/3 -translate-y-1/3">
            <Icon className="w-32 h-32" />
         </div>
       )}
    </div>
  );
}
