import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db, 
  auth, 
  addDoc, 
  orderBy,
  deleteDoc,
  doc
} from '../lib/firebase';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  X,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function Cashier({ businessId }: { role?: string | null, businessId?: string | null }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: 0,
    description: '',
    category: 'Outros',
    date: new Date().toISOString()
  });

  const [activeRentals, setActiveRentals] = useState(0);

  useEffect(() => {
    if (!businessId) return;
    const q = query(
      collection(db, 'caixa'), 
      where('userId', '==', businessId),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });

    const rentalsQ = query(
      collection(db, 'alugueis'), 
      where('userId', '==', businessId),
      where('status', '==', 'pending')
    );
    const unsubscribeRentals = onSnapshot(rentalsQ, snapshot => {
      setActiveRentals(snapshot.size);
    });

    return () => {
      unsubscribe();
      unsubscribeRentals();
    };
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    
    try {
      await addDoc(collection(db, 'caixa'), {
        ...formData,
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        date: new Date().toISOString()
      });
      setModalOpen(false);
      setFormData({ type: 'income', amount: 0, description: '', category: 'Outros', date: new Date().toISOString() });
    } catch (error) {
      console.error("Erro ao salvar lançamento:", error);
    }
  };

  const totals = transactions.reduce((acc, t) => {
    const isToday = new Date(t.date).toDateString() === new Date().toDateString();
    
    if (t.type === 'income' || t.type === 'sale') {
      acc.totalBalance += t.amount;
      if (isToday) acc.todaySales += t.amount;
    } else {
      acc.totalBalance -= t.amount;
      if (isToday) acc.todayExpenses += t.amount;
    }
    return acc;
  }, { totalBalance: 0, todaySales: 0, todayExpenses: 0 });

  const filteredTransactions = transactions.filter(t => {
    return filterType === 'all' || 
           (filterType === 'income' && (t.type === 'income' || t.type === 'sale')) || 
           (filterType === 'expense' && t.type === 'expense');
  });
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Optimized */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            CENTRO DE <span className="text-brand-red">COMANDO</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-2">GESTÃO FINANCEIRA ESKINÃO</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">ONLINE</span>
          </div>
        </div>
      </section>

      {/* Grid de KPIs - Optimized */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="lg:col-span-8 relative bg-[#121212] border border-zinc-900 rounded-2xl p-6 md:p-8 overflow-hidden shadow-xl group"
         >
            <div className="absolute top-0 right-0 p-8 text-zinc-900/20 rotate-12 transition-transform duration-700">
               <TrendingUp className="w-40 h-40" />
            </div>

            <div className="relative z-10 space-y-2">
               <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">PATRIMÔNIO EM CAIXA</span>
               <h2 className="text-5xl font-black text-white tracking-tighter tabular-nums mb-4">
                 {formatCurrency(totals.totalBalance)}
               </h2>
               <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 bg-brand-red rounded-full" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Saldo Atualizado</span>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-900/50 relative z-10 text-center md:text-left">
               <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Entradas</span>
                  <p className="text-lg font-black text-emerald-500">{formatCurrency(totals.todaySales)}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Saídas</span>
                  <p className="text-lg font-black text-brand-red">{formatCurrency(totals.todayExpenses)}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Pendentes</span>
                  <p className="text-lg font-black text-white">{activeRentals}</p>
               </div>
            </div>
         </motion.div>

         {/* Botões de Ação Direta */}
         <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <button 
              onClick={() => navigate('/vendas')}
              className="group relative bg-brand-red hover:bg-red-600 text-white p-6 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-lg active:scale-95"
            >
               <div className="bg-white/10 p-3 rounded-xl">
                 <Plus className="w-6 h-6" />
               </div>
               <span className="font-black uppercase tracking-[0.2em] text-lg">NOVA VENDA</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => { setFormData({...formData, type: 'income'}); setModalOpen(true); }}
                  className="bg-[#121212] border border-zinc-800 hover:border-emerald-500/40 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 p-4 shadow-lg"
               >
                  <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest">ENTRADA</span>
               </button>
               <button 
                  onClick={() => { setFormData({...formData, type: 'expense'}); setModalOpen(true); }}
                  className="bg-[#121212] border border-zinc-800 hover:border-brand-red/40 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 p-4 shadow-lg"
               >
                  <ArrowDownRight className="w-6 h-6 text-brand-red" />
                  <span className="text-[9px] font-black uppercase tracking-widest">SAÍDA</span>
               </button>
            </div>
         </div>
      </section>

      {/* Histórico Financeiro VIP */}
      <section className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div>
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">FLUXO DE CAIXA</h3>
            </div>
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 overflow-x-auto scrollbar-hide">
               {['all', 'income', 'expense'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={cn(
                     "whitespace-nowrap text-[8px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all",
                     filterType === t ? "bg-white text-black shadow-lg" : "text-zinc-600"
                   )}
                 >
                   {t === 'all' ? 'TUDO' : t === 'income' ? 'ENTRADAS' : 'DESPESAS'}
                 </button>
               ))}
            </div>
         </div>

         <div className="space-y-3">
            <AnimatePresence mode="popLayout">
               {filteredTransactions.slice(0, 20).map(tx => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={tx.id}
                   className="bg-[#0c0c0c] border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 md:p-6 flex items-center justify-between gap-4 transition-all group"
                 >
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                         (tx.type === 'income' || tx.type === 'sale') ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-red/10 text-brand-red"
                       )}>
                         {(tx.type === 'income' || tx.type === 'sale') ? <TrendingUp className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{tx.description}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-zinc-600 uppercase">{formatDate(tx.date)}</span>
                             <span className="w-0.5 h-0.5 bg-zinc-800 rounded-full" />
                             <span className="text-[8px] font-black text-white/30 uppercase">{tx.category || 'GERAL'}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <span className={cn(
                         "text-lg font-black tabular-nums tracking-tighter whitespace-nowrap",
                         (tx.type === 'income' || tx.type === 'sale') ? "text-emerald-500" : "text-brand-red"
                       )}>
                         {(tx.type === 'income' || tx.type === 'sale') ? '+' : '-'} {formatCurrency(tx.amount)}
                       </span>
                       <button 
                         onClick={async () => { if(confirm('Remover?')) await deleteDoc(doc(db, 'caixa', tx.id)) }}
                         className="p-3 bg-zinc-900 rounded-lg text-zinc-700 hover:text-rose-500 transition-all md:opacity-0 group-hover:opacity-100"
                       >
                          <X className="w-4 h-4" />
                       </button>
                    </div>
                 </motion.div>
               ))}
            </AnimatePresence>
         </div>
      </section>

      {/* Fixed Plus Button for convenience on mobile */}
      <button 
        onClick={() => setModalOpen(true)}
        className="md:hidden fixed bottom-10 right-6 w-16 h-16 bg-brand-red text-white rounded-full flex items-center justify-center shadow-2xl z-50 shadow-red-600/40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal Optimized */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               className="relative w-full max-w-md bg-[#0f0f0f] border-t md:border border-zinc-900 rounded-t-3xl md:rounded-3xl p-6 pb-12 overflow-y-auto max-h-[90vh] shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                     NOVO <span className={formData.type === 'income' ? 'text-emerald-500' : 'text-brand-red'}>LANCAMENTO</span>
                   </h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 bg-zinc-900 rounded-lg text-zinc-500 border border-zinc-800 transition-all"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'income'})}
                        className={cn(
                          "flex-1 py-3 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all",
                          formData.type === 'income' ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-600"
                        )}
                      >
                         ENTRADA
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'expense'})}
                        className={cn(
                          "flex-1 py-3 rounded-lg font-black uppercase tracking-widest text-[9px] transition-all",
                          formData.type === 'expense' ? "bg-brand-red text-white shadow-lg" : "text-zinc-600"
                        )}
                      >
                         SAÍDA
                      </button>
                   </div>

                   <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] block text-center">VALOR</span>
                      <div className="relative">
                         <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">R$</span>
                         <input 
                           required type="number" step="0.01" autoFocus
                           className={cn(
                             "w-full bg-[#121212] border border-zinc-800 rounded-xl py-6 pl-16 pr-6 text-4xl font-black focus:outline-none transition-all tabular-nums text-center",
                             formData.type === 'income' ? 'text-emerald-500 focus:border-emerald-500/30' : 'text-brand-red focus:border-brand-red/30'
                           )}
                           value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div className="space-y-1">
                       <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2">DESCRIÇÃO</span>
                       <input 
                         required type="text" placeholder="DESCRIÇÃO RÁPIDA..."
                         className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-4 text-white uppercase font-black text-sm focus:border-white/10 outline-none transition-all"
                         value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                       />
                   </div>

                   <button 
                     type="submit"
                     className={cn(
                       "w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-[0.98] mt-4 border-t border-white/5",
                       formData.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-brand-red text-white'
                     )}
                   >
                     REGISTRAR
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
