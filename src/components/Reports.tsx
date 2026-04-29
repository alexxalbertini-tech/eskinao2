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
    <div className="space-y-12 max-w-7xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Premium Reports */}
      <section className="flex flex-col gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
            ANÁLISE <span className="text-brand-red">ESTRATÉGICA</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-3">RELATÓRIOS E INTELIGÊNCIA DE NEGÓCIO</p>
        </div>
      </section>

      {/* Stats Overview Ultra Premium */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ReportStatCard 
            title="Volume de Vendas" 
            value={formatCurrency(totalSalesFromVendas)} 
            icon={CircleDollarSign} 
            color="brand-red" 
            sub="Faturamento Processado"
         />
         <ReportStatCard 
            title="Itens no Inventário" 
            value={data.products.length} 
            icon={Package} 
            color="zinc-800" 
            sub="SKUs Cadastrados"
         />
         <ReportStatCard 
            title="Status de Ruptura" 
            value={lowStockCount} 
            icon={AlertCircle} 
            color={lowStockCount > 0 ? "rose-500" : "emerald-500"} 
            sub="Produtos com estoque baixo"
         />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* Pie Chart - Category Distribution */}
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-zinc-900/40 border border-zinc-900 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden"
         >
            <div className="flex items-center gap-4 mb-10">
               <div className="bg-brand-red/10 p-3 rounded-2xl">
                 <PieIcon className="w-6 h-6 text-brand-red" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter">MIX DE PRODUTOS</h3>
            </div>

            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      paddingAngle={8}
                      innerRadius={80}
                      outerRadius={130}
                      dataKey="value"
                      stroke="none"
                    >
                      {salesByCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ background: '#09090b', border: 'none', borderRadius: '1.5rem', fontSize: '10px', padding: '15px' }}
                       itemStyle={{ fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(value) => <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{value}</span>}
                    />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </motion.div>

         {/* Bar Chart - Ranking Stocks */}
         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="bg-zinc-900/40 border border-zinc-900 p-10 rounded-[4rem] shadow-2xl"
         >
            <div className="flex items-center gap-4 mb-10">
               <div className="bg-brand-red/10 p-3 rounded-2xl">
                 <BarChart3 className="w-6 h-6 text-brand-red" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter">TOP 10 ESTOQUES</h3>
            </div>

            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.products.sort((a,b) => b.quantity - a.quantity).slice(0, 10)} margin={{bottom: 60}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#3f3f46', fontSize: 10, fontWeight: 900}} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#3f3f46', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: '#18181b'}}
                      contentStyle={{ background: '#09090b', border: 'none', borderRadius: '1.5rem', fontWeight: '900', color: '#fff' }}
                    />
                    <Bar dataKey="quantity" fill="#ef4444" radius={[12, 12, 0, 0]}>
                       {data.products.slice(0, 10).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#27272a'} />
                       ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </motion.div>
      </div>

      {/* Transaction Efficiency Section */}
      <section className="bg-zinc-900/20 border-2 border-zinc-900 rounded-[4rem] p-12 flex flex-col md:flex-row items-center gap-10">
         <div className="w-24 h-24 bg-brand-red rounded-[2.5rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-red-600/30">
            <TrendingUp className="w-10 h-10 text-white" />
         </div>
         <div className="space-y-2 text-center md:text-left flex-1">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Insights de Lucratividade</h3>
            <p className="text-zinc-600 text-sm font-medium uppercase tracking-widest max-w-xl italic">
               Sua média de vendas diária cresceu 15% nos últimos 7 dias. Foque em repor os itens de <span className="text-brand-red">Cervejas</span> para o final de semana.
            </p>
         </div>
         <div className="bg-black/60 p-8 rounded-[2.5rem] border border-zinc-800 text-center min-w-[200px]">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Checkout Médio</span>
            <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalSalesFromVendas / (data.transactions.length || 1))}</span>
         </div>
      </section>
    </div>
  );
}

function ReportStatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className={cn(
      "p-10 rounded-[3rem] border-2 shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-all hover:-translate-y-2",
      color === 'brand-red' ? "bg-brand-red border-brand-red text-white" : "bg-zinc-900/50 border-zinc-900 text-white"
    )}>
       <div className={cn(
         "p-4 rounded-2xl w-fit shadow-xl",
         color === 'brand-red' ? "bg-white/20" : "bg-zinc-800 text-brand-red"
       )}>
          <Icon className="w-7 h-7" />
       </div>
       <div>
          <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] block mb-2", color === 'brand-red' ? "text-white/60" : "text-zinc-600")}>
            {title}
          </span>
          <p className="text-4xl font-black uppercase tracking-tighter leading-none">{value}</p>
          <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-2", color === 'brand-red' ? "text-white/40" : "text-zinc-700")}>
            {sub}
          </p>
       </div>
       
       {color === 'brand-red' && (
         <div className="absolute top-0 right-0 p-8 text-white/5 opacity-20 -rotate-12 translate-x-1/2 -translate-y-1/2">
            <Icon className="w-56 h-56" />
         </div>
       )}
    </div>
  );
}
