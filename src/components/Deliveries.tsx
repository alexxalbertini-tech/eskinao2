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

    const stockUnsubscribe = onSnapshot(query(collection(db, 'produtos'), where('userId', '==', businessId)), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const q = query(
      collection(db, 'entregas'),
      where('userId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeliveries(data);
      setLoading(false);
    });

    return () => {
      stockUnsubscribe();
      unsubscribe();
    };
  }, [businessId]);

  const updateStatus = async (id: string, status: DeliveryStatus) => {
    const delivery = deliveries.find(d => d.id === id);
    await updateDoc(doc(db, 'entregas', id), { 
      status,
      updatedBy: auth.currentUser?.uid,
      updatedAt: new Date().toISOString()
    });

    if (status === 'delivered') {
      await addDoc(collection(db, 'caixa'), {
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        type: 'income',
        amount: delivery.total + (delivery.deliveryFee || 0),
        description: `ENTREGA CONCLUÍDA: ${delivery.clientName}`,
        category: 'Vendas',
        date: new Date().toISOString(),
        paymentMethod: delivery.paymentMethod
      });

      if (delivery.items && !delivery.stockDeducted) {
        for (const item of delivery.items) {
          if (item.id) {
            await updateDoc(doc(db, 'produtos', item.id), {
              quantity: increment(-item.quantity)
            });
          }
        }
        await updateDoc(doc(db, 'entregas', id), { stockDeducted: true });
      }
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      await addDoc(collection(db, 'entregas'), {
        ...formData,
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
    } catch (error) {
      console.error(error);
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Premium */}
      <section className="flex flex-col gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
            GESTÃO DE <span className="text-brand-red">ENTREGAS</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Logística Veloz e Inteligente</p>
        </div>
        
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full bg-brand-red hover:bg-red-600 text-white p-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xl transition-all shadow-2xl shadow-red-600/20 active:scale-[0.98] flex items-center justify-center gap-4"
        >
          <div className="bg-white/20 p-2 rounded-full">
            <Truck className="w-8 h-8" />
          </div>
          NOVA ENTREGA
        </button>
      </section>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-2">
         {['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
           <button
             key={s}
             onClick={() => setFilter(s as any)}
             className={cn(
               "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-2 transition-all",
               filter === s 
                 ? "bg-brand-red border-brand-red text-white shadow-lg shadow-red-600/20" 
                 : "bg-zinc-900/50 border-zinc-900 text-zinc-500 hover:border-zinc-800"
             )}
           >
             {s === 'all' ? 'Tudo' : STATUS_CONFIG[s as DeliveryStatus]?.label.toUpperCase()}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredDeliveries.map(delivery => {
            const StatusIcon = STATUS_CONFIG[delivery.status as DeliveryStatus]?.icon || Truck;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={delivery.id}
                className="bg-zinc-900/40 border border-zinc-800/50 rounded-[3.5rem] overflow-hidden hover:border-zinc-700 transition-all shadow-2xl group relative"
              >
                 <div className={cn("h-3 w-full", STATUS_CONFIG[delivery.status as DeliveryStatus]?.color)} />
                 
                 <div className="p-10 space-y-8">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-5">
                          <div className={cn("p-5 rounded-[1.5rem] text-white shadow-lg transition-transform group-hover:scale-110", STATUS_CONFIG[delivery.status as DeliveryStatus]?.color)}>
                             <StatusIcon className={cn("w-7 h-7", delivery.status === 'preparing' && "animate-spin")} />
                          </div>
                          <div className="truncate max-w-[200px]">
                             <h3 className="font-black text-2xl uppercase tracking-tighter text-white leading-none mb-1 truncate">{delivery.clientName}</h3>
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                               {STATUS_CONFIG[delivery.status as DeliveryStatus]?.label}
                             </p>
                          </div>
                       </div>
                       <button className="p-4 bg-zinc-800/50 rounded-2xl text-zinc-700 transition-all">
                         <MoreVertical className="w-6 h-6" />
                       </button>
                    </div>

                    <div className="bg-black/60 rounded-[2.5rem] p-8 space-y-6 border border-zinc-800/50 shadow-inner">
                       <div className="flex items-start gap-5">
                          <div className="p-3 bg-brand-red/10 rounded-xl">
                            <MapPin className="w-6 h-6 text-brand-red" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-lg font-black text-white uppercase leading-tight italic">
                                {delivery.address}, {delivery.number}
                             </p>
                             <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                                {delivery.district}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-5">
                          <div className="p-3 bg-brand-red/10 rounded-xl">
                            <Phone className="w-6 h-6 text-brand-red" />
                          </div>
                          <p className="text-xl font-black text-white tracking-[0.1em]">{delivery.clientPhone}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem]">
                       <div>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Total Geral</span>
                          <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                            {formatCurrency(delivery.total + (delivery.deliveryFee || 0))}
                          </p>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Pagamento</span>
                          <span className="inline-block px-5 py-2 bg-brand-red text-white rounded-full text-[12px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                             {delivery.paymentMethod}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 pt-2">
                       <button 
                         onClick={() => openInMaps(delivery.address, delivery.number, delivery.district)}
                         className="flex items-center justify-center gap-4 bg-zinc-800 hover:bg-white hover:text-black py-6 rounded-[2rem] transition-all font-black text-xs uppercase tracking-[0.2em] border border-zinc-700 shadow-xl active:scale-95"
                       >
                          <Navigation className="w-6 h-6" />
                          MAPAS
                       </button>
                       <button 
                         onClick={() => { window.open(`https://wa.me/55${delivery.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                         className="flex items-center justify-center gap-4 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white py-6 rounded-[2rem] transition-all font-black text-xs uppercase tracking-[0.2em] border border-emerald-500/20 shadow-xl active:scale-95"
                       >
                          <Phone className="w-6 h-6" />
                          WHATSAPP
                       </button>
                    </div>

                    <div className="pt-4">
                       {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                         <div className="grid grid-cols-1 gap-5">
                            {delivery.status === 'pending' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'preparing')} 
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-amber-500/20 active:scale-95 transition-all"
                              >
                                INICIAR PREPARO
                              </button>
                            )}
                            {delivery.status === 'preparing' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'shipped')} 
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                              >
                                <Truck className="w-8 h-8" />
                                DESPACHAR PEDIDO
                              </button>
                            )}
                            {delivery.status === 'shipped' && (
                              <button 
                                onClick={() => updateStatus(delivery.id, 'delivered')} 
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                              >
                                <CheckCircle2 className="w-8 h-8" />
                                CONFIRMAR ENTREGA
                              </button>
                            )}
                         </div>
                       )}
                       {delivery.status === 'delivered' && (
                         <div className="bg-emerald-500/10 border-2 border-emerald-500/20 py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-inner">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            <span className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em]">ENTREGA FINALIZADA</span>
                         </div>
                       )}
                    </div>
                 </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal - Simplificado Premium */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               className="relative w-full max-w-xl bg-zinc-950 border-t md:border border-zinc-800 rounded-t-[4rem] md:rounded-[4rem] p-10 pb-16 overflow-y-auto max-h-[96vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] scrollbar-hide"
             >
                <div className="flex items-center justify-between mb-10">
                   <div className="flex flex-col">
                     <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">NOVA <span className="text-brand-red">ENTREGA</span></h2>
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2">Logística Eskinão 2</span>
                   </div>
                   <button onClick={()=>setModalOpen(false)} className="p-5 bg-zinc-900 rounded-3xl text-zinc-500 hover:text-white transition-all active:scale-90 border border-zinc-800"><XCircle className="w-8 h-8" /></button>
                </div>

                <form onSubmit={handleCreateDelivery} className="space-y-8">
                   <div className="space-y-6">
                      <div className="space-y-2 px-4">
                         <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em]">Nome do Cliente</span>
                         <input required type="text" className="w-full bg-zinc-900/50 border-2 border-zinc-900 focus:border-brand-red/30 rounded-3xl p-6 text-white font-black uppercase text-xl focus:outline-none transition-all placeholder:text-zinc-800" placeholder="EX: MARCOS REIS" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2 px-4">
                         <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em]">Telefone</span>
                         <input required type="tel" placeholder="21999999999" className="w-full bg-zinc-900/50 border-2 border-zinc-900 focus:border-brand-red/30 rounded-3xl p-6 text-white font-black uppercase text-xl focus:outline-none transition-all" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} />
                      </div>
                   </div>

                   <div className="bg-zinc-900/40 p-8 rounded-[3rem] border border-zinc-900/50 space-y-6 shadow-inner">
                      <div className="space-y-2">
                         <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Endereço Completo</span>
                         <input required type="text" className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-5 text-white font-bold uppercase focus:border-brand-red/50 outline-none transition-all" placeholder="RUA / AVENIDA" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                         <div className="space-y-2">
                            <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Nº</span>
                            <input required type="text" className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-5 text-white font-bold uppercase focus:border-brand-red/50 outline-none" placeholder="123" value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Bairro</span>
                            <input required type="text" className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-5 text-white font-bold uppercase focus:border-brand-red/50 outline-none" placeholder="BAIRRO" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value.toUpperCase()})} />
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 px-4">
                      <div className="space-y-2">
                         <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em]">Valor Pedido</span>
                         <input required type="number" step="0.01" className="w-full bg-zinc-900 border-2 border-zinc-900 rounded-3xl p-6 text-white font-black text-2xl focus:border-white/20 outline-none transition-all" value={formData.total} onChange={e=>setFormData({...formData, total: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                         <span className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em]">Taxa Entrega</span>
                         <input required type="number" step="0.01" className="w-full bg-zinc-900 border-2 border-brand-red/20 rounded-3xl p-6 text-brand-red font-black text-2xl focus:border-brand-red outline-none transition-all" value={formData.deliveryFee} onChange={e=>setFormData({...formData, deliveryFee: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="space-y-5">
                      <span className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.4em] block text-center">FORMA DE PAGAMENTO</span>
                      <div className="grid grid-cols-3 gap-4">
                         {[
                           { id: 'pix', icon: QrCode, label: 'PIX' },
                           { id: 'cash', icon: Banknote, label: 'DN' },
                           { id: 'card', icon: CreditCard, label: 'CARTÃO' }
                         ].map(method => (
                           <button
                             key={method.id} type="button"
                             onClick={() => setFormData({...formData, paymentMethod: method.id})}
                             className={cn(
                               "flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border-2 transition-all active:scale-95",
                               formData.paymentMethod === method.id 
                                 ? "bg-brand-red border-brand-red text-white shadow-2xl shadow-red-600/40 translate-y-[-4px]" 
                                 : "bg-black border-zinc-900 text-zinc-600"
                             )}
                           >
                             <method.icon className="w-8 h-8" />
                             <span className="text-[10px] font-black tracking-widest">{method.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className="w-full bg-brand-red text-white py-10 rounded-[3rem] font-black uppercase tracking-[0.3em] text-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] active:scale-95 transition-all mt-8 border-t border-white/20">
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
