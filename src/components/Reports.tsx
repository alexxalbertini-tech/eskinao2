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
  TrendingUp as ProfitIcon,
  Package,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function Reports({ role, businessId }: { role?: string | null, businessId?: string | null }) {
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

  // Aggregations
  const salesByCategory = data.products.reduce((acc: any, p: any) => {
    const existing = acc.find((a: any) => a.name === p.category);
    if (existing) existing.value += 1;
    else acc.push({ name: p.category, value: 1 });
    return acc;
  }, []);

  const totalSales = data.transactions.filter(t => t.type === 'sale' || t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = data.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalProfit = totalSales - totalExpenses;

  const lowStockCount = data.products.filter(p => p.quantity <= (p.alertThreshold || 5)).length;

  const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'];

  return (
    <div className="space-y-8 pb-12">
      <section>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Relatórios</h1>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Análise de Performance</p>
      </section>

      {/* High Level Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <ReportCard title="Faturamento Total" value={formatCurrency(totalSales)} icon={TrendingUp} color="emerald" />
         <ReportCard title="Despesas Totais" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="rose" />
         <ReportCard title="Lucro Líquido" value={formatCurrency(totalProfit)} icon={ProfitIcon} color="amber" />
         <ReportCard title="Estoque Crítico" value={lowStockCount} icon={AlertCircle} color={lowStockCount > 0 ? "rose" : "zinc"} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Categories Chart */}
         <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Variedade por Categoria</h3>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      paddingAngle={5}
                      innerRadius={80}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {salesByCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ background: '#09090b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                       itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Stock Distribution */}
         <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl">
            <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em] mb-8">Maiores Estoques</h3>
            <div className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.products.sort((a,b) => b.quantity - a.quantity).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#4b5563', fontSize: 10}} 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: '#1f2937'}}
                      contentStyle={{ background: '#09090b', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    zinc: 'text-zinc-500 bg-zinc-900 border-zinc-800',
  };

  return (
    <div className={cn("p-6 rounded-[2rem] border shadow-xl flex flex-col gap-4", colors[color])}>
       <div className="p-3 bg-black/40 rounded-xl w-fit">
          <Icon className="w-5 h-5" />
       </div>
       <div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</span>
          <p className="text-2xl font-black uppercase tracking-tighter">{value}</p>
       </div>
    </div>
  );
}
