import { useState, useEffect } from 'react';
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
  increment 
} from '../lib/firebase';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode,
  Beer,
  Truck,
  User,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

export default function Sales({ businessId }: { role?: string | null, businessId?: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isProcessing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'produtos'), where('userId', '==', businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    });
    return () => unsubscribe();
  }, [businessId]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.quantity) return; // Stock limit
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.quantity <= 0) return;
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > (product?.quantity || 0)) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setProcessing(true);
    setLastTotal(total);

    try {
      // 1. Transaction Data
      const items = cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.salePrice }));

      if (paymentMethod === 'delivery') {
        // Create Delivery Record
        await addDoc(collection(db, 'entregas'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          clientName: 'CLIENTE BALCÃO (VENDA RÁPIDA)',
          clientPhone: '',
          address: 'RETIRADA NO BALCÃO',
          district: '',
          number: '',
          total: total,
          deliveryFee: 0,
          paymentMethod: 'cash',
          status: 'pending',
          items: items,
          createdAt: new Date().toISOString()
        });
      } else {
        // Direct Sale
        await addDoc(collection(db, 'vendas'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          type: 'sale',
          amount: total,
          description: `VENDA PDV: ${cart.length} ITENS`,
          category: 'Vendas',
          paymentMethod,
          date: new Date().toISOString(),
          items: items
        });

        // Add to Cashier if not 'fiado'
        if (paymentMethod !== 'fiado') {
           await addDoc(collection(db, 'caixa'), {
             userId: businessId,
             createdBy: auth.currentUser?.uid,
             type: 'income',
             amount: total,
             description: `VENDA PDV: ${cart.length} ITENS`,
             category: 'Vendas',
             date: new Date().toISOString(),
             paymentMethod
           });
        }
      }

      // 2. Inventory Deduction (Only for direct sales, delivery deducts on delivery usually)
      if (paymentMethod !== 'delivery') {
        for (const item of cart) {
          await updateDoc(doc(db, 'produtos', item.id), {
            quantity: increment(-item.quantity)
          });

          await addDoc(collection(db, 'estoque'), {
            userId: businessId,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            type: 'out',
            totalSale: item.salePrice * item.quantity,
            createdBy: auth.currentUser?.uid,
            date: new Date().toISOString()
          });
        }
      }

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Checkout failed", error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 font-sans pb-20">
      
      {/* Product Selection - Premium UI */}
      <section className="lg:col-span-8 flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="text-center md:text-left">
              <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white">
                VENDA <span className="text-brand-red">RÁPIDA</span>
              </h1>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">SISTEMA PDV DE ALTA PERFORMANCE</p>
           </div>
           <div className="relative w-full md:w-[350px] group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5 group-focus-within:text-brand-red transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR PRODUTO..." 
                className="w-full bg-zinc-900 border-2 border-zinc-900 focus:border-brand-red/30 rounded-3xl py-6 pl-16 pr-6 text-white text-xs font-black tracking-widest uppercase focus:outline-none transition-all placeholder:text-zinc-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
           {filteredProducts.map(product => (
             <motion.button
                layout
                key={product.id}
                disabled={product.quantity <= 0}
                onClick={() => addToCart(product)}
                className={cn(
                  "flex flex-col p-6 rounded-[2.5rem] border-2 transition-all text-left group relative overflow-hidden active:scale-95 min-h-[220px]",
                  product.quantity <= 0 
                    ? "bg-zinc-950 border-zinc-900 grayscale opacity-40 cursor-not-allowed" 
                    : "bg-zinc-900/50 border-zinc-900 hover:border-brand-red/40 hover:bg-zinc-900 shadow-xl"
                )}
             >
                <div className="mb-6 flex justify-between items-start">
                   <div className={cn(
                     "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg",
                     product.quantity <= 0 ? "bg-zinc-900 text-zinc-700" : "bg-brand-red/10 text-brand-red group-hover:bg-brand-red group-hover:text-white"
                   )}>
                      <Beer className="w-7 h-7 md:w-8 md:h-8" />
                   </div>
                   {product.quantity > 0 && (
                     <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">{product.quantity}</span>
                     </div>
                   )}
                </div>
                
                <h3 className="font-black text-xs md:text-sm uppercase tracking-tight line-clamp-2 min-h-[2rem] text-zinc-200 group-hover:text-white transition-colors">{product.name}</h3>
                
                <div className="mt-auto pt-4 flex flex-col items-start gap-1">
                   <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">R$</span>
                   <span className="text-xl md:text-2xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">{formatCurrency(product.salePrice)}</span>
                </div>
             </motion.button>
           ))}
        </div>
      </section>

      {/* Cart side panel - Premium Design */}
      <section className="lg:col-span-4 bg-zinc-950 border-2 border-zinc-900 rounded-[4rem] flex flex-col shadow-2xl relative border-brand-red/5 min-h-[600px] lg:min-h-0">
        <div className="p-8 border-b-2 border-zinc-900 flex items-center justify-between bg-black/40">
           <div className="flex items-center gap-4">
              <div className="bg-brand-red p-3 rounded-2xl shadow-xl shadow-red-600/30">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">CHECKOUT</h2>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Painel de Pagamento</span>
              </div>
           </div>
           <div className="flex flex-col items-end">
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Items</span>
             <span className="bg-zinc-800 text-white px-4 py-1 rounded-full text-[12px] font-black uppercase shadow-lg border border-zinc-700">{cart.length}</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-zinc-950/50 shadow-inner">
           {cart.length > 0 ? (
             <AnimatePresence>
                {cart.map(item => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.id} 
                    className="group bg-zinc-900/60 border border-zinc-800/80 rounded-[2rem] p-6 flex flex-col gap-4 hover:border-brand-red/20 transition-all shadow-lg"
                  >
                     <div className="flex items-start justify-between">
                        <div className="max-w-[70%]">
                           <h4 className="text-[12px] font-black uppercase tracking-tight text-white leading-tight mb-1 group-hover:text-brand-red transition-colors">{item.name}</h4>
                           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{formatCurrency(item.salePrice)} UN</span>
                        </div>
                        <button 
                          onClick={() => setCart(cart.filter(i => i.id !== item.id))} 
                          className="p-3 bg-zinc-800 hover:bg-rose-500/10 text-zinc-600 hover:text-rose-500 rounded-xl transition-all"
                        >
                           <XCircle className="w-5 h-5" />
                        </button>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                        <div className="flex items-center gap-4 bg-black rounded-2xl p-1.5 px-3 border border-zinc-800 shadow-xl">
                           <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-zinc-500 hover:text-brand-red transition-all active:scale-90">
                              <Minus className="w-5 h-5" />
                           </button>
                           <span className="text-lg font-black tabular-nums w-6 text-center text-white">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-zinc-500 hover:text-emerald-500 transition-all active:scale-90">
                              <Plus className="w-5 h-5" />
                           </button>
                        </div>
                        <span className="text-xl font-black text-white tabular-nums drop-shadow-md">
                          {formatCurrency(item.salePrice * item.quantity)}
                        </span>
                     </div>
                  </motion.div>
                ))}
             </AnimatePresence>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-40 py-20">
                <ShoppingCart className="w-24 h-24 mb-6 stroke-[1.5]" />
                <p className="uppercase text-xs font-black tracking-[0.4em] text-center">ARRASTE PRODUTOS<br/>PARA O CARRINHO</p>
             </div>
           )}
        </div>

        <div className="p-10 bg-zinc-900 border-t-2 border-zinc-800 space-y-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
           <div className="flex justify-between items-center bg-black/40 p-8 rounded-[2.5rem] border border-zinc-800 shadow-inner group">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] group-hover:text-brand-red transition-colors">TOTAL FINAL</span>
              <span className="text-4xl font-black text-white tracking-tighter drop-shadow-xl">{formatCurrency(total)}</span>
           </div>

           <div className="space-y-4">
              <span className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.4em] block text-center">MÉTODO DE PAGAMENTO</span>
              <div className="grid grid-cols-5 gap-3">
                 {[
                   { id: 'pix', icon: QrCode, label: 'PIX' },
                   { id: 'cash', icon: Banknote, label: 'DN' },
                   { id: 'card', icon: CreditCard, label: 'CARD' },
                   { id: 'fiado', icon: User, label: 'PEND' },
                   { id: 'delivery', icon: Truck, label: 'DLVR' }
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => setPaymentMethod(method.id)}
                     className={cn(
                       "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95",
                       paymentMethod === method.id 
                         ? "bg-brand-red border-brand-red text-white shadow-2xl shadow-red-600/30 -translate-y-1.5" 
                         : "bg-black border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                     )}
                   >
                     <method.icon className="w-5 h-5" />
                     <span className="text-[9px] font-black tracking-widest">{method.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           <button 
             disabled={cart.length === 0 || isProcessing}
             onClick={handleCheckout}
             className={cn(
               "w-full py-10 rounded-[3rem] font-black uppercase text-2xl tracking-[0.2em] shadow-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-5 border-t border-white/10",
               cart.length === 0 || isProcessing
                 ? "bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed border-zinc-700" 
                 : "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/40"
             )}
           >
             {isProcessing ? (
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                 PROCESSANDO...
               </div>
             ) : 'GERAR VENDA'}
           </button>
        </div>

        {/* Success Overlay - Premium */}
        <AnimatePresence>
           {showSuccess && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-white p-12 z-[100]"
             >
                <div className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-10 border-t-4 border-white/20">
                  <CheckCircle2 className="w-16 h-16 text-white animate-bounce" />
                </div>
                <h3 className="text-5xl font-black uppercase tracking-tighter text-center leading-none mb-4">SUCESSO <span className="text-brand-red">TOTAL</span></h3>
                <p className="text-zinc-500 uppercase text-xs font-black tracking-[0.4em] mb-12">COMPROVANTE EMITIDO</p>
                
                <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 w-full text-center space-y-2">
                   <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Valor Recebido</p>
                   <p className="text-4xl font-black text-emerald-500 drop-shadow-lg">{formatCurrency(lastTotal)}</p>
                   <div className="pt-4 mt-4 border-t border-zinc-800/50">
                      <span className="px-5 py-2 bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400">VIA {paymentMethod.toUpperCase()}</span>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </section>
    </div>
  );
}
