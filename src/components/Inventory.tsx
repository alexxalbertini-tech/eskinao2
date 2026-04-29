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
    <div className="space-y-8 max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* Header Optimized */}
      <section className="flex flex-col gap-5">
        <div className="text-left">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            MEU <span className="text-brand-red font-black">ESTOQUE</span>
          </h1>
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mt-1">CONTROLE DE ATIVOS E MERCADORIAS</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="w-full bg-brand-red hover:bg-red-600 text-white p-5 rounded-xl font-black uppercase tracking-[0.1em] text-sm transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-4 border-t border-white/10"
        >
          <Plus className="w-5 h-5" />
          CADASTRAR NOVO PRODUTO
        </button>
      </section>

      {/* Search Bar Optimized */}
      <section className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
        <input 
          type="text" 
          placeholder="PESQUISAR NO INVENTÁRIO..." 
          className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red focus:bg-zinc-900 rounded-xl py-4 pl-14 pr-6 text-white placeholder:text-zinc-700 focus:outline-none transition-all uppercase font-black text-xs tracking-tight shadow-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {/* Categories Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {['Todas', ...CATEGORIES.map(c => c.name)].map(cat => (
           <button
             key={cat}
             onClick={() => setSelectedCategory(cat)}
             className={cn(
               "px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap border transition-all active:scale-95",
               selectedCategory === cat 
                 ? "bg-brand-red/10 border-brand-red text-brand-red" 
                 : "bg-[#121212] border-zinc-800 text-zinc-600 hover:border-zinc-700"
             )}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Grid de Produtos Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => {
            const Icon = CATEGORIES.find(c => c.name === product.category)?.icon || Box;
            const isLowStock = product.quantity <= (product.alertThreshold || 5);
            
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={product.id} 
                className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 hover:border-brand-red/30 transition-all shadow-xl group flex flex-col gap-5 relative overflow-hidden"
              >
                  {isLowStock && (
                    <div className="absolute top-0 left-0 w-full bg-brand-red py-1 text-center">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white">ESTOQUE BAIXO</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-4 mt-2">
                     {/* Informações do Produto */}
                     <div className="flex items-center gap-4 flex-1 truncate">
                        <div className="bg-zinc-900 p-3 rounded-lg text-brand-red border border-zinc-800 flex-shrink-0">
                           <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5 truncate">
                           <h3 className="text-lg font-black uppercase tracking-tight text-white truncate leading-none">{product.name}</h3>
                           <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full">{product.category}</span>
                        </div>
                     </div>

                     {/* Preço de Venda */}
                     <div className="text-right">
                        <span className="text-xl font-black text-white tabular-nums tracking-tighter">
                           {formatCurrency(product.salePrice)}
                        </span>
                     </div>
                  </div>

                  {/* Stock Controls Optimized */}
                  <div className="grid grid-cols-3 items-center gap-4 bg-black/40 p-3 rounded-xl border border-zinc-900">
                     <button 
                       onClick={() => adjustStock(product.id, product.quantity, -1)}
                       className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 border border-zinc-800 shadow-lg"
                     >
                       <Minus className="w-5 h-5" />
                     </button>
                     
                     <div className="flex flex-col items-center justify-center">
                        <span className="text-[12px] font-black tabular-nums tracking-tighter text-white">
                          {product.quantity}
                        </span>
                        <span className="text-[7px] text-zinc-600 font-black uppercase">UN</span>
                     </div>

                     <button 
                       onClick={() => adjustStock(product.id, product.quantity, 1)}
                       className="bg-brand-red/90 hover:bg-brand-red text-white h-10 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-lg border-t border-white/10"
                     >
                       <Plus className="w-5 h-5" />
                     </button>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex gap-3">
                     <button 
                       onClick={() => { setEditingProduct(product); setFormData(product); setModalOpen(true); }}
                       className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-800 transition-all shadow-md"
                     >
                        <Edit3 className="w-4 h-4" />
                        EDITAR
                     </button>
                     <button 
                       onClick={() => deleteProduct(product.id)}
                       className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-rose-950/20 text-zinc-600 hover:text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-800 transition-all shadow-md"
                     >
                        <Trash2 className="w-4 h-4" />
                        REMOVER
                     </button>
                  </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Modal Optimized */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
             <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
             <motion.div 
               initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} 
               className="relative w-full max-w-lg bg-[#0f0f0f] border-t md:border border-zinc-900 rounded-t-3xl md:rounded-3xl p-6 pb-12 overflow-y-auto max-h-[92vh] shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">
                     {editingProduct ? 'EDITAR' : 'NOVO'} <span className="text-brand-red">PRODUTO</span>
                   </h2>
                   <button onClick={() => setModalOpen(false)} className="p-2 bg-zinc-900 text-zinc-500 rounded-lg transition-all border border-zinc-800">
                      <X className="w-5 h-5" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">NOME DO ITEM</span>
                      <input 
                        required type="text" placeholder="EX: HEINEKEN 600ML"
                        className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 text-white focus:outline-none uppercase font-black text-sm transition-all placeholder:text-zinc-800"
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">CATEGORIA</span>
                        <select 
                          className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 text-white focus:outline-none uppercase font-black text-[11px] appearance-none cursor-pointer"
                          value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                          {CATEGORIES.map(c => <option key={c.name} value={c.name} className="bg-black">{c.name.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">ESTOQUE INICIAL</span>
                        <input 
                          required type="number" placeholder="0"
                          className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 text-white focus:outline-none font-black text-sm"
                          value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-2">CUSTO COMPRA</span>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-700">R$</span>
                            <input 
                              required type="number" step="0.01" placeholder="0.00"
                              className="w-full bg-[#121212] border border-zinc-800 focus:border-brand-red/30 rounded-xl p-4 pl-10 text-white focus:outline-none font-black text-sm"
                              value={formData.costPrice || ''} onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <span className="text-[9px] font-black text-brand-red uppercase tracking-widest ml-2">VALOR VENDA</span>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-brand-red/50">R$</span>
                            <input 
                              required type="number" step="0.01" placeholder="0.00"
                              className="w-full bg-brand-red/5 border border-brand-red focus:border-white/50 rounded-xl p-4 pl-10 text-brand-red focus:outline-none font-black text-sm transition-all"
                              value={formData.salePrice || ''} onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="pt-4">
                      <button 
                        type="submit"
                        className="w-full bg-brand-red text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-[0.98] transition-all border-t border-white/10"
                      >
                        {editingProduct ? 'ATUALIZAR' : 'CONCLUIR'}
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
