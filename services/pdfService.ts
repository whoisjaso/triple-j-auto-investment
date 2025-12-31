import jsPDF from 'jspdf';
import { BillOfSaleData } from '../types';

// --- BRAND CONSTANTS ---
const PAGE_WIDTH = 215.9; // Letter Width (mm)
const PAGE_HEIGHT = 279.4; // Letter Height (mm)
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Triple J Brand Colors (RGB)
const C_DARK = [6, 44, 32];    // #062C20 (Deep Hunter Green)
const C_GOLD = [197, 160, 89]; // #C5A059 (Metallic Gold)
const C_WHITE = [255, 255, 255];
const C_GRAY = [240, 240, 240];

// --- UTILS ---

const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

// Convert ISO date (YYYY-MM-DD) to US format (MM/DD/YYYY)
const formatDateUS = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate; // Return as-is if not ISO format
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
};

// --- DRAWING PRIMITIVES ---

const drawSecurityBackground = (doc: jsPDF) => {
    // Guilloche-inspired background mesh
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.05);
    const step = 4;

    // Cross-hatch pattern
    for (let i = -PAGE_HEIGHT; i < PAGE_WIDTH + PAGE_HEIGHT; i += step) {
        doc.line(i, 0, i + PAGE_HEIGHT, PAGE_HEIGHT); // Diagonal down
        doc.line(i, PAGE_HEIGHT, i + PAGE_HEIGHT, 0); // Diagonal up
    }

    // Central Watermark
    doc.saveGraphicsState();
    doc.setTextColor(245, 245, 245);
    doc.setFont("times", "bold");
    doc.setFontSize(60);
    doc.text("OFFICIAL DOCUMENT", PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center', angle: 45, renderingMode: 'fill' });
    doc.restoreGraphicsState();

    // Border Frame
    doc.setDrawColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, PAGE_WIDTH - 10, PAGE_HEIGHT - 10);
    doc.setLineWidth(0.1);
    doc.rect(6, 6, PAGE_WIDTH - 12, PAGE_HEIGHT - 12);
};

const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
    const h = 35;
    // Header Block
    doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, h, 'F');

    // Gold Accent
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, MARGIN + h, PAGE_WIDTH - MARGIN, MARGIN + h);

    // Company Info (Left)
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text("TRIPLE J AUTO", MARGIN + 5, MARGIN + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setCharSpace(2);
    doc.text("INVESTMENT GRADE AUTOMOBILES", MARGIN + 5, MARGIN + 18);
    doc.text("HOUSTON, TEXAS • EST. MMXXIV", MARGIN + 5, MARGIN + 22);
    doc.setCharSpace(0);

    // Document Title (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text(title.toUpperCase(), PAGE_WIDTH - MARGIN - 5, MARGIN + 12, { align: "right" });

    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(subtitle, PAGE_WIDTH - MARGIN - 5, MARGIN + 18, { align: "right" });

    return MARGIN + h + 8;
};

const drawSection = (doc: jsPDF, label: string, y: number) => {
    doc.setFillColor(C_GRAY[0], C_GRAY[1], C_GRAY[2]);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');

    doc.setDrawColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    doc.line(MARGIN, y + 6, PAGE_WIDTH - MARGIN, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(label.toUpperCase(), MARGIN + 2, y + 4.2);

    return y + 8;
};

const drawDataBox = (doc: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number, options: { mono?: boolean, align?: 'left'|'center'|'right' } = {}) => {
    // Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(x, y, w, h);

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(120, 120, 120);
    doc.text(label.toUpperCase(), x + 1.5, y + 2.5);

    // Value
    doc.setFont(options.mono ? "courier" : "times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const valX = options.align === 'center' ? x + (w/2) : options.align === 'right' ? x + w - 2 : x + 2;
    const align = options.align || 'left';

    // Truncate
    let displayVal = value || "";
    if (doc.getTextWidth(displayVal) > w - 4) {
        displayVal = doc.splitTextToSize(displayVal, w - 4)[0] + "...";
    }

    doc.text(displayVal, valX, y + h - 2.5, { align });
};

const drawFooter = (doc: jsPDF) => {
    const y = PAGE_HEIGHT - 12;
    doc.setDrawColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text("TRIPLE J AUTO INVESTMENT LLC", MARGIN, y + 4);

    doc.setFont("helvetica", "normal");
    doc.text("8774 ALMEDA GENOA RD, HOUSTON, TX 77075", MARGIN, y + 7);

    doc.text("PAGE 1 OF 1", PAGE_WIDTH - MARGIN, y + 4, { align: "right" });
    doc.text(`GEN: ${new Date().toISOString().split('T')[0]}`, PAGE_WIDTH - MARGIN, y + 7, { align: "right" });
};

// --- PDF GENERATORS ---

export const generateBillOfSalePDF = (data: BillOfSaleData) => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    drawSecurityBackground(doc);

    const isSpanish = data.printLanguage === 'ES';
    let y = drawHeader(doc,
        isSpanish ? "FACTURA DE VENTA DE VEHÍCULO" : "VEHICLE BILL OF SALE",
        isSpanish ? "TRANSFERENCIA DE PROPIEDAD" : "TRANSFER OF OWNERSHIP DOCUMENT"
    );

    // 1. TRANSACTION DETAILS
    y = drawSection(doc, isSpanish ? "DETALLES DE LA TRANSACCIÓN" : "TRANSACTION DETAILS", y);
    const colW = CONTENT_WIDTH / 2;

    // Seller Info
    drawDataBox(doc, isSpanish ? "VENDEDOR" : "SELLER", data.sellerName, MARGIN, y, colW, 10);
    drawDataBox(doc, isSpanish ? "DIRECCIÓN DEL VENDEDOR" : "SELLER ADDRESS", data.sellerAddress, MARGIN, y + 10, colW, 10);

    // Buyer Info
    drawDataBox(doc, isSpanish ? "COMPRADOR" : "BUYER", data.buyerName, MARGIN + colW, y, colW, 10);
    drawDataBox(doc, isSpanish ? "DIRECCIÓN DEL COMPRADOR" : "BUYER ADDRESS", data.buyerAddress, MARGIN + colW, y + 10, colW, 10);
    y += 24;

    // 2. VEHICLE DESCRIPTION
    y = drawSection(doc, isSpanish ? "DESCRIPCIÓN DEL VEHÍCULO" : "VEHICLE DESCRIPTION", y);
    const w1 = CONTENT_WIDTH * 0.15;
    const w2 = CONTENT_WIDTH * 0.20;
    const w3 = CONTENT_WIDTH * 0.35;
    const w4 = CONTENT_WIDTH * 0.30;

    drawDataBox(doc, isSpanish ? "AÑO" : "YEAR", data.year, MARGIN, y, w1, 10, { align: 'center' });
    drawDataBox(doc, isSpanish ? "MARCA" : "MAKE", data.make, MARGIN + w1, y, w2, 10);
    drawDataBox(doc, isSpanish ? "MODELO" : "MODEL", data.model, MARGIN + w1 + w2, y, w3, 10);
    drawDataBox(doc, isSpanish ? "ESTILO" : "BODY STYLE", data.bodyStyle, MARGIN + w1 + w2 + w3, y, w4, 10);
    y += 10;

    // VIN Row
    drawDataBox(doc, "VEHICLE IDENTIFICATION NUMBER (VIN)", data.vin, MARGIN, y, CONTENT_WIDTH * 0.7, 10, { mono: true });
    drawDataBox(doc, isSpanish ? "PLACA" : "LICENSE PLATE", data.licensePlate, MARGIN + (CONTENT_WIDTH * 0.7), y, CONTENT_WIDTH * 0.3, 10, { mono: true, align: 'center' });
    y += 10;

    // Details Row
    const wThird = CONTENT_WIDTH / 3;
    drawDataBox(doc, isSpanish ? "COLOR (EXT/INT)" : "COLOR (EXT/INT)", `${data.exteriorColor} / ${data.interiorColor}`, MARGIN, y, wThird, 10);
    drawDataBox(doc, isSpanish ? "PESO VACÍO" : "EMPTY WEIGHT (LBS)", data.emptyWeight, MARGIN + wThird, y, wThird, 10);
    drawDataBox(doc, isSpanish ? "FECHA DE VENTA" : "DATE OF SALE", data.date, MARGIN + (wThird * 2), y, wThird, 10, { align: 'center' });
    y += 14;

    // 3. ODOMETER DISCLOSURE
    y = drawSection(doc, isSpanish ? "DECLARACIÓN DEL ODÓMETRO (REQUERIDO POR LEY FEDERAL)" : "ODOMETER DISCLOSURE STATEMENT (FEDERAL REQUIREMENT)", y);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const odoText = isSpanish
        ? `Yo, el vendedor, certifico a mi leal saber y entender que la lectura del odómetro de ${data.odometer} millas refleja el kilometraje real del vehículo descrito anteriormente, a menos que se indique una de las siguientes excepciones:`
        : `I, the Seller, certify to the best of my knowledge that the odometer reading of ${data.odometer} miles reflects the actual mileage of the vehicle described above, unless one of the following is checked:`;

    doc.text(doc.splitTextToSize(odoText, CONTENT_WIDTH), MARGIN, y + 4);
    y += 12;

    // Odo Checkboxes
    doc.rect(MARGIN, y, 4, 4);
    doc.text(isSpanish ? "1. El kilometraje excede los límites mecánicos." : "1. Mileage exceeds mechanical limits.", MARGIN + 6, y + 3);

    doc.rect(MARGIN + (CONTENT_WIDTH/2), y, 4, 4);
    doc.text(isSpanish ? "2. La lectura NO es el kilometraje real (ADVERTENCIA)." : "2. Reading is NOT the actual mileage (WARNING).", MARGIN + (CONTENT_WIDTH/2) + 6, y + 3);
    y += 10;

    // 4. PRICE & CONSIDERATION
    y = drawSection(doc, isSpanish ? "PRECIO DE COMPRA Y ACUERDO" : "PURCHASE PRICE & AGREEMENT", y);

    // Price Box - Prominent
    doc.setFillColor(250, 250, 250);
    doc.rect(PAGE_WIDTH - MARGIN - 60, y + 2, 60, 20, 'F');
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(0.5);
    doc.rect(PAGE_WIDTH - MARGIN - 60, y + 2, 60, 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.text(isSpanish ? "MONTO TOTAL DE VENTA" : "TOTAL SALE AMOUNT", PAGE_WIDTH - MARGIN - 30, y + 8, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.text(formatCurrency(data.amount), PAGE_WIDTH - MARGIN - 30, y + 18, { align: "center" });

    // Terms Text
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const terms = isSpanish
        ? "El Comprador paga el monto total indicado anteriormente en pago total del vehículo. El Vendedor transfiere la propiedad libre de gravámenes."
        : "The Buyer pays the total amount stated above in full payment for the vehicle. The Seller transfers ownership free of all liens and encumbrances.";
    doc.text(doc.splitTextToSize(terms, CONTENT_WIDTH - 65), MARGIN, y + 6);

    // As-Is Clause
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(isSpanish ? "CONDICIÓN: COMO ESTÁ (AS-IS)" : "CONDITION: AS-IS", MARGIN, y + 20);
    doc.setFont("times", "italic");
    doc.text(isSpanish ? "El Comprador acepta el vehículo 'COMO ESTÁ', sin garantía." : "The Buyer accepts the vehicle 'AS-IS', with no warranty expressed or implied.", MARGIN, y + 24);

    y += 30;

    // 5. CERTIFICATION & SIGNATURES
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.text(isSpanish ? "CERTIFICACIÓN DEL COMPRADOR Y VENDEDOR:" : "CERTIFICATION OF BUYER AND SELLER:", MARGIN, y);
    y += 5;
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    const certText = isSpanish
        ? "Los abajo firmantes certifican bajo pena de perjurio que la información contenida en este documento es verdadera y correcta a su leal saber y entender."
        : "The undersigned hereby certify under penalty of perjury that the information contained in this document is true and correct to the best of their knowledge.";
    doc.text(doc.splitTextToSize(certText, CONTENT_WIDTH), MARGIN, y);
    y += 15;

    // Signature Lines
    const sigW = (CONTENT_WIDTH - 10) / 2;

    // Seller Sig
    doc.line(MARGIN, y + 15, MARGIN + sigW, y + 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(isSpanish ? "FIRMA DEL VENDEDOR (REP. AUTORIZADO)" : "SELLER SIGNATURE (AUTHORIZED REP)", MARGIN, y + 20);
    doc.setFont("times", "normal");
    doc.text("Triple J Auto Investment LLC", MARGIN, y + 24);

    // Buyer Sig
    doc.line(MARGIN + sigW + 10, y + 15, PAGE_WIDTH - MARGIN, y + 15);
    doc.setFont("helvetica", "bold");
    doc.text(isSpanish ? "FIRMA DEL COMPRADOR" : "BUYER SIGNATURE", MARGIN + sigW + 10, y + 20);
    doc.setFont("times", "normal");
    doc.text("X", MARGIN + sigW + 10, y + 12); // X mark

    drawFooter(doc);
    const safeName = (data.buyerName || "Client").replace(/[^a-z0-9]/gi, '_');
    doc.save(`TripleJ_BOS_${safeName}.pdf`);
};

export const generateAsIsPDF = (data: BillOfSaleData) => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    drawSecurityBackground(doc);

    const isSpanish = data.printLanguage === 'ES';

    let y = drawHeader(doc,
        isSpanish ? "ACUSE DE RECIBO DEL COMPRADOR" : "BUYER ACKNOWLEDGMENT",
        isSpanish ? "VENTA DE VEHÍCULO COMO ESTÁ" : "AS-IS VEHICLE SALE"
    );

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    const buyerName = data.buyerName ? data.buyerName : "______________________________________";

    const paragraphs = [
        isSpanish
            ? `Yo, ${buyerName} (Nombre del Comprador),\nreconozco que estoy comprando el vehículo descrito a continuación de Triple J Auto Investments LLC en condición COMO ESTÁ.`
            : `I, ${buyerName} (Buyer's Name),\nacknowledge that I am purchasing the vehicle described below from Triple J Auto Investments LLC in AS-IS condition.`,

        isSpanish
            ? "Entiendo que el vehículo se vende sin ninguna garantía, ya sea expresa o implícita. El concesionario no ofrece garantías sobre la condición, el rendimiento o la confiabilidad del vehículo."
            : "I understand that the vehicle is being sold without any warranty, whether expressed or implied. The dealer makes no guarantees about the condition, performance, or reliability of the vehicle.",

        isSpanish
            ? "He tenido la oportunidad de inspeccionar y probar el vehículo a mi satisfacción. Acepto toda la responsabilidad por cualquier reparación o mantenimiento necesario después de la compra."
            : "I have had the opportunity to inspect and test drive the vehicle to my satisfaction. I accept full responsibility for any repairs or maintenance needed after the purchase.",

        isSpanish
            ? "Acepto que Triple J Auto Investments LLC no es responsable de ningún defecto, daño o problema mecánico descubierto después de la venta, y que no se otorgarán reembolsos ni cambios."
            : "I agree that Triple J Auto Investments LLC is not responsible for any defects, damages, or mechanical issues discovered after the sale, and that no refunds or exchanges will be given."
    ];

    paragraphs.forEach((text) => {
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
        doc.text(lines, MARGIN, y);
        y += (lines.length * 5) + 6;
    });

    y += 10;

    // Signatures
    const drawSignatureRow = (label1: string, label2: string, yPos: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        // Left Side (Signature)
        doc.text(label1, MARGIN, yPos);
        const l1w = doc.getTextWidth(label1);
        doc.setLineWidth(0.1);
        doc.line(MARGIN + l1w + 2, yPos, MARGIN + 110, yPos);

        // Right Side (Date)
        doc.text(label2, MARGIN + 115, yPos);
        const l2w = doc.getTextWidth(label2);
        doc.line(MARGIN + 115 + l2w + 2, yPos, PAGE_WIDTH - MARGIN, yPos);
    };

    drawSignatureRow(
        isSpanish ? "Firma del Comprador:" : "Buyer Signature:",
        isSpanish ? "Fecha:" : "Date:",
        y
    );
    y += 15;

    drawSignatureRow(
        isSpanish ? "Representante de Ventas:" : "Sales Representative:",
        isSpanish ? "Fecha:" : "Date:",
        y
    );

    y += 20;

    // Vehicle Description
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(isSpanish ? "Descripción del Vehículo:" : "Vehicle Description:", MARGIN, y);
    y += 8;

    // Precise Helper for underlined fields
    const drawUnderlinedField = (label: string, value: string, x: number, width: number) => {
         doc.setFont("helvetica", "bold");
         doc.text(label, x, y);
         const labelW = doc.getTextWidth(label);

         const valX = x + labelW + 2;
         const lineLen = width - labelW - 4; // approximate available space for line

         if (value) {
             doc.setFont("courier", "bold");
             doc.text(value, valX, y);
         } else {
             doc.setLineWidth(0.1);
             doc.line(valX, y, valX + lineLen, y);
         }
         return x + width; // return next X position
    };

    // Row 1: Year (small), Make (medium), Model (medium)
    let curX = MARGIN;
    curX = drawUnderlinedField(isSpanish ? "Año:" : "Year:", data.year, curX, 40);
    curX = drawUnderlinedField(isSpanish ? "Marca:" : "Make:", data.make, curX + 5, 70);
    curX = drawUnderlinedField(isSpanish ? "Modelo:" : "Model:", data.model, curX + 5, 70);

    y += 10;

    // Row 2: VIN (long), Mileage (short)
    curX = MARGIN;
    curX = drawUnderlinedField("VIN:", data.vin, curX, 100);
    curX = drawUnderlinedField(isSpanish ? "Millaje:" : "Mileage:", data.odometer, curX + 10, 60);

    drawFooter(doc);
    doc.save("TripleJ_AsIs_Acknowledgment.pdf");
};

export const generateRegistrationGuidePDF = (data: BillOfSaleData) => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    drawSecurityBackground(doc);

    let y = drawHeader(doc, "REGISTRATION PROTOCOL", "BUYER INSTRUCTIONS");

    const drawStep = (num: string, title: string, desc: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
        doc.text(num, MARGIN, y + 5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(C_DARK[0], C_DARK[1], C_DARK[2]);
        doc.text(title.toUpperCase(), MARGIN + 12, y + 5);

        y += 10;
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(desc, CONTENT_WIDTH - 12);
        doc.text(lines, MARGIN + 12, y);
        y += (lines.length * 5) + 8;
    };

    y = drawSection(doc, "CRITICAL NEXT STEPS FOR REGISTRATION", y);
    y += 5;

    drawStep("01", "Vehicle Inspection", "Before attempting registration, take the vehicle to a certified Texas State Inspection station. You must receive a passing Vehicle Inspection Report (VIR). Ensure they verify the VIN exactly as it appears on your documents.");

    drawStep("02", "Automotive Insurance", "Secure a valid insurance policy for this specific vehicle (VIN must match). The policy must meet minimum state liability requirements. Bring the physical or digital proof of insurance card.");

    drawStep("03", "County Tax Office", "Proceed to your local County Tax Assessor-Collector's office. You do not need to go to the DMV; registration is handled at the county level.");

    y += 5;
    y = drawSection(doc, "DOCUMENT MANIFEST", y);
    y += 5;

    const items = [
        "Vehicle Title (Signed by Seller & Buyer on back)",
        "Form 130-U (Application for Texas Title)",
        "Bill of Sale (Provided)",
        "Proof of Inspection (VIR)",
        "Proof of Insurance",
        "Valid Photo ID"
    ];

    items.forEach(item => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.rect(MARGIN + 12, y - 4, 4, 4); // Checkbox
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(item, MARGIN + 22, y);
        y += 8;
    });

    // Important Note Box
    y += 10;
    doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DEADLINE WARNING", MARGIN + 5, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("You must transfer the title and register the vehicle within 30 days of the date of sale to avoid financial penalties. The vehicle may not be driven legally on public roads without a temporary permit or valid metal plates.", MARGIN + 5, y + 14, { maxWidth: CONTENT_WIDTH - 10 });

    drawFooter(doc);
    doc.save("TripleJ_Registration_Guide.pdf");
};

// --- FORM 130-U (Texas Title/Registration Application) ---

export const generateForm130U = (data: BillOfSaleData) => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });

    // Light gray background for form appearance
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

    // Header - Texas DMV Style
    doc.setFillColor(0, 51, 102); // Dark blue header
    doc.rect(0, 0, PAGE_WIDTH, 25, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("APPLICATION FOR TEXAS TITLE AND/OR REGISTRATION", PAGE_WIDTH / 2, 10, { align: 'center' });

    doc.setFontSize(12);
    doc.text("FORM 130-U", PAGE_WIDTH / 2, 18, { align: 'center' });

    // Subtitle
    doc.setFillColor(220, 220, 220);
    doc.rect(0, 25, PAGE_WIDTH, 8, 'F');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("PRE-FILLED FOR YOUR CONVENIENCE • VERIFY ALL INFORMATION BEFORE SUBMITTING TO COUNTY TAX OFFICE", PAGE_WIDTH / 2, 30, { align: 'center' });

    let y = 40;

    // Form field helper
    const drawFormField = (label: string, value: string, x: number, yPos: number, width: number, height: number = 12) => {
        // Field box
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(x, yPos, width, height, 'FD');

        // Label (top of box)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(label.toUpperCase(), x + 1.5, yPos + 3);

        // Value (in box)
        doc.setFont("courier", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Truncate if needed
        let displayVal = value || "";
        const maxWidth = width - 3;
        while (doc.getTextWidth(displayVal) > maxWidth && displayVal.length > 0) {
            displayVal = displayVal.slice(0, -1);
        }
        doc.text(displayVal, x + 2, yPos + height - 3);
    };

    // Section 1: VEHICLE INFORMATION
    doc.setFillColor(0, 51, 102);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION 1: VEHICLE INFORMATION", MARGIN + 3, y + 4);
    y += 8;

    // Row 1: VIN (full width)
    drawFormField("Vehicle Identification Number (VIN)", data.vin, MARGIN, y, CONTENT_WIDTH);
    y += 14;

    // Row 2: Year, Make, Model, Body Style
    const w4 = (CONTENT_WIDTH - 6) / 4;
    drawFormField("Year", data.year, MARGIN, y, w4);
    drawFormField("Make", data.make, MARGIN + w4 + 2, y, w4);
    drawFormField("Model", data.model, MARGIN + (w4 + 2) * 2, y, w4);
    drawFormField("Body Style", data.bodyStyle || "4D", MARGIN + (w4 + 2) * 3, y, w4);
    y += 14;

    // Row 3: Colors, License Plate
    const w3 = (CONTENT_WIDTH - 4) / 3;
    drawFormField("Major Color", data.exteriorColor || "N/A", MARGIN, y, w3);
    drawFormField("Minor Color", data.interiorColor || "N/A", MARGIN + w3 + 2, y, w3);
    drawFormField("Texas License Plate No.", data.licensePlate || "", MARGIN + (w3 + 2) * 2, y, w3);
    y += 14;

    // Row 4: Odometer, Empty Weight
    const w2 = (CONTENT_WIDTH - 2) / 2;
    drawFormField("Odometer Reading (No Tenths)", data.odometer, MARGIN, y, w2);
    drawFormField("Empty Weight (lbs)", data.emptyWeight || "", MARGIN + w2 + 2, y, w2);
    y += 18;

    // Section 2: APPLICANT/NEW OWNER INFORMATION
    doc.setFillColor(0, 51, 102);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION 2: APPLICANT / NEW OWNER INFORMATION", MARGIN + 3, y + 4);
    y += 8;

    // Applicant Type checkboxes
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text("Applicant Type:", MARGIN, y + 3);

    const types = ["Individual", "Business", "Government", "Trust", "Non-Profit"];
    let checkX = MARGIN + 25;
    types.forEach((type, i) => {
        doc.rect(checkX, y, 3, 3);
        if (i === 0) { // Default to Individual
            doc.setFillColor(0, 0, 0);
            doc.rect(checkX + 0.5, y + 0.5, 2, 2, 'F');
        }
        doc.text(type, checkX + 4, y + 2.5);
        checkX += 30;
    });
    y += 8;

    // Owner Name
    drawFormField("Applicant's/Owner's Legal Name (Last, First, Middle or Business Name)", data.buyerName, MARGIN, y, CONTENT_WIDTH, 14);
    y += 16;

    // Owner Address
    drawFormField("Mailing Address (Street, City, State, ZIP)", data.buyerAddress, MARGIN, y, CONTENT_WIDTH, 14);
    y += 20;

    // Section 3: SELLER INFORMATION
    doc.setFillColor(0, 51, 102);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION 3: SELLER INFORMATION", MARGIN + 3, y + 4);
    y += 8;

    // Seller Name and Address
    drawFormField("Seller's Name (Dealer or Individual)", data.sellerName, MARGIN, y, w2);
    drawFormField("Dealer License Number", "P171632", MARGIN + w2 + 2, y, w2);
    y += 14;

    drawFormField("Seller's Address", data.sellerAddress, MARGIN, y, CONTENT_WIDTH, 14);
    y += 20;

    // Section 4: SALE INFORMATION
    doc.setFillColor(0, 51, 102);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION 4: SALE / TRANSACTION INFORMATION", MARGIN + 3, y + 4);
    y += 8;

    // Date, Sales Price
    drawFormField("Date of Sale (MM/DD/YYYY)", formatDateUS(data.date), MARGIN, y, w3);
    drawFormField("Sales Price", formatCurrency(data.amount), MARGIN + w3 + 2, y, w3);
    drawFormField("Trade-In Allowance", "$0.00", MARGIN + (w3 + 2) * 2, y, w3);
    y += 14;

    // Rebate, Net Price
    drawFormField("Manufacturer Rebate", "$0.00", MARGIN, y, w3);
    const netPrice = parseFloat(data.amount.replace(/[^0-9.]/g, '')) || 0;
    drawFormField("Taxable Value", formatCurrency(netPrice.toString()), MARGIN + w3 + 2, y, w3);
    const salesTax = netPrice * 0.0625; // Texas 6.25% sales tax
    drawFormField("Motor Vehicle Tax (6.25%)", formatCurrency(salesTax.toString()), MARGIN + (w3 + 2) * 2, y, w3);
    y += 20;

    // Section 5: CERTIFICATION
    doc.setFillColor(0, 51, 102);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("SECTION 5: CERTIFICATION", MARGIN + 3, y + 4);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const certText = "I certify under penalty of perjury that all information on this application is true and correct. I understand that giving false information to obtain a title is a felony (Texas Penal Code §37.10).";
    doc.text(doc.splitTextToSize(certText, CONTENT_WIDTH), MARGIN, y);
    y += 12;

    // Signature lines
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 8, MARGIN + 80, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.text("SELLER SIGNATURE", MARGIN, y + 12);
    doc.text("Triple J Auto Investment LLC", MARGIN, y + 16);

    doc.line(MARGIN + 100, y + 8, PAGE_WIDTH - MARGIN, y + 8);
    doc.text("BUYER SIGNATURE", MARGIN + 100, y + 12);
    doc.text("X", MARGIN + 100, y + 6);

    // Footer with instructions
    y = PAGE_HEIGHT - 35;
    doc.setFillColor(255, 255, 230);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 25, 'F');
    doc.setDrawColor(200, 180, 0);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 80, 0);
    doc.text("IMPORTANT: SUBMIT THIS FORM WITHIN 30 DAYS", MARGIN + 5, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 60, 0);
    const instructions = "Take this completed form along with your signed title, proof of insurance, and valid photo ID to your local County Tax Assessor-Collector's Office. Registration and title transfer fees will be collected at time of submission.";
    doc.text(doc.splitTextToSize(instructions, CONTENT_WIDTH - 10), MARGIN + 5, y + 12);

    // Official footer
    doc.setFillColor(0, 51, 102);
    doc.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, 'F');
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text("PRE-FILLED BY TRIPLE J AUTO INVESTMENT LLC • DEALER LICENSE P171632 • 8774 ALMEDA GENOA RD, HOUSTON, TX 77075", PAGE_WIDTH / 2, PAGE_HEIGHT - 3, { align: 'center' });

    const safeName = (data.buyerName || "Client").replace(/[^a-z0-9]/gi, '_');
    doc.save(`Form_130U_${safeName}.pdf`);
};

// Helper function to create BillOfSaleData from a Vehicle
export const createBillOfSaleFromVehicle = (vehicle: {
  vin: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number;
}): Partial<BillOfSaleData> => {
  return {
    vin: vehicle.vin,
    year: vehicle.year.toString(),
    make: vehicle.make,
    model: vehicle.model,
    odometer: vehicle.mileage.toString(),
    amount: vehicle.price.toString(),
    sellerName: "Triple J Auto Investment LLC",
    sellerAddress: "8774 Almeda Genoa Road, Houston, TX 77075",
    sellerRepresentative: "",
    date: new Date().toISOString().split('T')[0],
    printLanguage: 'EN',
    bodyStyle: '',
    licensePlate: '',
    emptyWeight: '',
    exteriorColor: '',
    interiorColor: '',
    notes: '',
    buyerName: '',
    buyerAddress: ''
  };
};
