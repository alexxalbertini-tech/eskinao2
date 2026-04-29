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
    'Mesas', 'Cadeiras', 'Cooler', 'Caixa Térmica', 'Tendas', 'Caixa de Som', 'Outros'
  ];

  const filteredRentals = rentals.filter(r => {
    const matchesSearch = r.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Eventos / Aluguéis</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Controle de Locação</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          Novo Aluguel
        </button>
      </section>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Ativos</span>
            <p className="text-2xl font-black text-white">{rentals.filter(r => r.status === 'pending').length}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem]">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Retornos Hoje</span>
            <p className="text-2xl font-black text-amber-500">
               {rentals.filter(r => r.status === 'pending' && r.returnDate === new Date().toISOString().split('T')[0]).length}
            </p>
         </div>
      </section>

      {/* Filters */}
      <section className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
           <input 
            type="text" 
            placeholder="NOME DO CLIENTE..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest placeholder:text-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-full md:w-auto">
           {['all', 'pending', 'returned'].map(status => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={cn(
                 "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                 filterStatus === status 
                   ? "bg-zinc-800 text-amber-500 shadow-xl" 
                   : "text-zinc-500 hover:text-white"
               )}
             >
               {status === 'all' ? 'Tudo' : status === 'pending' ? 'Pendentes' : 'Devolvidos'}
             </button>
           ))}
        </div>
      </section>

      {/* Rentals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRentals.map(rental => (
          <motion.div 
            layout
            key={rental.id}
            className={cn(
              "p-6 rounded-[2.5rem] border transition-all group overflow-hidden",
              rental.status === 'returned' 
                ? "bg-zinc-950/50 border-zinc-900 opacity-60" 
                : "bg-zinc-900 border-zinc-800 hover:border-amber-500/50"
            )}
          >
             <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center",
                     rental.status === 'returned' ? "bg-zinc-800 text-zinc-600" : "bg-amber-500/10 text-amber-500"
                   )}>
                      <Calendar className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="font-black text-lg uppercase tracking-tighter truncate max-w-[200px]">{rental.clientName}</h3>
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase">
                         <Phone className="w-3 h-3" /> {rental.clientPhone}
                      </div>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className={cn(
                     "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                     rental.status === 'returned' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                   )}>
                     {rental.status === 'returned' ? 'Devolvido' : 'Pendente'}
                   </span>
                   <span className="text-xl font-black text-white">{formatCurrency(rental.total)}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-800/50 mb-6">
                <div>
                   <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Item Alugado</span>
                   <p className="text-xs font-bold text-zinc-200 uppercase">{rental.quantity}x {rental.item}</p>
                </div>
                <div className="text-right">
                   <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Retorno</span>
                   <p className="text-xs font-bold text-amber-500 uppercase">{new Date(rental.returnDate).toLocaleDateString()}</p>
                </div>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex gap-2">
                   <button 
                    onClick={() => { window.open(`https://wa.me/55${rental.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                    className="p-3 bg-zinc-800 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-500 rounded-2xl transition-all"
                   >
                      <MessageCircle className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => generateQuotePDF({
                      clientName: rental.clientName,
                      items: [{ name: rental.item, quantity: rental.quantity, price: rental.total / rental.quantity }],
                      total: rental.total,
                      type: 'rental',
                      date: rental.deliveryDate
                    })}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all"
                   >
                      <FileText className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex gap-2">
                   <button 
                    onClick={() => toggleStatus(rental)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                      rental.status === 'returned' 
                        ? "bg-zinc-800 text-zinc-400 hover:text-rose-500" 
                        : "bg-emerald-500 text-black hover:bg-emerald-400"
                    )}
                   >
                      {rental.status === 'returned' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {rental.status === 'returned' ? 'Reabrir' : 'Baixa / Devolução'}
                   </button>
                </div>
             </div>
          </motion.div>
        ))}
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
