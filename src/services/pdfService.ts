import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from '../lib/utils';

export const generateQuotePDF = (data: {
  clientName: string;
  items: any[];
  total: number;
  type: 'sale' | 'rental';
  date: string;
}) => {
  const doc = new jsPDF();
  const primaryColor = [184, 134, 11]; // Gold-ish

  // Logo / Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Custom styled logo in PDF
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  
  const titleX = 105;
  const titleY = 22;
  
  doc.setTextColor(255, 0, 0); // Red
  doc.text('ESKINÃO', titleX, titleY, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(200, 200, 200); // Silver
  doc.text('SERV FEST', titleX, titleY + 8, { align: 'center' });
  
  doc.setTextColor(218, 165, 32); // Gold
  doc.text('2', titleX + 25, titleY + 8);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('GESTÃO PREMIUM DE BEBIDAS E EVENTOS', 105, 36, { align: 'center' });

  // Client Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ORÇAMENTO DE ' + (data.type === 'sale' ? 'VENDA' : 'ALUGUEL'), 20, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`CLIENTE: ${data.clientName}`, 20, 70);
  doc.text(`DATA: ${formatDate(data.date)}`, 20, 75);
  doc.text(`VALIDADE: 3 DIAS`, 20, 80);

  // Table
  autoTable(doc, {
    startY: 90,
    head: [['ITEM', 'QTD', 'VALOR UN.', 'TOTAL']],
    body: data.items.map(i => [
      i.name || i.item,
      i.quantity,
      formatCurrency(i.price || i.salePrice),
      formatCurrency((i.price || i.salePrice) * i.quantity)
    ]),
    theme: 'grid',
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Footer Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`VALOR TOTAL: ${formatCurrency(data.total)}`, 20, finalY);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Documento gerado automaticamente pelo sistema Esquinão Serve Fest 2.', 105, 285, { align: 'center' });

  // Open in new tab (PDF)
  doc.save(`orcamento_${data.clientName.replace(/\s/g, '_')}.pdf`);
};
