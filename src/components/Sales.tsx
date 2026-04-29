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
  serverTimestamp 
} from '../lib/firebase';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  User, 
  CreditCard, 
  Banknote, 
  QrCode,
  Beer,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

export default function Sales({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isProcessing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

    try {
      // 1. Create Transaction
      const transaction = {
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        type: 'sale',
        amount: total,
        description: `VENDA DE ${cart.length} ITENS`,
        category: 'Vendas',
        paymentMethod,
        date: new Date().toISOString(),
        items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.salePrice }))
      };

      if (paymentMethod === 'delivery') {
        await addDoc(collection(db, 'entregas'), {
          userId: businessId,
          createdBy: auth.currentUser?.uid,
          clientName: 'CLIENTE BALCÃO',
          clientPhone: '',
          address: 'RETIRAR NO LOCAL / PENDENTE ENDEREÇO',
          district: '',
          number: '',
          total: total,
          deliveryFee: 0,
          paymentMethod: 'pix',
          status: 'pending',
          items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.salePrice })),
          createdAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'vendas'), transaction);
      }

      // 2. Update Inventory
      for (const item of cart) {
        const productRef = doc(db, 'produtos', item.id);
        const original = products.find(p => p.id === item.id);
        await updateDoc(productRef, {
          quantity: original.quantity - item.quantity
        });
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
      {/* Product Selection */}
      <section className="lg:col-span-8 flex flex-col h-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Venda Rápida</h1>
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">BALCÃO PDV</p>
           </div>
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="BUSCAR PRODUTO..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
           {filteredProducts.map(product => (
             <button
                key={product.id}
                disabled={product.quantity <= 0}
                onClick={() => addToCart(product)}
                className={cn(
                  "flex flex-col p-4 rounded-3xl border transition-all text-left group relative overflow-hidden",
                  product.quantity <= 0 
                    ? "bg-zinc-950 border-zinc-900 grayscale opacity-50 cursor-not-allowed" 
                    : "bg-zinc-900 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800/50 active:scale-[0.98]"
                )}
             >
                <div className="mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <Beer className="w-6 h-6" />
                   </div>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                <div className="mt-4 flex flex-col">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estoque: {product.quantity}</span>
                   <span className="text-xl font-black text-white">{formatCurrency(product.salePrice)}</span>
                </div>
                {product.quantity > 0 && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Plus className="w-5 h-5 text-amber-500" />
                  </div>
                )}
             </button>
           ))}
        </div>
      </section>

      {/* Cart side panel */}
      <section className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Carrinho</h2>
           </div>
           <span className="bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase">{cart.length} Itens</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {cart.length > 0 ? (
             cart.map(item => (
               <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <div className="flex-1">
                     <h4 className="text-xs font-bold uppercase tracking-tight line-clamp-1">{item.name}</h4>
                     <p className="text-xs font-black text-amber-500 mt-1">{formatCurrency(item.salePrice)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black rounded-xl p-1 px-2 border border-zinc-800">
                     <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-amber-500">
                        <Minus className="w-4 h-4" />
                     </button>
                     <span className="text-sm font-black tabular-nums w-4 text-center">{item.quantity}</span>
                     <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-amber-500">
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             ))
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                <ShoppingCart className="w-16 h-16 opacity-10" />
                <p className="uppercase text-xs font-black tracking-[0.2em]">Carrinho Vazio</p>
             </div>
           )}
        </div>

        <div className="p-6 bg-zinc-900 border-t border-zinc-800 space-y-6">
           <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(total)}</span>
           </div>

           <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block text-center">Forma de Pagamento</span>
              <div className="grid grid-cols-4 gap-2">
                 {[
                   { id: 'pix', icon: QrCode, label: 'PIX' },
                   { id: 'cash', icon: Banknote, label: 'DN' },
                   { id: 'card', icon: CreditCard, label: 'CARTÃO' },
                   { id: 'fiado', icon: User, label: 'FIADO' },
                   { id: 'delivery', icon: Truck, label: 'ENTREGA' }
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => setPaymentMethod(method.id)}
                     className={cn(
                       "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                       paymentMethod === method.id 
                         ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105" 
                         : "bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700"
                     )}
                   >
                     <method.icon className="w-5 h-5" />
                     <span className="text-[10px] font-black">{method.label}</span>
                   </button>
                 ))}
              </div>
           </div>

           <button 
             disabled={cart.length === 0 || isProcessing}
             onClick={handleCheckout}
             className={cn(
               "w-full py-5 rounded-[2rem] font-black uppercase text-lg tracking-widest shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3",
               cart.length === 0 || isProcessing
                 ? "bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed" 
                 : "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-400"
             )}
           >
             {isProcessing ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}
           </button>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
           {showSuccess && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white p-8 z-50"
             >
                <CheckCircle2 className="w-24 h-24 mb-6 animate-bounce" />
                <h3 className="text-3xl font-black uppercase tracking-tighter text-center">Venda Realizada!</h3>
                <p className="text-emerald-100 uppercase text-xs font-bold tracking-widest mt-2">{formatCurrency(total)} • {paymentMethod.toUpperCase()}</p>
             </motion.div>
           )}
        </AnimatePresence>
      </section>
    </div>
  );
}
