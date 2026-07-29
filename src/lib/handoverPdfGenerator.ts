import jsPDF from "jspdf";

/**
 * The Quooro handover agreement, generated client-side.
 *
 * The document mirrors the /handover page one-to-one: every commitment the
 * page makes appears here as a numbered section — transfer methods, the
 * full per-project-type inventories, the six-step process with timings,
 * ownership clauses, support warranty, confidentiality and security
 * measures. The on-page preview lists these same section titles, so what
 * you see before downloading is exactly what you receive.
 */

interface HandoverAgreementData {
  clientName?: string;
  projectName?: string;
  projectType?: string;
  date?: string;
}

const EMBER: [number, number, number] = [232, 97, 60];
const INK: [number, number, number] = [31, 31, 31];
const BODY: [number, number, number] = [60, 60, 60];
const QUIET: [number, number, number] = [130, 130, 130];

export const generateHandoverAgreementPDF = (data: HandoverAgreementData = {}): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let sectionNo = 0;

  const newPageIfNeeded = (requiredSpace = 30) => {
    if (y + requiredSpace > 276) {
      doc.addPage();
      pageChrome();
      y = 28;
    }
  };

  /** Ember top rule + running footer on every page — the drafting-sheet mark. */
  const pageChrome = () => {
    doc.setFillColor(...EMBER);
    doc.rect(0, 0, pageWidth, 2.2, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...QUIET);
    doc.text("QUOORO — PROJECT HANDOVER AGREEMENT", margin, 288);
    doc.text("EST. WALES, UNITED KINGDOM · QUOORO.COM", pageWidth - margin, 288, { align: "right" });
  };

  const sectionTitle = (title: string) => {
    newPageIfNeeded(24);
    sectionNo += 1;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...EMBER);
    doc.text(String(sectionNo).padStart(2, "0"), margin, y);
    doc.setTextColor(...INK);
    doc.text(title, margin + 12, y);
    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  const paragraph = (text: string) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BODY);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of lines) {
      newPageIfNeeded(8);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 3;
  };

  const bullets = (items: string[], indent = 4) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    for (const item of items) {
      const lines = doc.splitTextToSize(item, contentWidth - indent - 4) as string[];
      newPageIfNeeded(6 + lines.length * 5);
      doc.setTextColor(...EMBER);
      doc.text("—", margin + indent - 4, y);
      doc.setTextColor(...BODY);
      lines.forEach((line, i) => {
        doc.text(line, margin + indent + 2, y);
        y += 5;
      });
      y += 1;
    }
    y += 3;
  };

  const subhead = (text: string) => {
    newPageIfNeeded(14);
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(text, margin, y);
    y += 6;
  };

  // ── Cover header ─────────────────────────────────────────────────────
  pageChrome();
  y = 26;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("QUOORO", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...QUIET);
  doc.text("The studio · 52.13° N, 3.78° W", pageWidth - margin, y, { align: "right" });
  y += 14;

  doc.setFontSize(23);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("Project Handover Agreement", margin, y);
  y += 9;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY);
  doc.text("Complete ownership transfer — everything we say we do, in writing.", margin, y);
  y += 7;
  doc.setFontSize(9.5);
  doc.setTextColor(...QUIET);
  doc.text(`Date: ${data.date || new Date().toLocaleDateString("en-GB")}`, margin, y);
  y += 12;

  // ── 01 Parties ───────────────────────────────────────────────────────
  sectionTitle("Parties to This Agreement");
  bullets([
    `Provider: Quooro (hereinafter "Quooro")`,
    `Client: ${data.clientName || "[Client name]"} (hereinafter "Client")`,
    `Project: ${data.projectName || "[Project name]"}`,
    `Project type: ${data.projectType || "[Website / Web application / Dashboard / Custom system]"}`,
  ]);

  // ── 02 Ownership Transfer ────────────────────────────────────────────
  sectionTitle("Ownership Transfer");
  paragraph("Upon final payment, complete ownership of the delivered work transfers to the Client:");
  bullets([
    "Full intellectual property rights transfer upon final payment",
    "No royalties, licensing fees, or ongoing charges for code usage",
    "Right to modify, redistribute, or resell the delivered work",
    "Transfer of all domain registrations to the Client's account",
    "No vendor lock-in: the project may be maintained by any developer, agency, or in-house team",
    "Third-party and open-source licences used in the project are clearly documented",
  ]);

  // ── 03 Deliverables Guarantee ────────────────────────────────────────
  sectionTitle("Deliverables Guarantee");
  bullets([
    "Complete and functional source code as per the agreed specifications",
    "All design files in editable formats (Figma, PSD, AI where applicable)",
    "Database schemas, migrations, and seed data where applicable",
    "Comprehensive documentation and user guides",
  ]);

  // ── 04 Handover Methods ──────────────────────────────────────────────
  sectionTitle("Handover Methods");
  subhead("Method A — GitHub repository transfer (recommended)");
  bullets([
    "Complete version control history preserved",
    "All branches and commits transferred to the Client's GitHub account",
    "Secure encrypted transfer via GitHub",
    "Immediate access to all project files",
    "Documentation and README included",
    "CI/CD workflows included where applicable",
  ]);
  subhead("Method B — Encrypted file package");
  bullets([
    "AES-256 encrypted ZIP archive",
    "Password delivered separately from the archive",
    "Complete source code, assets and media files included",
    "Database exports where applicable",
    "Deployment documentation included",
  ]);

  // ── 05 What Transfers, by Project Type ───────────────────────────────
  sectionTitle("What Transfers, by Project Type");
  subhead("Websites (marketing sites, landing pages, corporate sites)");
  bullets([
    "Complete source code (HTML/CSS/JS or React)",
    "All design assets (images, fonts, icons)",
    "Content management setup documentation",
    "SEO configuration files (robots.txt, sitemap)",
    "SSL certificate details",
    "Hosting credentials and access",
    "Domain transfer assistance",
    "Analytics access (GA4, etc.)",
  ]);
  subhead("Web applications (custom dashboards, portals, PWAs)");
  bullets([
    "Full application source code — frontend and backend codebases",
    "API documentation",
    "Environment configuration files",
    "Database schema and migrations",
    "Authentication system documentation",
    "Third-party integration keys",
    "Deployment scripts and CI/CD",
  ]);
  subhead("Dashboards & admin panels (CRM, inventory, reporting)");
  bullets([
    "Complete dashboard source code",
    "Database exports and schema",
    "User role configurations",
    "Report templates and queries",
    "Integration credentials",
    "Admin documentation and backup procedures",
    "Security audit report",
  ]);
  subhead("Custom systems (booking, e-commerce, API platforms)");
  bullets([
    "Full system architecture documentation",
    "All microservices source code",
    "API specifications (OpenAPI/Swagger)",
    "Database instances or exports",
    "Message queue and load balancer configurations",
    "Monitoring dashboards access",
    "Incident response procedures",
  ]);

  // ── 06 The Transfer Process ──────────────────────────────────────────
  sectionTitle("The Transfer Process");
  paragraph("Handover follows six steps, typically completed within 5–7 business days of final payment and sign-off:");
  bullets([
    "Step 1 — Project completion sign-off (1–2 days): final review meeting; both parties sign off on completion",
    "Step 2 — Documentation package (2–3 days): technical specs, admin guides, and maintenance procedures",
    "Step 3 — Credentials & access transfer (1 day): all credentials, API keys and service access via encrypted channels",
    "Step 4 — Repository transfer (same day): GitHub transfer or encrypted delivery; full control of all source code",
    "Step 5 — Knowledge transfer session (1–2 hours): live walkthrough of architecture, codebase and maintenance",
    "Step 6 — Support transition (30 days): post-handover support period as the Client takes ownership",
  ]);

  // ── 07 Post-Handover Support ─────────────────────────────────────────
  sectionTitle("Post-Handover Support");
  bullets([
    "30-day bug-fix warranty for issues in the delivered code",
    "Email support for handover-related questions",
    "One free knowledge transfer session (video call)",
    "Issues arising from changes made by the Client after handover are excluded from warranty, but assistance is available at standard rates",
    "Optional ongoing maintenance packages available",
  ]);

  // ── 08 Confidentiality ───────────────────────────────────────────────
  sectionTitle("Confidentiality");
  bullets([
    "Mutual NDA covering all project details",
    "Secure deletion of Quooro's copies after handover, on request",
    "No portfolio usage without written consent",
    "Compliance with data protection regulations (UK GDPR)",
  ]);

  // ── 09 Security Measures ─────────────────────────────────────────────
  sectionTitle("Security Measures");
  bullets([
    "Encrypted transfers: all file transfers use AES-256; credentials shared via secure, time-limited links",
    "Access revocation: Quooro's access to all systems is revoked immediately upon handover completion",
    "Audit trail: a complete log of access and changes made during the project, for the Client's records",
    "Vulnerability report: security assessment summary and recommendations for ongoing maintenance",
  ]);

  // ── Signatures ───────────────────────────────────────────────────────
  newPageIfNeeded(70);
  sectionTitle("Signatures");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY);

  doc.text("For Quooro:", margin, y);
  y += 16;
  doc.setDrawColor(160, 160, 160);
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.text("Signature", margin, y);
  doc.text("Date: _______________", margin + 90, y);
  y += 16;

  doc.text("For the Client:", margin, y);
  y += 16;
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.text("Signature", margin, y);
  doc.text("Date: _______________", margin + 90, y);

  doc.save(`Quooro-Handover-Agreement-${new Date().toISOString().split("T")[0]}.pdf`);
};

/** The document's contents, exported so the on-page preview mirrors it exactly. */
export const HANDOVER_AGREEMENT_SECTIONS = [
  "Parties to This Agreement",
  "Ownership Transfer",
  "Deliverables Guarantee",
  "Handover Methods",
  "What Transfers, by Project Type",
  "The Transfer Process",
  "Post-Handover Support",
  "Confidentiality",
  "Security Measures",
] as const;
