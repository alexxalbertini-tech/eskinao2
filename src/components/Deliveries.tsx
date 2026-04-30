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
  orderBy,
  increment
} from '../lib/firebase';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Navigation,
  Plus,
  Loader2,
  MoreVertical,
  Banknote,
  QrCode,
  CreditCard,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

type DeliveryStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string, color: string, icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-zinc-500', icon: Clock },
  preparing: { label: 'Preparo', color: 'bg-amber-500', icon: Loader2 },
  shipped: { label: 'Em Rota', color: 'bg-blue-600', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-600', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-brand-red', icon: XCircle }
};

export default function Deliveries({ businessId }: { role?: string | null, businessId?: string | null }) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeliveryStatus | 'all'>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // Form
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    address: '',
    district: '',
    number: '',
    reference: '',
    deliveryFee: 0,
    paymentMethod: 'pix',
    total: 0,
    observations: '',
    changeFor: 0
  });

  useEffect(() => {
    if (!businessId) return;

    const stockUnsubscribe = onSnapshot(query(collection(db, 'usuarios', businessId, 'produtos')), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Erro no onSnapshot de produtos (entregas):", err));

    const q = query(
      collection(db, 'usuarios', businessId, 'entregas'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeliveries(data);
      setLoading(false);
    }, (err) => {
      console.error("Erro no onSnapshot de entregas:", err);
      setLoading(false);
    });

    return () => {
      stockUnsubscribe();
      unsubscribe();
    };
  }, [businessId]);

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    if (!businessId || !auth.currentUser) return;
    try {
      const delivery = deliveries.find(d => d.id === id);
      if (!delivery) return;

      await updateDoc(doc(db, 'usuarios', businessId, 'entregas', id), { 
        status,
        updatedBy: auth.currentUser?.uid,
        updatedAt: new Date().toISOString()
      });

      if (status === 'delivered') {
        await addDoc(collection(db, 'usuarios', businessId, 'caixa'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          type: 'income',
          amount: Number(delivery.total || 0) + (Number(delivery.deliveryFee) || 0),
          description: `ENTREGA CONCLUÍDA: ${delivery.clientName}`,
          category: 'Vendas',
          date: new Date().toISOString(),
          paymentMethod: delivery.paymentMethod
        });

        if (delivery.items && !delivery.stockDeducted) {
          for (const item of delivery.items) {
            if (item.id) {
              await updateDoc(doc(db, 'usuarios', businessId, 'produtos', item.id), {
                quantity: increment(-(Number(item.quantity) || 0))
              });
            }
          }
          await updateDoc(doc(db, 'usuarios', businessId, 'entregas', id), { stockDeducted: true });
        }
      }
    } catch (err: any) {
      console.error("Erro ao atualizar status de entrega:", err);
      alert("Erro ao atualizar status: " + (err.code || err.message));
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'usuarios', businessId, 'entregas'), {
        clientName: formData.clientName.trim().toUpperCase(),
        clientPhone: formData.clientPhone.trim(),
        address: formData.address.trim().toUpperCase(),
        district: formData.district.trim().toUpperCase(),
        number: formData.number.trim(),
        reference: formData.reference.trim().toUpperCase(),
        deliveryFee: Number(formData.deliveryFee) || 0,
        paymentMethod: formData.paymentMethod,
        total: Number(formData.total) || 0,
        observations: formData.observations.trim(),
        changeFor: Number(formData.changeFor) || 0,
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        status: 'pending',
        stockDeducted: false, 
        createdAt: new Date().toISOString()
      });
      setModalOpen(false);
      setFormData({
        clientName: '', clientPhone: '', address: '', district: '', 
        number: '', reference: '', deliveryFee: 0, paymentMethod: 'pix', 
        total: 0, observations: '', changeFor: 0
      });
    } catch (err: any) {
      console.error("Erro ao criar entrega:", err);
      alert("Erro ao criar entrega: " + (err.code || err.message));
    }
  };

  const openInMaps = (address: string, number: string, district: string) => {
    const searchStr = `${address}, ${number}, ${district}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchStr)}`, '_blank');
  };

  const filteredDeliveries = deliveries.filter(d => filter === 'all' || d.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Optimized */}
      <section className="flex flex-col gap-4">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            GESTÃO DE <span className="text-brand-red">ENTREGAS</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Logística Veloz e Inteligente</p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full bg-brand-red hover:bg-red-600 text-white p-5 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-4 border-t border-white/10"
        >
          <Truck className="w-5 h-5" />
          NOVA ENTREGA
        </button>
      </section>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
           <button
             key={s}
             onClick={() => setFilter(s as any)}
             className={cn(
               "px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all active:scale-95",
               filter === s 
                 ? "bg-brand-red/10 border-brand-red text-brand-red" 
                 : "bg-[#121212] border-zinc-900 text-zinc-600 hover:border-zinc-800"
             )}
           >
             {s === 'all' ? 'Tudo' : STATUS_CONFIG[s as DeliveryStatus]?.label.toUpperCase()}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDeliveries.map(delivery => {
            const StatusIcon = STATUS_CONFIG[delivery.status as DeliveryStatus]?.icon || Truck;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={delivery.id}
                className="bg-[#121212] border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all shadow-xl group relative"
              >
                 <div className={cn("h-1.5 w-full", STATUS_CONFIG[delivery.status as DeliveryStatus]?.color)} />
                 
                 <div className="p-5 space-y-5">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-lg text-white shadow-md transition-transform group-hover:scale-110", STATUS_CONFIG[delivery.status as DeliveryStatus]?.color)}>
                             <StatusIcon className={cn("w-5 h-5", delivery.status === 'preparing' && "animate-spin")} />
                          </div>
                          <div className="truncate max-w-[180px]">
                             <h3 className="font-black text-lg uppercase tracking-tight text-white leading-none mb-0.5 truncate">{delivery.clientName}</h3>
                             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                {STATUS_CONFIG[delivery.status as DeliveryStatus]?.label}
                             </p>
                          </div>
                       </div>
                       <button className="p-2 bg-zinc-900 rounded-lg text-zinc-700">
                         <MoreVertical className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="bg-[#0c0c0c] rounded-xl p-4 space-y-4 border border-zinc-900 shadow-inner">
                       <div className="flex items-start gap-4">
                          <div className="p-2 bg-brand-red/10 rounded-lg">
                            <MapPin className="w-5 h-5 text-brand-red" />
                          </div>
                          <div className="truncate">
                             <p className="text-sm font-black text-white uppercase leading-tight italic">
                                {delivery.address}, {delivery.number}
                             </p>
                             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                {delivery.district}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="p-2 bg-brand-red/10 rounded-lg">
                            <Phone className="w-5 h-5 text-brand-red" />
                          </div>
                          <p className="text-lg font-black text-white tracking-[0.05em]">{delivery.clientPhone}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-zinc-900/50">
                       <div>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">Total Geral</span>
                          <p className="text-xl font-black text-white tabular-nums tracking-tighter">
                            {formatCurrency(delivery.total + (delivery.deliveryFee || 0))}
                          </p>
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Pagamento</span>
                          <span className="inline-block px-3 py-1 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-full text-[9px] font-black uppercase tracking-widest">
                             {delivery.paymentMethod}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                       <button 
                         onClick={() => openInMaps(delivery.address, delivery.number, delivery.district)}
                         className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 py-3 rounded-lg transition-all font-black text-[9px] uppercase tracking-widest border border-zinc-800 shadow-md active:scale-95"
                       >
                          <Navigation className="w-4 h-4" />
                          MAPAS
                       </button>
                       <button 
                         onClick={() => { window.open(`https://wa.me/55${delivery.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                         className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 py-3 rounded-lg transition-all font-black text-[9px] uppercase tracking-widest border border-emerald-500/20 shadow-md active:scale-95"
                       >
                          <Phone className="w-4 h-4" />
                          ZAP
                       </button>
                    </div>

                    <div className="pt-2">
                       {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                         <div className="grid grid-cols-1 gap-3">
                            {delivery.status === 'pending' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'preparing')} 
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
                              >
                                INICIAR PREPARO
                              </button>
                            )}
                            {delivery.status === 'preparing' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'shipped')} 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                              >
                                <Truck className="w-5 h-5" />
                                DESPACHAR PEDIDO
                              </button>
                            )}
                            {delivery.status === 'shipped' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'delivered')} 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                                CONFIRMAR ENTREGA
                              </button>
                            )}
                         </div>
                       )}
                       {delivery.status === 'delivered' && (
                         <div className="bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl flex items-center justify-center gap-3 shadow-inner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">FINALIZADA</span>
                         </div>
                       )}
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
               className="relative w-full max-w-lg bg-[#0f0f0f] border-t md:border border-zinc-900 rounded-t-3xl md:rounded-3xl p-6 pb-12 overflow-y-auto max-h-[92vh] shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex flex-col">
                     <h2 className="text-xl font-black uppercase tracking-tighter text-white leading-none">NOVA <span className="text-brand-red">ENTREGA</span></h2>
                     <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Logística Eskinão 2</span>
                   </div>
                   <button onClick={()=>setModalOpen(false)} className="p-2 bg-zinc-900 rounded-lg text-zinc-500 border border-zinc-800"><XCircle className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleCreateDelivery} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Cliente</span>
                         <input required type="text" className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 text-white font-black uppercase text-xs focus:outline-none transition-all placeholder:text-zinc-800" placeholder="NOME" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Telefone</span>
                         <input required type="tel" placeholder="21999999999" className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 text-white font-black uppercase text-xs focus:outline-none transition-all" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} />
                      </div>
                   </div>

                   <div className="bg-[#121212] p-4 rounded-2xl border border-zinc-900 space-y-4 shadow-inner">
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Rua / Av</span>
                         <input required type="text" className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-[11px] text-white font-bold uppercase focus:border-brand-red/50 outline-none" placeholder="LOGRADOURO" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Nº</span>
                            <input required type="text" className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-[11px] text-white font-bold uppercase focus:border-brand-red/50 outline-none" placeholder="123" value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Bairro</span>
                            <input required type="text" className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-[11px] text-white font-bold uppercase focus:border-brand-red/50 outline-none" placeholder="BAIRRO" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value.toUpperCase()})} />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">Valor Pedido</span>
                         <input required type="number" step="0.01" className="w-full bg-[#121212] border border-zinc-800 rounded-xl p-4 text-white font-black text-sm focus:border-white/20 outline-none" value={formData.total} onChange={e=>setFormData({...formData, total: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-brand-red uppercase tracking-widest ml-2">Taxa Entrega</span>
                         <input required type="number" step="0.01" className="w-full bg-brand-red/5 border border-brand-red/20 rounded-xl p-4 text-brand-red font-black text-sm focus:border-brand-red outline-none" value={formData.deliveryFee} onChange={e=>setFormData({...formData, deliveryFee: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block text-center">FORMA DE PAGAMENTO</span>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                           { id: 'pix', icon: QrCode, label: 'PIX' },
                           { id: 'cash', icon: Banknote, label: 'DN' },
                           { id: 'card', icon: CreditCard, label: 'PED' }
                         ].map(method => (
                           <button
                             key={method.id} type="button"
                             onClick={() => setFormData({...formData, paymentMethod: method.id})}
                             className={cn(
                               "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-95",
                               formData.paymentMethod === method.id 
                                 ? "bg-brand-red/10 border-brand-red text-brand-red" 
                                 : "bg-black/20 border-zinc-900 text-zinc-600"
                             )}
                           >
                             <method.icon className="w-5 h-5" />
                             <span className="text-[8px] font-black tracking-widest">{method.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all mt-4 border-t border-white/10">
                      CADASTRAR ENTREGA
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
