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
  Filter, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  MoreVertical,
  ChevronDown,
  Beer,
  Droplet,
  Snowflake,
  Cookie,
  Candy,
  Wine,
  GlassWater,
  Box,
  X
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

export default function Inventory({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isRestockModalOpen, setRestockModalOpen] = useState(false);
  const [restockData, setRestockData] = useState({ productId: '', quantity: 0, totalCost: 0 });
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const isAdmin = role === 'admin';

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !restockData.productId) return;

    try {
      const product = products.find(p => p.id === restockData.productId);
      const productRef = doc(db, 'produtos', restockData.productId);
      
      // Update Stock
      await updateDoc(productRef, {
        quantity: (product.quantity || 0) + restockData.quantity
      });

      // Log Expense
      await addDoc(collection(db, 'caixa'), {
        userId: businessId,
        createdBy: auth.currentUser?.uid,
        type: 'expense',
        amount: restockData.totalCost,
        description: `COMPRA: ${product.name} (x${restockData.quantity})`,
        category: 'Fornecedores',
        date: new Date().toISOString()
      });

      setRestockModalOpen(false);
      setRestockData({ productId: '', quantity: 0, totalCost: 0 });
    } catch (error) {
      console.error("Restock failed", error);
    }
  };

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
      console.error("Error saving product", error);
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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Estoque</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Catálogo de Produtos</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>
        )}
      </section>

      {/* Filters */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="PESQUISAR PRODUTO..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative group">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
           <select 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-xs font-bold tracking-widest"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
           >
              <option value="Todas">Todas Variedades</option>
              {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name.toUpperCase()}</option>)}
           </select>
           <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
        </div>
      </section>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {['Todas', ...CATEGORIES.map(c => c.name)].map(cat => (
           <button
             key={cat}
             onClick={() => setSelectedCategory(cat)}
             className={cn(
               "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
               selectedCategory === cat 
                 ? "bg-amber-500 border-amber-500 text-black" 
                 : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
             )}
           >
             {cat}
           </button>
         ))}
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={product.id} 
            className="group bg-zinc-950 border border-zinc-900 rounded-3xl p-5 hover:border-amber-500/50 transition-all shadow-xl hover:shadow-amber-500/5"
          >
             <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  product.quantity <= product.alertThreshold ? "bg-rose-500/10 text-rose-500" : "bg-zinc-900 text-amber-500"
                )}>
                   {CATEGORIES.find(c => c.name === product.category)?.icon ? 
                    (() => {
                      const Icon = CATEGORIES.find(c => c.name === product.category)!.icon;
                      return <Icon className="w-6 h-6" />;
                    })() : <Box className="w-6 h-6" />}
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingProduct(product); setFormData(product); setModalOpen(true); }}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setRestockData({ productId: product.id, quantity: 0, totalCost: 0 }); setRestockModalOpen(true); }}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-brand-gold hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
             </div>

             <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight truncate">{product.name}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{product.category}</p>
             </div>

             <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Estoque</span>
                   <span className={cn(
                     "text-xl font-black tabular-nums",
                     product.quantity <= product.alertThreshold ? "text-rose-500" : "text-white"
                   )}>
                     {product.quantity} <span className="text-xs text-zinc-600 font-medium">UN</span>
                   </span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Venda</span>
                   <span className="text-xl font-black text-amber-500 tabular-nums">
                     {formatCurrency(product.salePrice)}
                   </span>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between text-[10px] font-bold uppercase text-zinc-600">
                <span>Custo: {formatCurrency(product.costPrice)}</span>
                <span className="text-emerald-500">Lucro: {formatCurrency(product.salePrice - product.costPrice)}</span>
             </div>

             {product.quantity <= product.alertThreshold && (
               <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-rose-500 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Reposição Necessária
               </div>
             )}
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
                   <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        {editingProduct ? 'Editar' : 'Novo'} Produto
                      </h2>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Preencha os detalhes abaixo</p>
                   </div>
                   <button onClick={() => setModalOpen(false)} className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl transition-colors">
                      <ChevronDown className="w-6 h-6 rotate-180" />
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Nome do Produto</label>
                      <input 
                        required
                        type="text" 
                        placeholder="EX: HEINEKEN 330ML"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Categoria</label>
                         <select 
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold text-sm appearance-none"
                           value={formData.category}
                           onChange={(e) => setFormData({...formData, category: e.target.value})}
                         >
                           {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name.toUpperCase()}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Estoque Inicial</label>
                         <input 
                           required
                           type="number" 
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold text-sm"
                           value={formData.quantity}
                           onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Preço Custo (R$)</label>
                         <input 
                           required
                           type="number" step="0.01"
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold text-sm"
                           value={formData.costPrice}
                           onChange={(e) => setFormData({...formData, costPrice: Number(e.target.value)})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Preço Venda (R$)</label>
                         <input 
                           required
                           type="number" step="0.01"
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold text-sm text-amber-500"
                           value={formData.salePrice}
                           onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Fornecedor</label>
                        <input 
                          type="text" 
                          placeholder="EX: AMBEV"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none uppercase font-bold text-sm"
                          value={formData.supplier}
                          onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Alerta Mínimo</label>
                        <input 
                          type="number"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold text-sm"
                          value={formData.alertThreshold}
                          onChange={(e) => setFormData({...formData, alertThreshold: Number(e.target.value)})}
                        />
                      </div>
                   </div>

                   <div className="pt-6">
                      <button 
                        type="submit"
                        className="w-full bg-amber-500 text-black py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98]"
                      >
                        {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestockModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setRestockModalOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl p-8"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Entrada de Estoque</h2>
                   <button onClick={() => setRestockModalOpen(false)} className="p-2 text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleRestock} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Quantidade Comprada</label>
                      <input 
                        required
                        type="number"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold"
                        value={restockData.quantity || ''}
                        onChange={(e) => setRestockData({...restockData, quantity: Number(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Custo Total da Compra (R$)</label>
                      <input 
                        required
                        type="number" step="0.01"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold"
                        value={restockData.totalCost || ''}
                        onChange={(e) => setRestockData({...restockData, totalCost: Number(e.target.value)})}
                      />
                   </div>
                   <button 
                    type="submit"
                    className="w-full bg-brand-gold text-black py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 active:scale-95 transition-all"
                   >
                     Confirmar Entrada
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
