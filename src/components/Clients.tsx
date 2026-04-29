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
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black uppercase tracking-tighter">Clientes</h1>
           <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Base de Contatos</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-xl shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </section>

      <section>
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
           <input 
            type="text" 
            placeholder="PESQUISAR CLIENTE POR NOME OU CELULAR..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <motion.div 
            layout
            key={client.id}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-amber-500/30 transition-all group shadow-xl"
          >
             <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">
                      <User className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="font-black text-xl uppercase tracking-tighter truncate max-w-[150px]">{client.name}</h3>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{client.phone}</p>
                   </div>
                </div>
                <div className="flex gap-1">
                   <button 
                    onClick={() => { setEditingClient(client); setFormData(client); setModalOpen(true); }}
                    className="p-2 text-zinc-600 hover:text-white"
                   >
                     <Edit3 className="w-4 h-4" />
                   </button>
                   {isAdmin && (
                     <button 
                      onClick={async () => { if(confirm('Excluir cliente?')) await deleteDoc(doc(db, 'clientes', client.id)) }}
                      className="p-2 text-zinc-600 hover:text-rose-500"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-black/40 rounded-2xl border border-zinc-800/50">
                   <MapPin className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                   <p className="text-xs font-medium text-zinc-400 line-clamp-2">{client.address || 'ENDEREÇO NÃO CADASTRADO'}</p>
                </div>
                
                <div className="flex gap-2">
                   <button 
                    onClick={() => { window.open(`https://wa.me/55${client.phone.replace(/\D/g,'')}`, '_blank') }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"
                   >
                      <MessageCircle className="w-4 h-4" />
                      WHATSAPP
                   </button>
                   <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-700">
                      <History className="w-4 h-4" />
                      HISTÓRICO
                   </button>
                </div>
             </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{opacity:0, scale:0.9, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.9, y:20}} className="relative w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">{editingClient ? 'Editar' : 'Novo'} Cliente</h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 text-zinc-500"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Nome Completo</label>
                      <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold uppercase transition-all" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Telefone / WhatsApp</label>
                      <input required type="tel" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold placeholder:text-zinc-700 transition-all" placeholder="(11) 99999-9999" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Endereço de Entrega</label>
                      <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold text-sm h-24 resize-none transition-all uppercase" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} />
                   </div>
                   <button type="submit" className="w-full bg-amber-500 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all mt-4">
                      {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
