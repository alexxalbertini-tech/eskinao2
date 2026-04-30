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
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'usuarios', businessId, 'produtos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    }, (err) => {
      console.error("Erro no onSnapshot de produtos (vendas):", err);
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
    
    if (!auth.currentUser) {
      alert("Usuário não autenticado.");
      return;
    }

    if (!businessId) {
      alert("ID da empresa não encontrado.");
      return;
    }

    setProcessing(true);
    setLastTotal(total);

    try {
      // 1. Transaction Data
      const items = cart.map(i => ({ 
        id: i.id, 
        name: i.name, 
        quantity: Number(i.quantity) || 0, 
        price: Number(i.salePrice) || 0 
      }));

      if (paymentMethod === 'delivery') {
        // Create Delivery Record
        await addDoc(collection(db, 'usuarios', businessId, 'entregas'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          clientName: 'CLIENTE BALCÃO (VENDA RÁPIDA)',
          clientPhone: '',
          address: 'RETIRADA NO BALCÃO',
          district: '',
          number: '',
          total: Number(total),
          deliveryFee: 0,
          paymentMethod: 'cash',
          status: 'pending',
          items: items,
          createdAt: new Date().toISOString()
        });
      } else {
        // Direct Sale
        await addDoc(collection(db, 'usuarios', businessId, 'vendas'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          type: 'sale',
          amount: Number(total),
          description: `VENDA PDV: ${cart.length} ITENS`,
          category: 'Vendas',
          paymentMethod,
          date: new Date().toISOString(),
          items: items
        });

        // Add to Cashier if not 'fiado'
        if (paymentMethod !== 'fiado') {
           await addDoc(collection(db, 'usuarios', businessId, 'caixa'), {
             userId: businessId,
             createdBy: auth.currentUser?.uid,
             type: 'income',
             amount: Number(total),
             description: `VENDA PDV: ${cart.length} ITENS`,
             category: 'Vendas',
             date: new Date().toISOString(),
             paymentMethod
           });
        }
      }

      // 2. Inventory Deduction
      // Deduct immediately for all direct sales and counter deliveries
      for (const item of cart) {
        await updateDoc(doc(db, 'usuarios', businessId, 'produtos', item.id), {
          quantity: increment(-(Number(item.quantity) || 0))
        });

        await addDoc(collection(db, 'usuarios', businessId, 'estoque'), {
          userId: businessId,
          productId: item.id,
          productName: item.name,
          quantity: Number(item.quantity) || 0,
          type: 'out',
          totalSale: Number(item.salePrice * item.quantity),
          createdBy: auth.currentUser?.uid,
          date: new Date().toISOString()
        });
      }

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Checkout failed:", err);
      alert(`Erro ao finalizar venda: ${err.code || err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans pb-24">
      
      {/* Product Selection - Optimized */}
      <section className="lg:col-span-8 flex flex-col space-y-6">
        <div className="flex flex-col gap-4">
           <div className="text-left">
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-white">
                VENDA <span className="text-brand-red">RÁPIDA</span>
              </h1>
              <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">SISTEMA PDV DE ALTA PERFORMANCE</p>
           </div>
           <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 w-4 h-4" />
              <input 
                type="text" 
                placeholder="BUSCAR PRODUTO..." 
                className="w-full bg-[#121212] border border-zinc-900 rounded-xl py-4 pl-11 pr-4 text-white text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-brand-red/30 transition-all placeholder:text-zinc-800 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
           {filteredProducts.slice(0, 24).map(product => (
             <motion.button
                layout
                key={product.id}
                disabled={product.quantity <= 0}
                onClick={() => addToCart(product)}
                className={cn(
                   "flex flex-col p-4 rounded-xl border transition-all text-left group relative overflow-hidden active:scale-[0.98] min-h-[140px]",
                   product.quantity <= 0 
                     ? "bg-zinc-950 border-zinc-900 grayscale opacity-40 cursor-not-allowed" 
                     : "bg-[#121212] border-zinc-900 hover:border-brand-red/30 shadow-md"
                )}
             >
                <div className="mb-4 flex justify-between items-start">
                   <div className={cn(
                     "w-10 h-10 rounded-lg flex items-center justify-center transition-all border border-zinc-900/50 shadow-sm",
                     product.quantity <= 0 ? "bg-zinc-950 text-zinc-800" : "bg-brand-red/10 text-brand-red"
                   )}>
                      <Beer className="w-5 h-5" />
                   </div>
                   {product.quantity > 0 && (
                     <div className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="text-[7px] font-black text-emerald-500 uppercase leading-none">{product.quantity} UN</span>
                     </div>
                   )}
                </div>
                
                <h3 className="font-black text-[11px] uppercase tracking-tight line-clamp-2 min-h-[1.5rem] text-zinc-300 transition-colors leading-tight">{product.name}</h3>
                
                <div className="mt-auto pt-2 flex flex-col items-start">
                   <p className="text-sm md:text-base font-black text-white tabular-nums tracking-tighter">{formatCurrency(product.salePrice)}</p>
                </div>
             </motion.button>
           ))}
        </div>
      </section>

      {/* Cart side panel - Optimized */}
      <section className="lg:col-span-4 bg-[#0c0c0c] border border-zinc-900 rounded-2xl flex flex-col shadow-2xl relative min-h-[500px]">
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-black/20">
           <div className="flex items-center gap-3">
              <div className="bg-brand-red p-2.5 rounded-lg shadow-lg shadow-red-900/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter text-white leading-none">CHECKOUT</h2>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Painel de Pagamento</span>
              </div>
           </div>
           <div className="flex flex-col items-end">
             <span className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg border border-zinc-800">{cart.length}</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
           {cart.length > 0 ? (
             <AnimatePresence>
                {cart.map(item => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={item.id} 
                    className="group bg-[#121212] border border-zinc-900 p-4 rounded-xl flex flex-col gap-3 transition-all"
                  >
                     <div className="flex items-start justify-between">
                        <div className="max-w-[70%]">
                           <h4 className="text-[11px] font-black uppercase tracking-tight text-zinc-100 leading-tight mb-0.5 truncate">{item.name}</h4>
                           <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{formatCurrency(item.salePrice)}</span>
                        </div>
                        <button 
                          onClick={() => setCart(cart.filter(i => i.id !== item.id))} 
                          className="p-1.5 text-zinc-800 hover:text-brand-red transition-all"
                        >
                           <XCircle className="w-4 h-4" />
                        </button>
                     </div>
                     
                     <div className="flex items-center justify-between pt-3 border-t border-zinc-900/50">
                        <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-zinc-900">
                           <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-zinc-600 hover:text-brand-red transition-all">
                              <Minus className="w-4 h-4" />
                           </button>
                           <span className="text-sm font-black tabular-nums w-6 text-center text-white">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-zinc-600 hover:text-emerald-500 transition-all">
                              <Plus className="w-4 h-4" />
                           </button>
                        </div>
                        <span className="text-base font-black text-white tabular-nums tracking-tighter">
                          {formatCurrency(item.salePrice * item.quantity)}
                        </span>
                     </div>
                  </motion.div>
                ))}
             </AnimatePresence>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-zinc-800 opacity-20 py-16">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p className="uppercase text-[8px] font-black tracking-widest text-center">ARRASTE PRODUTOS<br/>PARA O CARRINHO</p>
             </div>
           )}
        </div>

        <div className="p-6 bg-[#121212] border-t border-zinc-900 space-y-6 shadow-2xl">
           <div className="flex justify-between items-center bg-black/40 p-5 rounded-xl border border-zinc-900">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">TOTAL FINAL</span>
              <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(total)}</span>
           </div>

           <div className="space-y-3">
              <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block text-center">PAGAMENTO</span>
              <div className="grid grid-cols-5 gap-2">
                 {[
                   { id: 'pix', icon: QrCode, label: 'PIX' },
                   { id: 'cash', icon: Banknote, label: 'DN' },
                   { id: 'card', icon: CreditCard, label: 'CR' },
                   { id: 'fiado', icon: User, label: 'FI' },
                   { id: 'delivery', icon: Truck, label: 'DL' }
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => setPaymentMethod(method.id)}
                     className={cn(
                       "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all active:scale-95",
                       paymentMethod === method.id 
                         ? "bg-brand-red/10 border-brand-red text-brand-red shadow-lg shadow-red-900/10" 
                         : "bg-black/40 border-zinc-900 text-zinc-600 hover:text-zinc-400"
                     )}
                   >
                     <method.icon className="w-4 h-4" />
                     <span className="text-[7px] font-black tracking-widest">{method.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           <button 
             disabled={cart.length === 0 || isProcessing}
             onClick={handleCheckout}
             className={cn(
               "w-full py-4 rounded-xl font-black uppercase text-base tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 border-t border-white/10",
               cart.length === 0 || isProcessing
                 ? "bg-zinc-950 text-zinc-800 cursor-not-allowed border-zinc-900" 
                 : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:bg-emerald-500"
             )}
           >
             {isProcessing ? '...' : (
               <>
                 <CheckCircle2 className="w-5 h-5" />
                 FINALIZAR
               </>
             )}
           </button>
        </div>

        {/* Success Overlay - Optimized */}
        <AnimatePresence>
           {showSuccess && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-[100] rounded-2xl"
             >
                <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/40 mb-6 border-t border-white/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter text-center leading-none mb-2">SUCESSO <span className="text-brand-red">TOTAL</span></h3>
                <p className="text-zinc-600 uppercase text-[9px] font-black tracking-widest mb-8">COMPROVANTE EMITIDO</p>
                
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 w-full text-center">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">VALOR TOTAL</p>
                   <p className="text-3xl font-black text-emerald-500">{formatCurrency(lastTotal)}</p>
                   <div className="pt-3 mt-3 border-t border-zinc-900">
                      <span className="px-3 py-1 bg-zinc-900 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-700">VIA {paymentMethod.toUpperCase()}</span>
                   </div>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </section>
    </div>
  );
}
