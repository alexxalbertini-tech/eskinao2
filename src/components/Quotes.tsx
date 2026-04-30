import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  db, 
  auth, 
  addDoc 
} from '../lib/firebase';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Send, 
  Download,
  Search,
  ShoppingCart,
  User,
  Phone,
  MessageCircle,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Quotes({ role, businessId }: { role?: string | null, businessId?: string | null }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'usuarios', businessId, 'produtos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.error("Erro no onSnapshot de produtos (orcamentos):", err);
    });
    return () => unsubscribe();
  }, [businessId]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const total = cart.reduce((acc, item) => acc + (item.salePrice * item.quantity), 0);

  const saveQuoteToFirestore = async () => {
    if (!businessId || cart.length === 0 || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'usuarios', businessId, 'orcamentos'), {
        userId: businessId,
        clientName: clientInfo.name.trim().toUpperCase(),
        clientPhone: clientInfo.phone.trim(),
        items: cart.map(i => ({ 
          id: i.id, 
          name: i.name, 
          quantity: Number(i.quantity) || 0, 
          price: Number(i.salePrice) || 0 
        })),
        total: Number(total),
        createdBy: auth.currentUser?.uid,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Error saving quote:", err);
    }
  };

  const generatePDF = async () => {
    await saveQuoteToFirestore();
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ESKINÃO', 105, 20, { align: 'center' });
    
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text('SERV FEST 2', 105, 30, { align: 'center' });

    // Client Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('ORÇAMENTO DE BEBIDAS', 20, 60);
    doc.setFontSize(10);
    doc.text(`Cliente: ${clientInfo.name}`, 20, 70);
    doc.text(`Telefone: ${clientInfo.phone}`, 20, 75);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 80);

    // Table
    const tableData = cart.map(item => [
      item.name,
      item.category,
      item.quantity,
      formatCurrency(item.salePrice),
      formatCurrency(item.salePrice * item.quantity)
    ]);

    doc.autoTable({
      startY: 90,
      head: [['PRODUTO', 'CATEGORIA', 'QTD', 'UNIT', 'TOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [180, 0, 0] },
      margin: { top: 90 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text(`TOTAL: ${formatCurrency(total)}`, 20, finalY);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('ESKINÃO SERV FEST 2 - BEBIDAS E EVENTOS', 105, 280, { align: 'center' });
    doc.text('Orçamento válido por 3 dias.', 105, 285, { align: 'center' });

    doc.save(`orcamento_${clientInfo.name.replace(/\s+/g, '_')}.pdf`);
  };

  const sendWhatsApp = async () => {
    await saveQuoteToFirestore();
    let message = `*ORÇAMENTO - ESKINÃO SERV FEST 2*\n\n`;
    message += `*Cliente:* ${clientInfo.name}\n`;
    message += `*Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    message += `*ITENS:*\n`;
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.name}: ${formatCurrency(item.salePrice * item.quantity)}\n`;
    });
    message += `\n*TOTAL: ${formatCurrency(total)}*\n\n`;
    message += `_Atendimento Premium Eskinão 2_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/55${clientInfo.phone.replace(/\D/g,'')}?text=${encoded}`, '_blank');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 pb-24 font-sans">
      <section className="flex flex-col gap-4">
        <div className="text-left">
           <h1 className="text-2xl font-black uppercase tracking-tighter text-white">ORÇAMENTOS</h1>
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">Gerador de PDF e WhatsApp</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-3 bg-brand-red text-white p-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-xl active:scale-95 border-t border-white/10"
        >
          <Plus className="w-4 h-4" />
          NOVO ORÇAMENTO
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cart Side - Optimized */}
        <section className="bg-[#121212] border border-zinc-900 rounded-2xl p-5 shadow-lg flex flex-col min-h-[400px]">
           <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-brand-red w-5 h-5" />
               </div>
               <h2 className="text-sm font-black uppercase tracking-tighter">Itens no Orçamento</h2>
           </div>

           <div className="space-y-3 flex-1">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-800">
                     <Package className="w-12 h-12 mb-3 opacity-10" />
                     <p className="text-[9px] font-black uppercase tracking-widest leading-none">Carrinho Vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-black/20 border border-zinc-900/50 p-3 rounded-xl flex items-center justify-between group"
                    >
                       <div className="max-w-[120px]">
                          <h4 className="font-black text-xs text-white uppercase tracking-tight truncate leading-none mb-1">{item.name}</h4>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{formatCurrency(item.salePrice)}</p>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center bg-black/40 rounded-lg border border-zinc-900 p-0.5">
                             <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-white">-</button>
                             <span className="w-6 text-center font-black text-xs text-brand-red">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-zinc-600 hover:text-white">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-zinc-800 hover:text-brand-red transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
           </div>

           <div className="mt-6 pt-6 border-t border-zinc-900 space-y-5">
              <div className="grid grid-cols-1 gap-3">
                 <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                    <input 
                      type="text" placeholder="NOME DO CLIENTE" 
                      className="w-full bg-black/20 border border-zinc-900 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:border-brand-red/30 transition-all"
                      value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value.toUpperCase()})}
                    />
                 </div>
                 <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                    <input 
                      type="tel" placeholder="WHATSAPP (21999...)" 
                      className="w-full bg-black/20 border border-zinc-900 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black outline-none focus:border-brand-red/30 transition-all mb-2"
                      value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between py-2">
                 <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Total Previsto</span>
                 <span className="text-2xl font-black text-white tracking-tighter tabular-nums">{formatCurrency(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                  disabled={cart.length === 0}
                  onClick={generatePDF}
                  className="flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-900 text-zinc-400 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest hover:text-white disabled:opacity-30 transition-all active:scale-95"
                 >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                 </button>
                 <button 
                  disabled={cart.length === 0}
                  onClick={sendWhatsApp}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-[8px] tracking-widest shadow-lg shadow-emerald-900/20 disabled:opacity-30 transition-all active:scale-95"
                 >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WHATSAPP
                 </button>
              </div>
           </div>
        </section>

        {/* Product List Side - Optimized */}
        <section className="space-y-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 w-4 h-4" />
              <input 
                type="text" 
                placeholder="PESQUISAR PRODUTO..."
                className="w-full bg-[#121212] border border-zinc-900 rounded-xl py-4 pl-11 pr-4 text-[10px] font-black uppercase outline-none focus:border-brand-red/30 transition-all shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-2 gap-3">
              {filteredProducts.slice(0, 20).map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-[#121212] border border-zinc-900 p-3 rounded-xl text-left hover:border-brand-red/30 transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between min-h-[90px]"
                >
                   <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border",
                        product.quantity > 10 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {product.quantity} UN
                      </span>
                      <Plus className="w-3 h-3 text-zinc-800" />
                   </div>
                   <div>
                      <h3 className="font-black text-[11px] uppercase leading-tight mb-1 truncate text-zinc-100">{product.name}</h3>
                      <p className="text-sm font-black text-brand-red tracking-tighter">{formatCurrency(product.salePrice)}</p>
                   </div>
                   
                   <div className="absolute inset-0 bg-brand-red/5 opacity-0 active:opacity-100 transition-opacity" />
                </button>
              ))}
           </div>
        </section>
      </div>

      {/* Modal for existing quotes could be added here */}
    </div>
  );
}
