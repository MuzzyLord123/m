import jsPDF from "jspdf";

interface HandoverAgreementData {
  clientName?: string;
  projectName?: string;
  projectType?: string;
  date?: string;
}

export const generateHandoverAgreementPDF = (data: HandoverAgreementData = {}): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addNewPageIfNeeded = (requiredSpace: number = 30) => {
    if (y + requiredSpace > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("Project Handover Agreement", margin, y);
  y += 15;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Quooro Ltd - Complete Ownership Transfer", margin, y);
  y += 8;
  doc.text(`Date: ${data.date || new Date().toLocaleDateString()}`, margin, y);
  y += 20;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // Section 1: Parties
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("1. Parties to This Agreement", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const partiesText = [
    `Provider: Quooro Ltd (hereinafter "Quooro")`,
    `Client: ${data.clientName || "[Client Name]"} (hereinafter "Client")`,
    `Project: ${data.projectName || "[Project Name]"}`,
    `Project Type: ${data.projectType || "[Website/App/Dashboard/Custom System]"}`
  ];
  partiesText.forEach(line => {
    doc.text(line, margin, y);
    y += 6;
  });
  y += 10;

  // Section 2: Ownership Transfer
  addNewPageIfNeeded(60);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("2. Ownership Transfer", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const ownershipPoints = [
    "• Full intellectual property rights transfer upon final payment",
    "• No royalties, licensing fees, or ongoing charges for code usage",
    "• Right to modify, redistribute, or resell the delivered work",
    "• Transfer of all domain registrations to Client's account",
    "• Complete source code ownership with no restrictions",
    "• All custom designs and assets become Client property"
  ];
  ownershipPoints.forEach(point => {
    const lines = doc.splitTextToSize(point, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded();
      doc.text(line, margin, y);
      y += 6;
    });
  });
  y += 10;

  // Section 3: Deliverables
  addNewPageIfNeeded(60);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("3. Deliverables Guarantee", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const deliverablesPoints = [
    "• Complete and functional source code as per specifications",
    "• All design files in editable formats (Figma, PSD, AI where applicable)",
    "• Database schemas, migrations, and seed data where applicable",
    "• Comprehensive documentation and user guides",
    "• README files with setup instructions",
    "• Environment configuration templates"
  ];
  deliverablesPoints.forEach(point => {
    const lines = doc.splitTextToSize(point, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded();
      doc.text(line, margin, y);
      y += 6;
    });
  });
  y += 10;

  // Section 4: Handover Methods
  addNewPageIfNeeded(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("4. Handover Methods", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const methodsText = [
    "Quooro offers two secure handover methods:",
    "",
    "Option A: GitHub Repository Transfer (Recommended)",
    "• Complete repository transferred to Client's GitHub account",
    "• Full version history and all branches included",
    "• Secure, encrypted transfer via GitHub's platform",
    "",
    "Option B: Encrypted File Package",
    "• AES-256 encrypted ZIP archive",
    "• Password delivered via separate secure channel",
    "• Complete source code and all assets included"
  ];
  methodsText.forEach(line => {
    if (line.startsWith("Option")) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    const lines = doc.splitTextToSize(line, contentWidth);
    lines.forEach((splitLine: string) => {
      addNewPageIfNeeded();
      doc.text(splitLine, margin, y);
      y += 6;
    });
  });
  y += 10;

  // Section 5: Post-Handover Support
  addNewPageIfNeeded(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("5. Post-Handover Support", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const supportPoints = [
    "• 30-day bug-fix warranty for issues in delivered code",
    "• Email support for handover-related questions",
    "• One complimentary knowledge transfer session (video call)",
    "• Optional ongoing maintenance packages available upon request"
  ];
  supportPoints.forEach(point => {
    const lines = doc.splitTextToSize(point, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded();
      doc.text(line, margin, y);
      y += 6;
    });
  });
  y += 10;

  // Section 6: Confidentiality
  addNewPageIfNeeded(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("6. Confidentiality", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const confidentialityPoints = [
    "• Mutual NDA covering all project details",
    "• Secure deletion of Quooro's copies after handover (upon request)",
    "• No portfolio usage without Client's written consent",
    "• Full compliance with data protection regulations (GDPR, CCPA)"
  ];
  confidentialityPoints.forEach(point => {
    const lines = doc.splitTextToSize(point, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded();
      doc.text(line, margin, y);
      y += 6;
    });
  });
  y += 10;

  // Section 7: Security Measures
  addNewPageIfNeeded(50);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("7. Security Measures", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const securityPoints = [
    "• All file transfers use AES-256 encryption",
    "• Credentials shared via secure, time-limited links",
    "• Immediate revocation of Quooro's access upon handover completion",
    "• Complete audit trail of all access and changes provided",
    "• Security assessment summary and recommendations included"
  ];
  securityPoints.forEach(point => {
    const lines = doc.splitTextToSize(point, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded();
      doc.text(line, margin, y);
      y += 6;
    });
  });
  y += 15;

  // Signature Section
  addNewPageIfNeeded(60);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(31, 31, 31);
  doc.text("Signatures", margin, y);
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  // Provider signature
  doc.text("For Quooro Ltd:", margin, y);
  y += 20;
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.text("Signature", margin, y);
  doc.text("Date: _______________", margin + 90, y);
  y += 20;

  // Client signature
  doc.text("For Client:", margin, y);
  y += 20;
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.text("Signature", margin, y);
  doc.text("Date: _______________", margin + 90, y);
  y += 20;

  // Footer
  addNewPageIfNeeded(30);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerText = "This document was generated by Quooro Ltd. For questions, contact Support@quooro.com";
  doc.text(footerText, pageWidth / 2, 285, { align: "center" });

  // Save the PDF
  doc.save(`Quooro-Handover-Agreement-${new Date().toISOString().split('T')[0]}.pdf`);
};