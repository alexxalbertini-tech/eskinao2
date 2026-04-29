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
  Wallet, 
  Filter, 
  Calendar,
  X,
  PlusCircle,
  MinusCircle,
  FileText,
  Search,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

export default function Cashier({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    type: 'income',
    amount: 0,
    description: '',
    category: 'Vendas',
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
      setFormData({ type: 'income', amount: 0, description: '', category: 'Vendas', date: new Date().toISOString() });
    } catch (error) {
      console.error("Error saving transaction", error);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || (filterType === 'income' && (t.type === 'income' || t.type === 'sale')) || (filterType === 'expense' && t.type === 'expense');
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'income' || t.type === 'sale') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Fluxo de Caixa</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Controle Financeiro</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setFormData({...formData, type: 'income'}); setModalOpen(true); }}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-5 h-5" />
            Entrada
          </button>
          <button 
            onClick={() => { setFormData({...formData, type: 'expense'}); setModalOpen(true); }}
            className="flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20"
          >
            <MinusCircle className="w-5 h-5" />
            Saída
          </button>
        </div>
      </section>

      {/* Financial Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo Total</p>
            <h2 className="text-3xl font-black text-amber-500 tabular-nums">{formatCurrency(totals.income - totals.expense)}</h2>
         </div>
         <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
            <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Entradas</p>
            <h2 className="text-3xl font-black text-emerald-500 tabular-nums">{formatCurrency(totals.income)}</h2>
         </div>
         <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl">
            <p className="text-rose-500/60 text-[10px] font-bold uppercase tracking-widest mb-1">Total Saídas</p>
            <h2 className="text-3xl font-black text-rose-500 tabular-nums">{formatCurrency(totals.expense)}</h2>
         </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
           <input 
            type="text" 
            placeholder="LANÇAMENTO O CATEGORIA..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest placeholder:text-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
           {['all', 'income', 'expense'].map(type => (
             <button
               key={type}
               onClick={() => setFilterType(type)}
               className={cn(
                 "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 filterType === type 
                   ? "bg-zinc-800 text-amber-500 shadow-xl" 
                   : "text-zinc-500 hover:text-white"
               )}
             >
               {type === 'all' ? 'Tudo' : type === 'income' ? 'Entradas' : 'Saídas'}
             </button>
           ))}
        </div>
      </section>

      {/* Transactions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase font-black tracking-widest text-zinc-500">
                     <th className="px-6 py-5">Lançamento</th>
                     <th className="px-6 py-5">Categoria</th>
                     <th className="px-6 py-5">Data / Hora</th>
                     <th className="px-6 py-5 text-right">Valor</th>
                     <th className="px-6 py-5 text-center">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800/50">
                  {filteredTransactions.map(tx => (
                    <motion.tr 
                      layout
                      key={tx.id} 
                      className="group hover:bg-zinc-800/20 transition-colors"
                    >
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className={cn(
                               "w-10 h-10 rounded-2xl flex items-center justify-center",
                               (tx.type === 'income' || tx.type === 'sale') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                             )}>
                                {(tx.type === 'income' || tx.type === 'sale') ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                             </div>
                             <span className="font-bold text-sm text-zinc-200 uppercase tracking-tight">{tx.description}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-zinc-800 rounded-lg text-[10px] font-black uppercase text-zinc-400 border border-zinc-700">
                             {tx.category}
                          </span>
                       </td>
                       <td className="px-6 py-5 text-xs font-medium text-zinc-500 tabular-nums">
                          {formatDate(tx.date)}
                       </td>
                       <td className={cn(
                         "px-6 py-5 text-right font-black tabular-nums",
                         (tx.type === 'income' || tx.type === 'sale') ? 'text-emerald-500' : 'text-rose-500'
                       )}>
                          {(tx.type === 'income' || tx.type === 'sale') ? '+' : '-'} {formatCurrency(tx.amount)}
                       </td>
                       <td className="px-6 py-5 text-center">
                          <button 
                            onClick={async () => { if(confirm('Excluir?')) await deleteDoc(doc(db, 'caixa', tx.id)) }}
                            className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </td>
                    </motion.tr>
                  ))}
               </tbody>
            </table>
         </div>
         {filteredTransactions.length === 0 && (
           <div className="p-20 text-center flex flex-col items-center gap-4">
              <FileText className="w-12 h-12 text-zinc-800" />
              <p className="text-zinc-600 uppercase text-xs font-black tracking-widest">Nenhum lançamento encontrado</p>
           </div>
         )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl"
             >
                <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                     {formData.type === 'income' ? 'Registrar Entrada' : 'Registrar Saída'}
                   </h2>
                   <button onClick={() => setModalOpen(false)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Valor do Lançamento</label>
                      <div className="relative">
                         <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-500">R$</span>
                         <input 
                           required
                           type="number" step="0.01" autoFocus
                           className={cn(
                             "w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] py-8 pl-20 pr-8 text-4xl font-black focus:ring-4 focus:ring-zinc-800 outline-none tabular-nums",
                             formData.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                           )}
                           value={formData.amount || ''}
                           onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Descrição / Referência</label>
                         <input 
                           required
                           type="text" 
                           placeholder="EX: COMPRA DE GELO"
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold text-sm"
                           value={formData.description}
                           onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                         />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Categoria</label>
                        <select 
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold text-sm appearance-none cursor-pointer"
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="Vendas">Vendas</option>
                          <option value="Fornecedores">Fornecedores</option>
                          <option value="Infraestrutura">Infraestrutura</option>
                          <option value="Funcionários">Funcionários</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Diversos">Diversos</option>
                        </select>
                      </div>
                   </div>

                   <button 
                     type="submit"
                     className={cn(
                       "w-full py-6 rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl transition-all active:scale-[0.98]",
                       formData.type === 'income' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'
                     )}
                   >
                     Confirmar Lançamento
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
