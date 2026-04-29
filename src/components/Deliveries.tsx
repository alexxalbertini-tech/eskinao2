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
  Package,
  ChevronRight,
  MoreVertical,
  Banknote,
  QrCode,
  CreditCard,
  User,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

type DeliveryStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string, color: string, icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-zinc-500', icon: Clock },
  preparing: { label: 'Preparo', color: 'bg-amber-500', icon: Loader2 },
  shipped: { label: 'Em Rota', color: 'bg-blue-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-rose-500', icon: XCircle }
};

export default function Deliveries({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DeliveryStatus | 'all'>('all');
  const [isModalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const isAdmin = role === 'admin';

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

    // Fetch Products
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

    // If delivered and paid in cash/pix, log transaction
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

      // Baixar estoque if items present and not already deducted
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

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = selectedItems.find(i => i.id === productId);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { id: product.id, name: product.name, quantity: 1, price: product.salePrice }]);
    }
    // Update total automatically
    setFormData(prev => ({ ...prev, total: prev.total + product.salePrice }));
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      await addDoc(collection(db, 'entregas'), {
        ...formData,
        items: selectedItems,
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        status: 'pending',
        stockDeducted: false, // Will deduct on delivery
        createdAt: new Date().toISOString()
      });
      setModalOpen(false);
      setSelectedItems([]);
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
    const query = encodeURIComponent(`${address}, ${number}, ${district}, Rio de Janeiro`); // Added generic city if needed, or get from client
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const filteredDeliveries = deliveries.filter(d => filter === 'all' || d.status === filter);

  return (
    <div className="space-y-6 pb-20">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black uppercase tracking-tighter">Entregas</h1>
           <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">LOGÍSTICA E DELIVERY</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-600/20"
          >
            <Plus className="w-5 h-5" />
            Novo Pedido
          </button>
        )}
      </section>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map(s => (
           <button
             key={s}
             onClick={() => setFilter(s as any)}
             className={cn(
               "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
               filter === s 
                 ? "bg-brand-gold border-brand-gold text-black shadow-lg" 
                 : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
             )}
           >
             {s === 'all' ? 'Tudo' : STATUS_CONFIG[s as DeliveryStatus].label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredDeliveries.map(delivery => {
            const StatusIcon = STATUS_CONFIG[delivery.status as DeliveryStatus].icon;
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={delivery.id}
                className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-zinc-700 transition-all shadow-2xl"
              >
                 {/* Status Bar */}
                 <div className={cn("h-1.5 w-full", STATUS_CONFIG[delivery.status as DeliveryStatus].color)} />
                 
                 <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-xl text-white", STATUS_CONFIG[delivery.status as DeliveryStatus].color)}>
                             <StatusIcon className={cn("w-5 h-5", delivery.status === 'preparing' && "animate-spin")} />
                          </div>
                          <div>
                             <h3 className="font-black text-lg uppercase tracking-tighter truncate">{delivery.clientName}</h3>
                             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{delivery.status.toUpperCase()}</p>
                          </div>
                       </div>
                       <button className="p-2 text-zinc-700 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-start gap-3 text-zinc-400">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <p className="text-xs font-medium leading-relaxed uppercase">
                             {delivery.address}, {delivery.number} - {delivery.district}
                             {delivery.reference && <span className="block text-[10px] text-zinc-600 mt-1">{delivery.reference}</span>}
                          </p>
                       </div>
                       <div className="flex items-center gap-3 text-zinc-400">
                          <Phone className="w-4 h-4 shrink-0" />
                          <p className="text-xs font-bold">{delivery.clientPhone}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                       <div>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Total Pedido</span>
                          <p className="text-lg font-black text-white">{formatCurrency(delivery.total + (delivery.deliveryFee || 0))}</p>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Pagamento</span>
                          <div className="flex items-center justify-end gap-2">
                             <p className="text-xs font-black text-brand-gold uppercase">{delivery.paymentMethod}</p>
                             {delivery.paymentMethod === 'cash' && delivery.changeFor > 0 && (
                               <span className="text-[10px] text-emerald-500 font-bold">TROCO: {formatCurrency(delivery.changeFor)}</span>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={() => openInMaps(delivery.address, delivery.number, delivery.district)}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-zinc-700"
                       >
                          <Navigation className="w-4 h-4" />
                          Mapa
                       </button>
                       <button 
                         onClick={() => { window.open(`https://wa.me/55${delivery.clientPhone.replace(/\D/g,'')}`, '_blank') }}
                         className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-emerald-500/20"
                       >
                          WhatsApp
                       </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                         <>
                            {delivery.status === 'pending' && (
                              <button onClick={() => updateStatus(delivery.id, 'preparing')} className="bg-amber-500 text-black text-[10px] font-black py-2 rounded-xl col-span-3">Iniciar Preparo</button>
                            )}
                            {delivery.status === 'preparing' && (
                              <button onClick={() => updateStatus(delivery.id, 'shipped')} className="bg-blue-500 text-white text-[10px] font-black py-2 rounded-xl col-span-3">Saiu para Entrega</button>
                            )}
                            {delivery.status === 'shipped' && (
                              <button onClick={() => updateStatus(delivery.id, 'delivered')} className="bg-emerald-500 text-white text-[10px] font-black py-2 rounded-xl col-span-3">Confirmar Entrega</button>
                            )}
                         </>
                       )}
                    </div>
                 </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Create Delivery Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{opacity:0, scale:0.9, y:20}} animate={{opacity:1, scale:1, y:0}} exit={{opacity:0, scale:0.9, y:20}} className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Novo Pedido Delivery</h2>
                   <button onClick={()=>setModalOpen(false)} className="p-2 text-zinc-500"><XCircle /></button>
                </div>

                <form onSubmit={handleCreateDelivery} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Cliente</label>
                         <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold uppercase transition-all" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Telefone</label>
                         <input required type="tel" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold placeholder:text-zinc-700" placeholder="(11) 99999-9999" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Endereço (Rua/Av)</label>
                      <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold uppercase" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} />
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Bairro</label>
                         <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold uppercase" value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Nº</label>
                         <input required type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold uppercase" value={formData.number} onChange={e=>setFormData({...formData, number: e.target.value})} />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Referência</label>
                      <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-brand-red/50 outline-none font-bold uppercase" value={formData.reference} onChange={e=>setFormData({...formData, reference: e.target.value})} />
                   </div>

                   {/* Item Selection */}
                   <div className="space-y-3 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-900">
                      <div className="flex items-center justify-between mb-2">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Itens do Pedido</label>
                         <span className="text-[10px] font-bold text-brand-gold">{selectedItems.length} selecionados</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                         {selectedItems.map(item => (
                           <div key={item.id} className="bg-zinc-800 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-2">
                              {item.quantity}x {item.name}
                              <button type="button" onClick={() => setSelectedItems(selectedItems.filter(i => i.id !== item.id))} className="text-rose-500 hover:text-rose-400">×</button>
                           </div>
                         ))}
                      </div>

                      <div className="relative">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                         <input 
                           type="text" 
                           placeholder="Buscar produto..." 
                           className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-xs font-bold uppercase text-white outline-none focus:border-brand-red/50"
                           value={productSearch}
                           onChange={e => setProductSearch(e.target.value)}
                         />
                      </div>

                      {productSearch && (
                        <div className="max-h-32 overflow-y-auto bg-black rounded-xl border border-zinc-800 mt-2">
                           {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                             <button
                               key={p.id} type="button"
                               onClick={() => { handleAddItem(p.id); setProductSearch(''); }}
                               className="w-full text-left p-2 hover:bg-zinc-900 text-[10px] font-bold uppercase border-b border-zinc-900 last:border-0"
                             >
                                {p.name} - {formatCurrency(p.salePrice)}
                             </button>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Valor Produtos (R$)</label>
                         <input required type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold" value={formData.total} onChange={e=>setFormData({...formData, total: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Taxa Entrega (R$)</label>
                         <input required type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold text-brand-gold" value={formData.deliveryFee} onChange={e=>setFormData({...formData, deliveryFee: Number(e.target.value)})} />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block text-center">Pagamento na Entrega</label>
                      <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'pix', icon: QrCode, label: 'PIX' },
                           { id: 'cash', icon: Banknote, label: 'DN' },
                           { id: 'card', icon: CreditCard, label: 'CARTÃO' }
                         ].map(method => (
                           <button
                             key={method.id} type="button"
                             onClick={() => setFormData({...formData, paymentMethod: method.id})}
                             className={cn(
                               "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                               formData.paymentMethod === method.id 
                                 ? "bg-brand-red border-brand-red text-white shadow-lg shadow-red-600/20 scale-105" 
                                 : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                             )}
                           >
                             <method.icon className="w-5 h-5" />
                             <span className="text-[10px] font-black">{method.label}</span>
                           </button>
                         ))}
                      </div>
                   </div>

                   {formData.paymentMethod === 'cash' && (
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Troco para quanto?</label>
                        <input type="number" step="0.01" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white font-bold" value={formData.changeFor} onChange={e=>setFormData({...formData, changeFor: Number(e.target.value)})} />
                     </div>
                   )}

                   <button type="submit" className="w-full bg-brand-red text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all mt-4">
                      Criar Pedido de Entrega
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
