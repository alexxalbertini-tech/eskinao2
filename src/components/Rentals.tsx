import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db, 
  auth, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc 
} from '../lib/firebase';
import { 
  Plus, 
  Calendar, 
  User, 
  Phone, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Trash2, 
  ChevronRight,
  MessageCircle,
  FileText,
  Search,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { generateQuotePDF } from '../services/pdfService';

export default function Rentals({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    item: 'Mesas (Jogo)',
    quantity: 1,
    total: 0,
    deposit: 0,
    deliveryDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'pending',
    observations: ''
  });

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'usuarios', businessId, 'alugueis'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRentals(data);
      setLoading(false);
    }, (err) => {
      console.error("Erro no onSnapshot de alugueis:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Usuário não autenticado.");
      return;
    }
    if (!businessId) {
      alert("ID da empresa não encontrado.");
      return;
    }

    try {
      await addDoc(collection(db, 'usuarios', businessId, 'alugueis'), {
        ...formData,
        clientName: formData.clientName.trim().toUpperCase(),
        clientPhone: formData.clientPhone.trim(),
        observations: formData.observations.trim().toUpperCase(),
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar aluguel:", err);
      alert("Erro ao salvar aluguel no banco.");
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientPhone: '',
      item: 'Mesas (Jogo)',
      quantity: 1,
      total: 0,
      deposit: 0,
      deliveryDate: new Date().toISOString().split('T')[0],
      returnDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'pending',
      observations: ''
    });
  };

  const toggleStatus = async (rental: any) => {
    if (!businessId) return;
    const newStatus = rental.status === 'pending' ? 'returned' : 'pending';
    try {
      await updateDoc(doc(db, 'usuarios', businessId, 'alugueis', rental.id), { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const items = [
    'Mesa (Jogo)', 'Cadeira (Unid)', 'Cooler Profissional', 'Caixa Térmica G', 'Tamubor / Tina', 'Chopeira', 'Tenda 3x3', 'Outros'
  ];

  const getStatusColor = (rental: any) => {
    if (rental.status === 'returned') return 'emerald';
    const isLate = new Date(rental.returnDate) < new Date() && rental.status === 'pending';
    if (isLate) return 'rose';
    return 'amber';
  };

  const filteredRentals = rentals.filter(r => {
    const matchesSearch = r.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime());

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-24 font-sans">
      <section className="flex flex-col gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            CONTROLE DE <span className="text-brand-red">LOCAÇÃO</span>
          </h1>
          <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.4em] mt-1">GESTÃO DE ATIVOS E EVENTOS</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="w-full bg-brand-red text-white p-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-[0.98] border-t border-white/10 flex items-center justify-center gap-3"
        >
          <Plus className="w-4 h-4" />
          NOVO ALUGUEL
        </button>
      </section>

      {/* Stats Summary Optimized */}
      <section className="grid grid-cols-3 gap-3">
         <div className="bg-[#121212] border border-zinc-900 p-3 rounded-xl">
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest block mb-1">ATIVOS</span>
            <p className="text-xl font-black text-white tracking-tighter leading-none">{rentals.filter(r => r.status === 'pending').length}</p>
         </div>
         <div className="bg-[#121212] border border-zinc-900 p-3 rounded-xl">
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest block mb-1">HOJE</span>
            <p className="text-xl font-black text-brand-red tracking-tighter leading-none">
               {rentals.filter(r => r.status === 'pending' && r.returnDate === new Date().toISOString().split('T')[0]).length}
            </p>
         </div>
         <div className="bg-[#121212] border border-zinc-900 p-3 rounded-xl">
            <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest block mb-1">ATRASO</span>
            <p className="text-xl font-black text-rose-500 tracking-tighter leading-none">
               {rentals.filter(r => r.status === 'pending' && new Date(r.returnDate) < new Date()).length}
            </p>
         </div>
      </section>

      {/* Filters Optimized */}
      <section className="flex flex-col gap-4">
        <div className="relative w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 w-4 h-4" />
           <input 
            type="text" 
            placeholder="PESQUISAR CLIENTE OU ITEM..."
            className="w-full bg-[#121212] border border-zinc-900 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-brand-red/30 uppercase text-[9px] font-black tracking-widest placeholder:text-zinc-800 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
           {['all', 'pending', 'returned'].map(status => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={cn(
                 "px-5 py-2.5 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                 filterStatus === status 
                   ? "bg-brand-red/10 border-brand-red/20 text-brand-red" 
                   : "bg-[#121212] border-zinc-900 text-zinc-600 hover:border-zinc-800"
               )}
             >
               {status === 'all' ? 'TUDO' : status === 'pending' ? 'PENDENTES' : 'DEVOLVIDOS'}
             </button>
           ))}
        </div>
      </section>

      {/* Rentals Grid Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRentals.map(rental => {
            const statusColor = getStatusColor(rental);
            const isLate = new Date(rental.returnDate) < new Date() && rental.status === 'pending';
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={rental.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all overflow-hidden relative shadow-md",
                  rental.status === 'returned' 
                    ? "bg-zinc-950/20 border-zinc-900 opacity-60" 
                    : isLate 
                      ? "bg-zinc-900 border-rose-500/20 shadow-rose-900/10" 
                      : "bg-[#121212] border-zinc-900"
                )}
              >
                 {isLate && (
                   <div className="absolute top-0 left-0 w-full bg-rose-600 py-1 text-center">
                      <span className="text-[7px] font-black uppercase tracking-widest text-white">ATRASO</span>
                   </div>
                 )}

                 <div className={cn("flex flex-col gap-4", isLate && "mt-2")}>
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-800",
                            rental.status === 'returned' ? "bg-zinc-950 text-zinc-800" : "bg-brand-red/10 text-brand-red"
                          )}>
                             <Calendar className="w-5 h-5" />
                          </div>
                          <div className="max-w-[140px]">
                             <h3 className="font-black text-sm uppercase tracking-tight text-white truncate leading-none mb-1">{rental.clientName}</h3>
                             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest truncate">{rental.clientPhone}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-white tabular-nums tracking-tighter leading-none mb-1">{formatCurrency(rental.total)}</p>
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                            rental.status === 'returned' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                          )}>
                            {rental.status === 'returned' ? 'DELIV' : isLate ? 'ATRASO' : 'ATIVO'}
                          </span>
                       </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 border border-zinc-900/50 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">ITENS</span>
                          <p className="text-[10px] font-black text-zinc-400 uppercase">{rental.quantity}x {rental.item}</p>
                       </div>
                       <div className="flex justify-between items-center border-t border-zinc-900 pt-2">
                          <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">DEVOLUÇÃO</span>
                          <p className={cn(
                            "text-[10px] font-black uppercase",
                            isLate ? "text-rose-500" : "text-brand-red"
                          )}>{new Date(rental.returnDate).toLocaleDateString()}</p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                       <div className="flex gap-2">
                          <button 
                           onClick={() => { window.open(`https://wa.me/55${rental.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                           className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-lg active:scale-95 transition-all"
                          >
                             <MessageCircle className="w-4 h-4" />
                          </button>
                          <button 
                           onClick={() => generateQuotePDF({
                             clientName: rental.clientName,
                             items: [{ name: rental.item, quantity: rental.quantity, price: rental.total / rental.quantity }],
                             total: rental.total,
                             type: 'rental',
                             date: rental.deliveryDate
                           })}
                           className="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded-lg active:scale-95 transition-all"
                          >
                             <FileText className="w-4 h-4" />
                          </button>
                       </div>

                       <button 
                         onClick={() => toggleStatus(rental)}
                         className={cn(
                           "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                           rental.status === 'returned' 
                             ? "bg-zinc-900 text-zinc-700 border border-zinc-800" 
                             : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:scale-95"
                         )}
                       >
                          {rental.status === 'returned' ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          {rental.status === 'returned' ? 'REABRIR' : 'FINALIZAR'}
                       </button>
                    </div>
                 </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal - Optimized */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               className="relative w-full max-w-lg bg-[#0f0f0f] border-t md:border border-zinc-900 rounded-t-3xl md:rounded-2xl p-6 pb-12 shadow-2xl max-h-[92vh] overflow-y-auto"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-white">NOVA <span className="text-brand-red">LOCAÇÃO</span></h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 text-zinc-500 bg-zinc-900 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Cliente</label>
                         <input required type="text" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white focus:border-brand-red/30 outline-none uppercase font-black text-xs" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Telefone</label>
                         <input required type="tel" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white focus:border-brand-red/30 outline-none font-black text-xs" placeholder="21999999999" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3 space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Item</label>
                         <select className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white appearance-none uppercase font-black text-xs" value={formData.item} onChange={e=>setFormData({...formData, item: e.target.value})}>
                            {items.map(i => <option key={i} value={i} className="bg-zinc-950">{i.toUpperCase()}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">QTD</label>
                         <input type="number" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white font-black text-xs" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Total (R$)</label>
                         <input type="number" step="0.01" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white font-black text-sm text-brand-red" value={formData.total} onChange={e=>setFormData({...formData, total: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Caução (R$)</label>
                         <input type="number" step="0.01" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white font-black text-sm text-emerald-500" value={formData.deposit} onChange={e=>setFormData({...formData, deposit: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Retirada</label>
                         <input type="date" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white font-black text-[10px]" value={formData.deliveryDate} onChange={e=>setFormData({...formData, deliveryDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Devolução</label>
                         <input type="date" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white font-black text-[10px] text-rose-500" value={formData.returnDate} onChange={e=>setFormData({...formData, returnDate: e.target.value})} />
                      </div>
                   </div>

                   <button type="submit" className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all mt-6 border-t border-white/10">FINALIZAR CADASTRO</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
