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
    <div className="space-y-12 max-w-7xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Premium AI */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="text-center md:text-left">
          <h1 className="text-6xl font-black uppercase tracking-tighter text-white leading-none">
            CENTRO DE <span className="text-brand-red">COMANDO</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-4">GESTÃO FINANCEIRA EM TEMPO REAL ESKINÃO</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900/50 px-8 py-4 rounded-full border-2 border-zinc-900 flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[11px] font-black text-white uppercase tracking-widest leading-none">SISTEMA ONLINE</span>
          </div>
        </div>
      </section>

      {/* Grid de KPIs - Ultra Moderno */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="lg:col-span-8 relative bg-black border-2 border-zinc-900 rounded-[4rem] p-12 overflow-hidden shadow-2xl group"
         >
            <div className="absolute top-0 right-0 p-16 text-zinc-900/40 rotate-12 group-hover:scale-110 transition-transform duration-700">
               <TrendingUp className="w-80 h-80" />
            </div>

            <div className="relative z-10 space-y-4">
               <span className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.4em]">PATRIMÔNIO EM CAIXA</span>
               <h2 className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl mb-8">
                 {formatCurrency(totals.totalBalance)}
               </h2>
               <div className="flex items-center gap-4">
                  <div className="h-3 w-40 bg-brand-red rounded-full shadow-[0_0_20px_rgba(255,0,0,0.4)]" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saldo Atualizado</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 pt-12 border-t border-zinc-900/50 relative z-10">
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Entradas Hoje</span>
                  <p className="text-4xl font-black text-emerald-500 tracking-tight">{formatCurrency(totals.todaySales)}</p>
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Saídas Hoje</span>
                  <p className="text-4xl font-black text-brand-red tracking-tight">{formatCurrency(totals.todayExpenses)}</p>
               </div>
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Aluguéis Ativos</span>
                  <div className="flex items-center gap-4">
                    <p className="text-4xl font-black text-white tracking-tight">{activeRentals}</p>
                    <span className="bg-zinc-900 px-3 py-1 rounded-full text-[9px] font-black text-zinc-500">CONTRATOS</span>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Botões de Ação Direta */}
         <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            <button 
              onClick={() => navigate('/vendas')}
              className="group relative bg-brand-red hover:bg-red-600 text-white p-12 rounded-[3.5rem] flex flex-col items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 overflow-hidden border-t border-white/10"
            >
               <div className="bg-white/20 p-6 rounded-[2rem] group-hover:rotate-12 transition-transform">
                 <Plus className="w-12 h-12" />
               </div>
               <span className="font-black uppercase tracking-[0.3em] text-3xl">NOVA VENDA</span>
            </button>
            <div className="grid grid-cols-2 gap-6">
               <button 
                  onClick={() => { setFormData({...formData, type: 'income'}); setModalOpen(true); }}
                  className="bg-zinc-900 border-2 border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-800/50 text-white rounded-[3.5rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-95 p-8 shadow-xl"
               >
                  <ArrowUpRight className="w-8 h-8 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">ENTRADA</span>
               </button>
               <button 
                  onClick={() => { setFormData({...formData, type: 'expense'}); setModalOpen(true); }}
                  className="bg-zinc-900 border-2 border-zinc-800 hover:border-brand-red/40 hover:bg-zinc-800/50 text-white rounded-[3.5rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-95 p-8 shadow-xl"
               >
                  <ArrowDownRight className="w-8 h-8 text-brand-red" />
                  <span className="text-[10px] font-black uppercase tracking-widest">SAÍDA</span>
               </button>
            </div>
         </div>
      </section>

      {/* Histórico Financeiro VIP */}
      <section className="space-y-10">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
            <div>
               <h3 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-600 mb-2">FLUXO DE CAIXA</h3>
               <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Últimas 20 movimentações do sistema</p>
            </div>
            <div className="flex bg-zinc-900/50 p-2 rounded-full border-2 border-zinc-900 shadow-xl overflow-x-auto">
               {['all', 'income', 'expense'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={cn(
                     "whitespace-nowrap text-[9px] font-black uppercase tracking-widest px-10 py-4 rounded-full transition-all",
                     filterType === t ? "bg-white text-black shadow-2xl" : "text-zinc-600 hover:text-zinc-400"
                   )}
                 >
                   {t === 'all' ? 'VER TUDO' : t === 'income' ? 'ENTRADAS' : 'DESPESAS'}
                 </button>
               ))}
            </div>
         </div>

         <div className="space-y-4">
            <AnimatePresence mode="popLayout">
               {filteredTransactions.slice(0, 20).map(tx => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={tx.id}
                   className="bg-black border-2 border-zinc-900 hover:border-zinc-800 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all group shadow-lg"
                 >
                    <div className="flex items-center gap-8 w-full md:w-auto">
                       <div className={cn(
                         "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl transition-all group-hover:scale-110",
                         (tx.type === 'income' || tx.type === 'sale') ? "bg-emerald-500/10 text-emerald-500" : "bg-brand-red/10 text-brand-red"
                       )}>
                         {(tx.type === 'income' || tx.type === 'sale') ? <TrendingUp className="w-10 h-10" /> : <ArrowDownRight className="w-10 h-10" />}
                       </div>
                       <div className="space-y-1">
                          <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">{tx.description}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{formatDate(tx.date)}</span>
                             <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{tx.category || 'LANÇAMENTO'}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto gap-12">
                       <span className={cn(
                         "text-4xl font-black tabular-nums tracking-tighter",
                         (tx.type === 'income' || tx.type === 'sale') ? "text-emerald-500" : "text-brand-red"
                       )}>
                         {(tx.type === 'income' || tx.type === 'sale') ? '+' : '-'} {formatCurrency(tx.amount)}
                       </span>
                       <button 
                         onClick={async () => { if(confirm('Remover permanentemente?')) await deleteDoc(doc(db, 'caixa', tx.id)) }}
                         className="p-5 bg-zinc-900 rounded-[1.5rem] text-zinc-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                       >
                          <X className="w-6 h-6" />
                       </button>
                    </div>
                 </motion.div>
               ))}
            </AnimatePresence>
            
            {filteredTransactions.length === 0 && (
               <div className="py-20 text-center space-y-4 opacity-20">
                  <Receipt className="w-20 h-20 mx-auto" />
                  <p className="font-black uppercase tracking-[0.5em] text-xs">Sem movimentações</p>
               </div>
            )}
         </div>
      </section>

      {/* Fixed Plus Button for convenience on mobile */}
      <button 
        onClick={() => setModalOpen(true)}
        className="md:hidden fixed bottom-10 right-6 w-20 h-20 bg-brand-red text-white rounded-full flex items-center justify-center shadow-2xl z-50 animate-bounce"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Modal - Estilo iPad/Premium */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               className="relative w-full max-w-xl bg-zinc-950 border-t md:border border-zinc-900 rounded-t-[4rem] md:rounded-[4rem] p-10 pb-16 overflow-y-auto max-h-[96vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
             >
                <div className="flex items-center justify-between mb-12">
                   <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                     NOVO <span className={formData.type === 'income' ? 'text-emerald-500' : 'text-brand-red'}>LANCAMENTO</span>
                   </h2>
                   <button onClick={()=>setModalOpen(false)} className="p-5 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white border border-zinc-800 transition-all active:scale-90"><X className="w-8 h-8" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                   <div className="flex bg-zinc-900/50 p-2 rounded-[2rem] border border-zinc-800">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'income'})}
                        className={cn(
                          "flex-1 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all",
                          formData.type === 'income' ? "bg-emerald-500 text-white shadow-xl" : "text-zinc-600"
                        )}
                      >
                         ENTRADA (RECEITA)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'expense'})}
                        className={cn(
                          "flex-1 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all",
                          formData.type === 'expense' ? "bg-brand-red text-white shadow-xl" : "text-zinc-600"
                        )}
                      >
                         SAÍDA (DESPESA)
                      </button>
                   </div>

                   <div className="space-y-4">
                      <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] block text-center">QUAL O VALOR?</span>
                      <div className="relative">
                         <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-zinc-700">R$</span>
                         <input 
                           required type="number" step="0.01" autoFocus
                           className={cn(
                             "w-full bg-zinc-900/50 border-2 border-zinc-900 rounded-[3rem] py-12 pl-24 pr-10 text-6xl font-black focus:outline-none transition-all tabular-nums text-center",
                             formData.type === 'income' ? 'text-emerald-500 focus:border-emerald-500/30' : 'text-brand-red focus:border-brand-red/30'
                           )}
                           value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                       <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2">DESCRIÇÃO</span>
                       <input 
                         required type="text" placeholder="EX: COMPRA DE EMBALAGENS"
                         className="w-full bg-zinc-900 border-2 border-zinc-900 rounded-[2rem] p-8 text-white uppercase font-black text-xl focus:border-white/10 outline-none transition-all"
                         value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                       />
                   </div>

                   <button 
                     type="submit"
                     className={cn(
                       "w-full py-10 rounded-[3rem] font-black uppercase tracking-[0.4em] text-2xl shadow-2xl transition-all active:scale-[0.97] mt-8 border-t border-white/10",
                       formData.type === 'income' ? 'bg-emerald-600 text-white shadow-emerald-500/40' : 'bg-brand-red text-white shadow-red-600/40'
                     )}
                   >
                     REGISTRAR AGORA
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
