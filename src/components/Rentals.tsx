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
    const q = query(collection(db, 'alugueis'), where('userId', '==', businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRentals(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      await addDoc(collection(db, 'alugueis'), {
        ...formData,
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving rental", error);
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
    const newStatus = rental.status === 'pending' ? 'returned' : 'pending';
    await updateDoc(doc(db, 'alugueis', rental.id), { status: newStatus });
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
    <div className="space-y-10 max-w-7xl mx-auto px-4 pb-24 font-sans">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
            CONTROLE DE <span className="text-brand-red">LOCAÇÃO</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] mt-3">GESTÃO DE ATIVOS E EVENTOS</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="bg-brand-red hover:bg-red-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-red-600/20 active:scale-95 flex items-center gap-4"
        >
          <Plus className="w-6 h-6" />
          NOVO ALUGUEL
        </button>
      </section>

      {/* Stats Summary Premium */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
         <div className="bg-zinc-900 border-2 border-zinc-900 p-8 rounded-[2.5rem] shadow-xl">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block mb-2">ALUGUÉIS ATIVOS</span>
            <p className="text-4xl font-black text-white tracking-tighter">{rentals.filter(r => r.status === 'pending').length}</p>
         </div>
         <div className="bg-zinc-900 border-2 border-zinc-900 p-8 rounded-[2.5rem] shadow-xl">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block mb-2">RETORNOS HOJE</span>
            <p className="text-4xl font-black text-brand-red tracking-tighter">
               {rentals.filter(r => r.status === 'pending' && r.returnDate === new Date().toISOString().split('T')[0]).length}
            </p>
         </div>
         <div className="bg-zinc-900 border-2 border-zinc-900 p-8 rounded-[2.5rem] shadow-xl">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest block mb-2">EM ATRASO</span>
            <p className="text-4xl font-black text-rose-500 tracking-tighter">
               {rentals.filter(r => r.status === 'pending' && new Date(r.returnDate) < new Date()).length}
            </p>
         </div>
      </section>

      {/* Filters Premium */}
      <section className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full group">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-6 h-6 group-focus-within:text-brand-red transition-colors" />
           <input 
            type="text" 
            placeholder="PESQUISAR CLIENTE OU ITEM..."
            className="w-full bg-zinc-900 border-2 border-zinc-900 rounded-[2rem] py-6 pl-16 pr-6 text-white focus:outline-none focus:border-brand-red/30 uppercase text-xs font-black tracking-widest placeholder:text-zinc-800 transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex bg-zinc-900/50 p-2 rounded-[2rem] border-2 border-zinc-900 w-full md:w-auto shadow-xl">
           {['all', 'pending', 'returned'].map(status => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={cn(
                 "flex-1 md:flex-none px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                 filterStatus === status 
                   ? "bg-brand-red text-white shadow-lg" 
                   : "text-zinc-600 hover:text-white"
               )}
             >
               {status === 'all' ? 'TUDO' : status === 'pending' ? 'PENDENTES' : 'DEVOLVIDOS'}
             </button>
           ))}
        </div>
      </section>

      {/* Rentals Grid Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredRentals.map(rental => {
            const statusColor = getStatusColor(rental);
            const isLate = new Date(rental.returnDate) < new Date() && rental.status === 'pending';
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={rental.id}
                className={cn(
                  "p-8 rounded-[3.5rem] border-2 transition-all group overflow-hidden relative shadow-2xl",
                  rental.status === 'returned' 
                    ? "bg-zinc-950/50 border-zinc-900 opacity-60" 
                    : isLate 
                      ? "bg-zinc-900 border-rose-500/30" 
                      : "bg-zinc-900 border-zinc-900 hover:border-brand-red/30"
                )}
              >
                 {isLate && (
                   <div className="absolute top-0 left-0 w-full bg-rose-600 py-2 text-center">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">DEVOLUÇÃO EM ATRASO</span>
                   </div>
                 )}

                 <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-6">
                       <div className={cn(
                         "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl",
                         rental.status === 'returned' ? "bg-zinc-800 text-zinc-600" : "bg-brand-red/10 text-brand-red"
                       )}>
                          <Calendar className="w-8 h-8" />
                       </div>
                       <div>
                          <h3 className="font-black text-2xl uppercase tracking-tighter text-white truncate max-w-[200px] leading-none mb-2">{rental.clientName}</h3>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">
                               <Phone className="w-3 h-3" /> {rental.clientPhone}
                             </div>
                             {rental.deposit > 0 && (
                               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">CAUÇÃO PAGO</span>
                             )}
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                       <span className={cn(
                         "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg",
                         rental.status === 'returned' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                       )}>
                         {rental.status === 'returned' ? 'DEVOLVIDO' : isLate ? 'ATRASADO' : 'ALUGADO'}
                       </span>
                       <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(rental.total)}</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 p-6 bg-black/60 rounded-[2rem] border border-zinc-800 shadow-inner mb-8">
                    <div className="space-y-1">
                       <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block">ITENS</span>
                       <p className="text-sm font-black text-zinc-200 uppercase tracking-tight">{rental.quantity}x {rental.item}</p>
                    </div>
                    <div className="text-right space-y-1">
                       <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block">PREVISÃO RETORNO</span>
                       <p className={cn(
                         "text-sm font-black uppercase tracking-tight",
                         isLate ? "text-rose-500" : "text-brand-red"
                       )}>{new Date(rental.returnDate).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                       <button 
                        onClick={() => { window.open(`https://wa.me/55${rental.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                        className="p-5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 text-zinc-500 hover:text-emerald-500 rounded-[1.5rem] transition-all shadow-xl active:scale-90"
                       >
                          <MessageCircle className="w-6 h-6" />
                       </button>
                       <button 
                        onClick={() => generateQuotePDF({
                          clientName: rental.clientName,
                          items: [{ name: rental.item, quantity: rental.quantity, price: rental.total / rental.quantity }],
                          total: rental.total,
                          type: 'rental',
                          date: rental.deliveryDate
                        })}
                        className="p-5 bg-zinc-900 border border-zinc-800 hover:border-white/30 text-zinc-500 hover:text-white rounded-[1.5rem] transition-all shadow-xl active:scale-90"
                       >
                          <FileText className="w-6 h-6" />
                       </button>
                    </div>

                    <button 
                      onClick={() => toggleStatus(rental)}
                      className={cn(
                        "flex items-center gap-4 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl border-t border-white/10",
                        rental.status === 'returned' 
                          ? "bg-zinc-800 text-zinc-400 hover:text-rose-500 border-zinc-700" 
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      )}
                    >
                       {rental.status === 'returned' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                       {rental.status === 'returned' ? 'REABRIR' : 'MARCAR COMO DEVOLVIDO'}
                    </button>
                 </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{opacity:0, scale:0.9, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.9, y:20}} className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Novo Aluguel</h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 text-zinc-500"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Nome do Cliente</label>
                         <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">WhatsApp</label>
                         <input required type="tel" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold placeholder:text-zinc-700" placeholder="(11) 99999-9999" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Item</label>
                         <select className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white appearance-none uppercase font-bold" value={formData.item} onChange={e=>setFormData({...formData, item: e.target.value})}>
                            {items.map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Quantidade</label>
                         <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Valor Total (R$)</label>
                         <input type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold text-amber-500" value={formData.total} onChange={e=>setFormData({...formData, total: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Caução / Depósito</label>
                         <input type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold text-emerald-500" value={formData.deposit} onChange={e=>setFormData({...formData, deposit: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Data Retirada</label>
                         <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={formData.deliveryDate} onChange={e=>setFormData({...formData, deliveryDate: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase text-zinc-500">Data Devolução</label>
                         <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold text-rose-500" value={formData.returnDate} onChange={e=>setFormData({...formData, returnDate: e.target.value})} />
                      </div>
                   </div>

                   <button type="submit" className="w-full bg-amber-500 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20">Finalizar Cadastro</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
