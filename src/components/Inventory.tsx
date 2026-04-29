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
  Minus,
  Search, 
  Edit3, 
  Trash2, 
  Beer,
  Droplet,
  Snowflake,
  Cookie,
  Candy,
  Wine,
  GlassWater,
  Box,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

const CATEGORIES = [
  { name: 'Cervejas', icon: Beer },
  { name: 'Bebidas quentes', icon: Wine },
  { name: 'Refrigerantes', icon: Droplet },
  { name: 'Gelo', icon: Snowflake },
  { name: 'Salgados / petiscos', icon: Cookie },
  { name: 'Doces', icon: Candy },
  { name: 'Sucos', icon: GlassWater },
  { name: 'Outros produtos', icon: Box },
];

export default function Inventory({ businessId }: { role?: string | null, businessId?: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Cervejas',
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    supplier: '',
    alertThreshold: 5
  });

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'produtos'), where('userId', '==', businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    const data = { 
      ...formData, 
      userId: businessId,
      updatedBy: auth.currentUser?.uid,
      updatedAt: new Date().toISOString() 
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'produtos', editingProduct.id), data);
      } else {
        await addDoc(collection(db, 'produtos'), {
          ...data,
          createdBy: auth.currentUser?.uid,
          createdAt: new Date().toISOString()
        });
      }
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Deseja realmente excluir este produto?')) {
      await deleteDoc(doc(db, 'produtos', id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: 'Cervejas', quantity: 0, costPrice: 0, salePrice: 0, supplier: '', alertThreshold: 5 });
    setEditingProduct(null);
  };

  const adjustStock = async (id: string, currentQty: number, amount: number) => {
    try {
      const productRef = doc(db, 'produtos', id);
      await updateDoc(productRef, {
        quantity: Math.max(0, currentQty + amount),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Premium */}
      <section className="flex flex-col gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
            MEU <span className="text-brand-red font-black">ESTOQUE</span>
          </h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em] mt-2">CONTROLE DE ATIVOS E MERCADORIAS</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="w-full bg-brand-red hover:bg-red-600 text-white p-10 rounded-[3rem] font-black uppercase tracking-[0.2em] text-2xl transition-all shadow-2xl shadow-red-600/30 active:scale-[0.98] flex items-center justify-center gap-6 border-t border-white/10"
        >
          <div className="bg-white/20 p-4 rounded-[2rem] shadow-inner">
            <Plus className="w-10 h-10" />
          </div>
          CADASTRAR NOVO PRODUTO
        </button>
      </section>

      {/* Search Bar Ultra Premium */}
      <section className="relative group">
        <div className="absolute inset-0 bg-brand-red/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-zinc-600 w-8 h-8 group-focus-within:text-brand-red transition-all" />
        <input 
          type="text" 
          placeholder="PESQUISAR NO INVENTÁRIO..." 
          className="w-full bg-zinc-900 border-2 border-zinc-900 focus:border-brand-red focus:bg-zinc-900 rounded-[3rem] py-10 pl-24 pr-10 text-white placeholder:text-zinc-700 focus:outline-none transition-all uppercase font-black text-xl tracking-tight shadow-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {/* Categories Filter Pills */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide py-2">
         {['Todas', ...CATEGORIES.map(c => c.name)].map(cat => (
           <button
             key={cat}
             onClick={() => setSelectedCategory(cat)}
             className={cn(
               "px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap border-2 transition-all active:scale-95",
               selectedCategory === cat 
                 ? "bg-brand-red border-brand-red text-white shadow-2xl shadow-red-600/40 translate-y-[-2px]" 
                 : "bg-zinc-900/50 border-zinc-900 text-zinc-600 hover:border-zinc-800 hover:text-zinc-400"
             )}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Grid de Produtos Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => {
            const Icon = CATEGORIES.find(c => c.name === product.category)?.icon || Box;
            const isLowStock = product.quantity <= (product.alertThreshold || 5);
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={product.id} 
                className="bg-zinc-900/40 border-2 border-zinc-900/50 rounded-[4rem] p-10 hover:border-brand-red/30 transition-all shadow-2xl group flex flex-col gap-8 relative overflow-hidden"
              >
                  {isLowStock && (
                    <div className="absolute top-0 left-0 w-full bg-brand-red py-2 text-center">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white">ALERTA DE ESTOQUE BAIXO</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
                     {/* Informações do Produto */}
                     <div className="flex items-center gap-6 flex-1 w-full sm:w-auto">
                        <div className="bg-zinc-900 p-6 rounded-[2.5rem] text-brand-red shadow-xl border border-zinc-800 flex-shrink-0 group-hover:scale-110 transition-transform">
                           <Icon className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 truncate">
                           <h3 className="text-3xl font-black uppercase tracking-tighter text-white truncate leading-none">{product.name}</h3>
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">{product.category}</span>
                              {isLowStock && <AlertCircle className="w-4 h-4 text-brand-red" />}
                           </div>
                        </div>
                     </div>

                     {/* Preço de Venda */}
                     <div className="text-center sm:text-right w-full sm:w-auto">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-1">Preço Consumidor</span>
                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                           {formatCurrency(product.salePrice)}
                        </span>
                     </div>
                  </div>

                  {/* Stock Controls - ULTRA PREMIUM BIG BUTTONS */}
                  <div className="grid grid-cols-3 items-center gap-6 bg-black/60 p-6 rounded-[3rem] border border-zinc-800 shadow-inner">
                     <button 
                       onClick={() => adjustStock(product.id, product.quantity, -1)}
                       className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white w-full aspect-square md:aspect-auto md:h-20 rounded-[2rem] flex items-center justify-center transition-all active:scale-90 border-2 border-zinc-800 shadow-xl"
                     >
                       <Minus className="w-8 h-8" />
                     </button>
                     
                     <div className="flex flex-col items-center justify-center">
                        <span className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">STOCK</span>
                        <span className={cn(
                          "text-5xl font-black tabular-nums tracking-tighter leading-none",
                          isLowStock ? "text-brand-red animate-pulse" : "text-white"
                        )}>
                          {product.quantity}
                        </span>
                     </div>

                     <button 
                       onClick={() => adjustStock(product.id, product.quantity, 1)}
                       className="bg-brand-red hover:bg-red-600 text-white w-full aspect-square md:aspect-auto md:h-20 rounded-[2rem] flex items-center justify-center transition-all active:scale-90 shadow-2xl shadow-red-600/30 border-t border-white/20"
                     >
                       <Plus className="w-8 h-8" />
                     </button>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex gap-4">
                     <button 
                       onClick={() => { setEditingProduct(product); setFormData(product); setModalOpen(true); }}
                       className="flex-1 flex items-center justify-center gap-3 py-6 bg-zinc-900 hover:bg-white hover:text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border-2 border-zinc-800 transition-all shadow-xl"
                     >
                        <Edit3 className="w-5 h-5" />
                        EDITAR
                     </button>
                     <button 
                       onClick={() => deleteProduct(product.id)}
                       className="flex-1 flex items-center justify-center gap-3 py-6 bg-zinc-900 hover:bg-brand-red hover:text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border-2 border-zinc-800 transition-all shadow-xl"
                     >
                        <Trash2 className="w-5 h-5" />
                        REMOVER
                     </button>
                  </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal Premium (iPad Style) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/98 backdrop-blur-2xl" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               className="relative w-full max-w-xl bg-zinc-950 border-t md:border border-zinc-900 rounded-t-[4rem] md:rounded-[4rem] p-12 pb-16 overflow-y-auto max-h-[95vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
             >
                <div className="flex items-center justify-between mb-12">
                   <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                     {editingProduct ? 'EDITAR' : 'NOVO'} <span className="text-brand-red">PRODUTO</span>
                   </h2>
                   <button onClick={() => setModalOpen(false)} className="p-6 bg-zinc-900 text-zinc-500 rounded-3xl hover:text-white transition-all border border-zinc-800 active:scale-90">
                      <X className="w-8 h-8" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                   <div className="space-y-4">
                      <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-4">NOME DO ITEM</span>
                      <input 
                        required type="text" placeholder="EX: HEINEKEN 600ML"
                        className="w-full bg-zinc-900/50 border-2 border-zinc-900 focus:border-brand-red/30 rounded-[2.5rem] p-8 text-white focus:outline-none uppercase font-black text-2xl transition-all placeholder:text-zinc-800"
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-4">CATEGORIA</span>
                        <div className="relative">
                          <select 
                            className="w-full bg-zinc-900 border-2 border-zinc-900 focus:border-brand-red/30 rounded-[2.5rem] p-8 text-white focus:outline-none uppercase font-black text-lg appearance-none cursor-pointer shadow-xl"
                            value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                          >
                            {CATEGORIES.map(c => <option key={c.name} value={c.name} className="bg-black">{c.name.toUpperCase()}</option>)}
                          </select>
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                             <Box className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-4">ESTOQUE INICIAL</span>
                        <input 
                          required type="number" placeholder="0"
                          className="w-full bg-zinc-900 border-2 border-zinc-900 focus:border-brand-red/30 rounded-[2.5rem] p-8 text-white focus:outline-none font-black text-2xl shadow-xl"
                          value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-4">CUSTO COMPRA</span>
                         <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-zinc-700">R$</span>
                            <input 
                              required type="number" step="0.01" placeholder="0.00"
                              className="w-full bg-zinc-900 border-2 border-zinc-900 focus:border-brand-red/30 rounded-[2.5rem] p-8 pl-14 text-white focus:outline-none font-black text-2xl shadow-xl"
                              value={formData.costPrice || ''} onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                            />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <span className="text-[11px] font-black text-brand-red uppercase tracking-[0.4em] ml-4">VALOR VENDA</span>
                         <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-brand-red/50">R$</span>
                            <input 
                              required type="number" step="0.01" placeholder="0.00"
                              className="w-full bg-brand-red/5 border-2 border-brand-red focus:border-white/50 rounded-[2.5rem] p-8 pl-14 text-brand-red focus:outline-none font-black text-3xl transition-all shadow-2xl"
                              value={formData.salePrice || ''} onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="pt-8">
                      <button 
                        type="submit"
                        className="w-full bg-brand-red text-white py-10 rounded-[3rem] font-black uppercase tracking-[0.4em] text-2xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:brightness-110 active:scale-[0.98] transition-all border-t border-white/20"
                      >
                        {editingProduct ? 'ATUALIZAR REGISTRO' : 'FINALIZAR CADASTRO'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
