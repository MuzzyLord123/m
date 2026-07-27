import jsPDF from 'jspdf';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  createdAt: string;
  dueDate: string | null;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number | null;
  taxRate?: number;
  totalAmount: number;
  notes: string | null;
  status: string | null;
  currency?: string;
  paidAt?: string | null;
}

interface CompanyInfo {
  name: string;
  tagline: string;
  address: string[];
  email: string;
  phone: string;
  website: string;
  vatNumber?: string;
  companyNumber?: string;
}

const COMPANY_INFO: CompanyInfo = {
  name: 'Quooro',
  tagline: 'Digital Solutions',
  address: [
    'Quooro Ltd',
    'London, United Kingdom'
  ],
  email: 'billing@quooro.com',
  phone: '+44 (0) 20 1234 5678',
  website: 'www.quooro.com',
  vatNumber: 'GB 123 4567 89',
  companyNumber: '12345678'
};

// Modern Apple-inspired color palette
const COLORS = {
  primary: '#000000',
  secondary: '#6e6e73',
  accent: '#0071e3',
  success: '#34c759',
  warning: '#ff9500',
  danger: '#ff3b30',
  background: '#ffffff',
  surface: '#f5f5f7',
  border: '#d2d2d7',
  muted: '#86868b'
};

// Premium fonts configuration
const FONTS = {
  regular: 'helvetica',
  bold: 'helvetica'
};

export const generateInvoicePDF = async (invoice: InvoiceData): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPos = margin;

  // Helper functions
  const drawLine = (y: number, width: number = contentWidth, startX: number = margin) => {
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(startX, y, startX + width, y);
  };

  const addText = (text: string, x: number, y: number, options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: string;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) => {
    const { 
      fontSize = 10, 
      fontStyle = 'normal', 
      color = COLORS.primary,
      align = 'left',
      maxWidth
    } = options;
    
    doc.setFontSize(fontSize);
    doc.setFont(FONTS.regular, fontStyle);
    doc.setTextColor(color);
    
    if (maxWidth) {
      doc.text(text, x, y, { align, maxWidth });
    } else {
      doc.text(text, x, y, { align });
    }
  };

  // ====== HEADER SECTION ======
  // Company Logo/Name with premium typography
  addText(COMPANY_INFO.name.toUpperCase(), margin, yPos + 8, {
    fontSize: 24,
    fontStyle: 'bold',
    color: COLORS.primary
  });
  
  addText(COMPANY_INFO.tagline, margin, yPos + 15, {
    fontSize: 9,
    color: COLORS.muted
  });

  // Invoice title on the right
  addText('INVOICE', pageWidth - margin, yPos + 8, {
    fontSize: 24,
    fontStyle: 'bold',
    color: COLORS.primary,
    align: 'right'
  });

  yPos += 30;
  drawLine(yPos);
  yPos += 15;

  // ====== INVOICE DETAILS SECTION ======
  const leftCol = margin;
  const rightCol = pageWidth - margin - 70;

  // Left side - Bill To
  addText('BILL TO', leftCol, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted
  });
  
  yPos += 6;
  addText(invoice.clientName, leftCol, yPos, {
    fontSize: 12,
    fontStyle: 'bold'
  });
  
  if (invoice.clientEmail) {
    yPos += 5;
    addText(invoice.clientEmail, leftCol, yPos, {
      fontSize: 9,
      color: COLORS.secondary
    });
  }
  
  if (invoice.clientAddress) {
    yPos += 5;
    addText(invoice.clientAddress, leftCol, yPos, {
      fontSize: 9,
      color: COLORS.secondary,
      maxWidth: 80
    });
  }

  // Right side - Invoice Info
  const infoStartY = yPos - 11;
  let infoY = infoStartY;
  
  // Invoice number
  addText('Invoice Number', rightCol, infoY, {
    fontSize: 8,
    color: COLORS.muted
  });
  addText(invoice.invoiceNumber, pageWidth - margin, infoY, {
    fontSize: 10,
    fontStyle: 'bold',
    align: 'right'
  });
  
  infoY += 8;
  
  // Issue date
  addText('Issue Date', rightCol, infoY, {
    fontSize: 8,
    color: COLORS.muted
  });
  addText(formatDate(invoice.createdAt), pageWidth - margin, infoY, {
    fontSize: 10,
    align: 'right'
  });
  
  infoY += 8;
  
  // Due date
  addText('Due Date', rightCol, infoY, {
    fontSize: 8,
    color: COLORS.muted
  });
  addText(invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt', pageWidth - margin, infoY, {
    fontSize: 10,
    fontStyle: 'bold',
    align: 'right'
  });

  yPos = Math.max(yPos + 20, infoY + 8);

  // ====== ITEMS TABLE ======
  drawLine(yPos);
  yPos += 8;

  // Table header
  const colWidths = {
    description: contentWidth * 0.5,
    qty: contentWidth * 0.12,
    unitPrice: contentWidth * 0.19,
    total: contentWidth * 0.19
  };

  let colX = margin;
  
  addText('DESCRIPTION', colX, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted
  });
  colX += colWidths.description;
  
  addText('QTY', colX, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted,
    align: 'center'
  });
  colX += colWidths.qty;
  
  addText('UNIT PRICE', colX + colWidths.unitPrice / 2, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted,
    align: 'center'
  });
  colX += colWidths.unitPrice;
  
  addText('AMOUNT', pageWidth - margin, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted,
    align: 'right'
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 8;

  // Table rows
  invoice.items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    colX = margin;
    
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(COLORS.surface);
      doc.rect(margin, yPos - 4, contentWidth, 10, 'F');
    }
    
    addText(item.name, colX, yPos, {
      fontSize: 10,
      maxWidth: colWidths.description - 5
    });
    colX += colWidths.description;
    
    addText(item.quantity.toString(), colX + colWidths.qty / 2, yPos, {
      fontSize: 10,
      align: 'center'
    });
    colX += colWidths.qty;
    
    addText(formatCurrency(item.price, invoice.currency), colX + colWidths.unitPrice / 2, yPos, {
      fontSize: 10,
      align: 'center'
    });
    
    addText(formatCurrency(lineTotal, invoice.currency), pageWidth - margin, yPos, {
      fontSize: 10,
      fontStyle: 'bold',
      align: 'right'
    });

    yPos += 10;
  });

  yPos += 5;
  drawLine(yPos);
  yPos += 15;

  // ====== TOTALS SECTION ======
  const totalsX = pageWidth - margin - 80;
  
  // Subtotal
  addText('Subtotal', totalsX, yPos, {
    fontSize: 10,
    color: COLORS.secondary
  });
  addText(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin, yPos, {
    fontSize: 10,
    align: 'right'
  });
  
  yPos += 8;
  
  // Tax
  if (invoice.taxAmount && invoice.taxAmount > 0) {
    const taxLabel = invoice.taxRate ? `VAT (${invoice.taxRate}%)` : 'Tax';
    addText(taxLabel, totalsX, yPos, {
      fontSize: 10,
      color: COLORS.secondary
    });
    addText(formatCurrency(invoice.taxAmount, invoice.currency), pageWidth - margin, yPos, {
      fontSize: 10,
      align: 'right'
    });
    yPos += 8;
  }

  // Total line
  drawLine(yPos, 80, totalsX);
  yPos += 10;

  // Total Due - Large and prominent
  addText('TOTAL DUE', totalsX, yPos, {
    fontSize: 11,
    fontStyle: 'bold'
  });
  addText(formatCurrency(invoice.totalAmount, invoice.currency), pageWidth - margin, yPos, {
    fontSize: 16,
    fontStyle: 'bold',
    align: 'right'
  });

  yPos += 20;

  // ====== NOTES SECTION ======
  if (invoice.notes) {
    drawLine(yPos, contentWidth, margin);
    yPos += 10;
    
    addText('NOTES', margin, yPos, {
      fontSize: 8,
      fontStyle: 'bold',
      color: COLORS.muted
    });
    yPos += 6;
    
    const splitNotes = doc.splitTextToSize(invoice.notes, contentWidth);
    addText(splitNotes.join('\n'), margin, yPos, {
      fontSize: 9,
      color: COLORS.secondary
    });
    yPos += splitNotes.length * 5 + 10;
  }

  // ====== PAYMENT SECTION ======
  yPos = Math.max(yPos, pageHeight - 70);
  
  // Payment info box
  doc.setFillColor(COLORS.surface);
  doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
  
  yPos += 8;
  addText('PAYMENT INFORMATION', margin + 8, yPos, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.muted
  });
  
  yPos += 6;
  addText('Bank Transfer: Quooro Ltd', margin + 8, yPos, {
    fontSize: 9
  });
  addText('Sort Code: 00-00-00  |  Account: 12345678', margin + 8, yPos + 5, {
    fontSize: 9,
    color: COLORS.secondary
  });
  addText('Reference: ' + invoice.invoiceNumber, margin + 8, yPos + 10, {
    fontSize: 9,
    color: COLORS.secondary
  });

  // ====== FOOTER ======
  const footerY = pageHeight - 15;
  
  drawLine(footerY - 5, contentWidth, margin);
  
  // Company details in footer
  const footerText = [
    COMPANY_INFO.address.join(' · '),
    `${COMPANY_INFO.email} · ${COMPANY_INFO.phone}`,
    COMPANY_INFO.vatNumber ? `VAT: ${COMPANY_INFO.vatNumber}` : ''
  ].filter(Boolean).join('  |  ');
  
  addText(footerText, pageWidth / 2, footerY, {
    fontSize: 7,
    color: COLORS.muted,
    align: 'center'
  });
  
  addText('Thank you for your business', pageWidth / 2, footerY + 4, {
    fontSize: 8,
    fontStyle: 'bold',
    color: COLORS.secondary,
    align: 'center'
  });

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
};

// Helper functions
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatCurrency = (amount: number, currency: string = 'GBP'): string => {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
  return `${symbol}${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusColor = (status: string | null): { bg: string; text: string } => {
  switch (status) {
    case 'paid':
      return { bg: '#d1fae5', text: '#065f46' };
    case 'pending':
      return { bg: '#fef3c7', text: '#92400e' };
    case 'overdue':
      return { bg: '#fee2e2', text: '#991b1b' };
    default:
      return { bg: '#e5e7eb', text: '#374151' };
  }
};

export default generateInvoicePDF;
