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
    return () => unsubscribe();
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
    <div className="space-y-10 max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Premium */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
            MEU <span className="text-brand-red">CAIXA</span>
          </h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] mt-2">Inteligência Financeira Premium</p>
        </div>
        <div className="bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-800 flex items-center gap-3 self-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Ao vivo</span>
        </div>
      </section>

      {/* Hero Stats Card - Ultra Premium */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-zinc-900 to-black border-2 border-zinc-800 rounded-[4rem] p-12 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
      >
         <div className="absolute top-0 right-0 p-12 text-zinc-800/10 rotate-12">
            <TrendingUp className="w-64 h-64" />
         </div>

         <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em]">Saldo Operacional Disponível</span>
            <h2 className="text-7xl font-black text-white tracking-tighter tabular-nums mb-4 drop-shadow-2xl">
              {formatCurrency(totals.totalBalance)}
            </h2>
            <div className="h-2 w-32 bg-brand-red rounded-full" />
         </div>

         <div className="grid grid-cols-2 gap-8 mt-12 pt-12 border-t border-zinc-800/50">
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entradas Hoje</span>
               </div>
               <p className="text-2xl font-black text-emerald-500">{formatCurrency(totals.todaySales)}</p>
            </div>
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-brand-red" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Saídas Hoje</span>
               </div>
               <p className="text-2xl font-black text-brand-red">{formatCurrency(totals.todayExpenses)}</p>
            </div>
         </div>
      </motion.div>

      {/* Action Area */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <button 
           onClick={() => navigate('/vendas')}
           className="group relative bg-brand-red hover:bg-red-600 text-white p-12 rounded-[3.5rem] font-black uppercase tracking-[0.3em] text-2xl flex items-center justify-center gap-6 transition-all shadow-[0_20px_50px_rgba(220,38,38,0.2)] active:scale-95 border-t border-white/10"
         >
            <div className="bg-white/20 p-4 rounded-3xl transition-transform group-hover:scale-110">
              <Plus className="w-10 h-10" />
            </div>
            PDV VENDAS
         </button>
         
         <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { setFormData({...formData, type: 'income'}); setModalOpen(true); }}
              className="bg-zinc-900 border-2 border-zinc-900 hover:border-emerald-500/30 hover:bg-zinc-800 text-white rounded-[3rem] font-black uppercase tracking-widest text-[11px] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all shadow-xl"
            >
               <div className="bg-emerald-500/10 p-4 rounded-2xl">
                 <ArrowUpRight className="w-8 h-8 text-emerald-500" />
               </div>
               Lançar Entrada
            </button>
            <button 
              onClick={() => { setFormData({...formData, type: 'expense'}); setModalOpen(true); }}
              className="bg-zinc-900 border-2 border-zinc-900 hover:border-brand-red/30 hover:bg-zinc-800 text-white rounded-[3rem] font-black uppercase tracking-widest text-[11px] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all shadow-xl"
            >
               <div className="bg-brand-red/10 p-4 rounded-2xl">
                 <ArrowDownRight className="w-8 h-8 text-brand-red" />
               </div>
               Lançar Saída
            </button>
         </div>
      </section>

      {/* Transactions List */}
      <section className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600">HISTÓRICO FINANCEIRO</h3>
            <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
               {['all', 'income', 'expense'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setFilterType(t)}
                   className={cn(
                     "text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all",
                     filterType === t ? "bg-white text-black shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                   )}
                 >
                   {t === 'all' ? 'Tudo' : t === 'income' ? 'Entradas' : 'Despesas'}
                 </button>
               ))}
            </div>
         </div>

         <div className="space-y-3">
            {filteredTransactions.slice(0, 20).map(tx => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={tx.id}
                className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-all group"
              >
                 <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={cn(
                      "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl",
                      (tx.type === 'income' || tx.type === 'sale') ? "bg-emerald-600/10 text-emerald-500" : "bg-brand-red/10 text-brand-red"
                    )}>
                      {(tx.type === 'income' || tx.type === 'sale') ? <Receipt className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                    </div>
                    <div className="space-y-1">
                       <p className="text-lg font-black text-white uppercase tracking-tighter leading-none">{tx.description}</p>
                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{formatDate(tx.date)} • {tx.category}</p>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between w-full md:w-auto gap-10">
                    <span className={cn(
                      "text-3xl font-black tabular-nums tracking-tighter",
                      (tx.type === 'income' || tx.type === 'sale') ? "text-emerald-500" : "text-brand-red"
                    )}>
                      {(tx.type === 'income' || tx.type === 'sale') ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                    <button 
                      onClick={async () => { if(confirm('Remover este lançamento permanentemente?')) await deleteDoc(doc(db, 'caixa', tx.id)) }}
                      className="p-4 bg-zinc-900 rounded-2xl text-zinc-700 hover:text-white hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100"
                    >
                       <X className="w-5 h-5" />
                    </button>
                 </div>
              </motion.div>
            ))}
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
