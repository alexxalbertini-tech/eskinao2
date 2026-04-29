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
  Search, 
  User, 
  Phone, 
  MapPin, 
  History, 
  MessageCircle, 
  MoreVertical,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Clients({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<any>(null);

  const isAdmin = role === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    observations: ''
  });

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'clientes'), where('userId', '==', businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      const data = { 
        ...formData, 
        userId: businessId,
        updatedBy: auth.currentUser?.uid,
        updatedAt: new Date().toISOString()
      };
      if (editingClient) {
        await updateDoc(doc(db, 'clientes', editingClient.id), data);
      } else {
        await addDoc(collection(db, 'clientes'), {
          ...data,
          createdBy: auth.currentUser?.uid,
          createdAt: new Date().toISOString()
        });
      }
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', address: '', observations: '' });
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-4 pb-24 font-sans">
      <section className="flex flex-col gap-4">
        <div className="text-left">
           <h1 className="text-2xl font-black uppercase tracking-tighter text-white">CLIENTES</h1>
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">Base de Contatos Estratégica</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="w-full flex items-center justify-center gap-3 bg-brand-red text-white p-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl active:scale-95 border-t border-white/10"
        >
          <Plus className="w-4 h-4" />
          NOVO CLIENTE
        </button>
      </section>

      <section>
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
           <input 
            type="text" 
            placeholder="PESQUISAR CLIENTE..."
            className="w-full bg-[#121212] border border-zinc-900 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-brand-red/30 uppercase text-[10px] font-black tracking-widest placeholder:text-zinc-800 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <motion.div 
            layout
            key={client.id}
            className="bg-[#121212] border border-zinc-900 p-4 rounded-2xl group shadow-sm"
          >
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center text-brand-red transition-all border border-zinc-900">
                      <User className="w-5 h-5" />
                   </div>
                   <div className="truncate max-w-[140px]">
                      <h3 className="font-black text-sm uppercase tracking-tight truncate text-white">{client.name}</h3>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{client.phone}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   <button 
                    onClick={() => { setEditingClient(client); setFormData(client); setModalOpen(true); }}
                    className="p-1.5 text-zinc-700 hover:text-white transition-colors"
                   >
                     <Edit3 className="w-4 h-4" />
                   </button>
                   {isAdmin && (
                     <button 
                      onClick={async () => { if(confirm('Excluir cliente?')) await deleteDoc(doc(db, 'clientes', client.id)) }}
                      className="p-1.5 text-zinc-700 hover:text-brand-red transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
             </div>

             <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-2.5 bg-black/20 rounded-lg border border-zinc-900/50">
                   <MapPin className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
                   <p className="text-[9px] font-black uppercase text-zinc-500 line-clamp-2 italic">{client.address || 'SEM ENDEREÇO'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => { window.open(`https://wa.me/55${client.phone.replace(/\D/g,'')}`, '_blank') }}
                    className="flex items-center justify-center gap-2 bg-emerald-600/10 text-emerald-500 py-2.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 active:scale-95 shadow-sm"
                   >
                      <MessageCircle className="w-3.5 h-3.5" />
                      ZAP
                   </button>
                   <button className="flex items-center justify-center gap-2 bg-zinc-900 text-zinc-400 py-2.5 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest border border-zinc-800 active:scale-95 shadow-sm">
                      <History className="w-3.5 h-3.5" />
                      HIST
                   </button>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               className="relative w-full max-w-lg bg-[#121212] border-t md:border border-zinc-900 rounded-t-3xl md:rounded-2xl p-6 pb-12 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black uppercase tracking-tighter text-white leading-none">{editingClient ? 'EDITAR' : 'NOVO'} <span className="text-brand-red">CLIENTE</span></h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-all bg-zinc-900 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Nome Completo</label>
                      <input required type="text" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white focus:border-brand-red/30 outline-none font-black uppercase text-xs transition-all" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value.toUpperCase()})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Telefone / WhatsApp</label>
                      <input required type="tel" className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white focus:border-brand-red/30 outline-none font-black text-xs placeholder:text-zinc-800 transition-all" placeholder="21999999999" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Endereço de Entrega</label>
                      <textarea className="w-full bg-black/20 border border-zinc-900 rounded-xl p-4 text-white focus:border-brand-red/30 outline-none font-black text-xs h-24 resize-none transition-all uppercase" placeholder="RUA, NÚMERO, BAIRRO..." value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value.toUpperCase()})} />
                   </div>
                   <button type="submit" className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all mt-6 border-t border-white/10">
                      {editingClient ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR CLIENTE'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
