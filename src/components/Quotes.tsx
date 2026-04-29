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
    const q = query(collection(db, 'produtos'), where('userId', '==', businessId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  const generatePDF = () => {
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

  const sendWhatsApp = () => {
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
    <div className="space-y-6 pb-20">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black uppercase tracking-tighter">Orçamentos</h1>
           <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">GERADOR DE PDF E WHATSAPP</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cart Side */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl flex flex-col min-h-[500px]">
           <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="text-brand-gold w-6 h-6" />
               </div>
               <h2 className="text-xl font-black uppercase tracking-tighter">Itens do Orçamento</h2>
           </div>

           <div className="space-y-4 flex-1">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                     <Package className="w-16 h-16 mb-4 opacity-10" />
                     <p className="text-xs font-black uppercase tracking-widest">Carrinho Vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between group"
                    >
                       <div>
                          <h4 className="font-bold text-sm text-white uppercase tracking-tight">{item.name}</h4>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{formatCurrency(item.salePrice)} uni</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex items-center bg-black rounded-xl border border-zinc-800 p-1">
                             <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white">-</button>
                             <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-700 hover:text-brand-red transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
           </div>

           <div className="mt-8 pt-8 border-t border-zinc-900 space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" placeholder="NOME DO CLIENTE" 
                      className="flex-1 bg-transparent border-b border-zinc-900 p-2 text-sm font-bold uppercase outline-none focus:border-brand-red transition-all"
                      value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value.toUpperCase()})}
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    <input 
                      type="tel" placeholder="TELEFONE (WHATSAPP)" 
                      className="flex-1 bg-transparent border-b border-zinc-900 p-2 text-sm font-bold outline-none focus:border-brand-red transition-all"
                      value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between py-4">
                 <span className="font-black uppercase tracking-tighter text-zinc-500">Total Previsto</span>
                 <span className="text-3xl font-black text-white">{formatCurrency(total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  disabled={cart.length === 0}
                  onClick={generatePDF}
                  className="flex items-center justify-center gap-2 bg-zinc-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-all border border-zinc-800"
                 >
                    <Download className="w-4 h-4" />
                    Exportar PDF
                 </button>
                 <button 
                  disabled={cart.length === 0}
                  onClick={sendWhatsApp}
                  className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all"
                 >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                 </button>
              </div>
           </div>
        </section>

        {/* Product List Side */}
        <section className="space-y-6">
           <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input 
                type="text" 
                placeholder="PROCURAR PRODUTO..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 pl-16 text-sm font-bold uppercase outline-none focus:border-brand-red/50 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-zinc-950 border border-zinc-900 p-4 rounded-[2rem] text-left hover:border-brand-gold/30 transition-all group relative overflow-hidden"
                >
                   <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-1 rounded-full",
                        product.quantity > 10 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        Stock: {product.quantity}
                      </span>
                      <Plus className="w-4 h-4 text-zinc-900 group-hover:text-brand-gold transition-colors" />
                   </div>
                   <h3 className="font-black text-sm uppercase leading-tight mb-2 truncate">{product.name}</h3>
                   <p className="text-lg font-black text-brand-gold">{formatCurrency(product.salePrice)}</p>
                   
                   <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
           </div>
        </section>
      </div>

      {/* Modal for existing quotes could be added here */}
    </div>
  );
}
