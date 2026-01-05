import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { BillOfSaleData } from '../types';
import { getCountyFromAddress } from '../utils/texasCountyLookup';

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

// --- LOGO CACHING ---
let cachedLogoBase64: string | null = null;

const loadLogoAsBase64 = async (): Promise<string | null> => {
    if (cachedLogoBase64) return cachedLogoBase64;

    try {
        const response = await fetch('/GoldTripleJLogo.png');
        const blob = await response.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                cachedLogoBase64 = reader.result as string;
                resolve(cachedLogoBase64);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        console.warn('Could not load logo for PDF');
        return null;
    }
};

// Pre-load logo on module init
loadLogoAsBase64();

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

const drawHeader = (doc: jsPDF, title: string, subtitle: string, logoBase64?: string | null) => {
    const h = 45; // Taller header for prominent centered logo

    // Header Block - Deep green background
    doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, h, 'F');

    // Gold Accent Line at bottom
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(1);
    doc.line(MARGIN, MARGIN + h, PAGE_WIDTH - MARGIN, MARGIN + h);

    // CENTERED LOGO (prominent, speaks for itself)
    const logoSize = 32;
    if (logoBase64) {
        try {
            const logoX = (PAGE_WIDTH - logoSize) / 2;
            doc.addImage(logoBase64, 'PNG', logoX, MARGIN + 3, logoSize, logoSize);
        } catch (e) {
            console.warn('Failed to add logo to PDF:', e);
        }
    }

    // Document Title (centered below logo area)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text(title.toUpperCase(), PAGE_WIDTH / 2, MARGIN + 38, { align: "center" });

    // Subtitle (small, elegant)
    doc.setFont("times", "italic");
    doc.setFontSize(7);
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.text(subtitle, PAGE_WIDTH / 2, MARGIN + 43, { align: "center" });

    return MARGIN + h + 6;
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
    const y = PAGE_HEIGHT - 16;

    // Footer background strip
    doc.setFillColor(C_DARK[0], C_DARK[1], C_DARK[2]);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');

    // Gold accent line at top of footer
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

    // Company info (left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text("TRIPLE J AUTO INVESTMENT LLC", MARGIN + 3, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.text("8774 ALMEDA GENOA RD, HOUSTON, TX 77075", MARGIN + 3, y + 7);

    // Center - Dealer License
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.text("TX DEALER LICENSE: P171632", PAGE_WIDTH / 2, y + 5.5, { align: "center" });

    // Right side - Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5);
    doc.setTextColor(C_WHITE[0], C_WHITE[1], C_WHITE[2]);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, PAGE_WIDTH - MARGIN - 3, y + 5.5, { align: "right" });
};

// --- PDF GENERATORS ---

export const generateBillOfSalePDF = async (data: BillOfSaleData, preview: boolean = false): Promise<string | void> => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const logo = await loadLogoAsBase64();
    drawSecurityBackground(doc);

    const isSpanish = data.printLanguage === 'ES';
    let y = drawHeader(doc,
        isSpanish ? "FACTURA DE VENTA DE VEHÍCULO" : "VEHICLE BILL OF SALE",
        isSpanish ? "TRANSFERENCIA DE PROPIEDAD" : "TRANSFER OF OWNERSHIP DOCUMENT",
        logo
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

    if (preview) {
        return doc.output('bloburl').toString();
    }
    doc.save(`TripleJ_BOS_${safeName}.pdf`);
};

export const generateAsIsPDF = async (data: BillOfSaleData, preview: boolean = false): Promise<string | void> => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const logo = await loadLogoAsBase64();
    drawSecurityBackground(doc);

    const isSpanish = data.printLanguage === 'ES';

    let y = drawHeader(doc,
        isSpanish ? "ACUSE DE RECIBO DEL COMPRADOR" : "BUYER ACKNOWLEDGMENT",
        isSpanish ? "VENTA DE VEHÍCULO COMO ESTÁ" : "AS-IS VEHICLE SALE",
        logo
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

    if (preview) {
        return doc.output('bloburl').toString();
    }
    doc.save("TripleJ_AsIs_Acknowledgment.pdf");
};

export const generateRegistrationGuidePDF = async (data: BillOfSaleData, preview: boolean = false): Promise<string | void> => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const logo = await loadLogoAsBase64();
    drawSecurityBackground(doc);

    let y = drawHeader(doc, "REGISTRATION PROTOCOL", "BUYER INSTRUCTIONS", logo);

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

    // Important Note Box - Deadline Warning
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

    // LATE REGISTRATION PENALTY BOX (Critical - $20/day)
    y += 30;
    doc.setFillColor(180, 30, 30); // Red background for urgency
    doc.rect(MARGIN, y, CONTENT_WIDTH, 28, 'F');
    doc.setDrawColor(150, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 28);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CUSTOMER REGISTRATION OPT-OUT PENALTY", MARGIN + 5, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Texas law requires dealers to process vehicle registration on behalf of customers. If you elect to handle registration independently and return to the dealership after 30 days from the date of purchase, a late processing fee of $20.00 per day will apply, calculated from the original purchase date.", MARGIN + 5, y + 13, { maxWidth: CONTENT_WIDTH - 10 });

    // Acknowledgment checkbox
    y += 32;
    doc.setFillColor(255, 250, 240);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18, 'F');
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18);

    // Checkbox
    doc.setDrawColor(0, 0, 0);
    doc.rect(MARGIN + 5, y + 6, 5, 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("I ACKNOWLEDGE:", MARGIN + 14, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("I understand that if I choose to process registration outside the dealership and return after 30 days, I will be charged $20/day late fee.", MARGIN + 14, y + 15, { maxWidth: CONTENT_WIDTH - 20 });

    // Storage Fee Policy Box
    y += 22;
    doc.setFillColor(255, 240, 220);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18, 'F');
    doc.setDrawColor(C_GOLD[0], C_GOLD[1], C_GOLD[2]);
    doc.setLineWidth(0.5);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 18);
    doc.setTextColor(150, 100, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("STORAGE POLICY", MARGIN + 5, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 70, 0);
    doc.text("A storage fee of $25.00 per day will be assessed for vehicles not picked up within 60 days of the date of sale. Please arrange for timely pickup to avoid additional charges.", MARGIN + 5, y + 11, { maxWidth: CONTENT_WIDTH - 10 });

    drawFooter(doc);

    if (preview) {
        return doc.output('bloburl').toString();
    }
    doc.save("TripleJ_Registration_Guide.pdf");
};

// --- FORM 130-U (Official Texas Title/Registration Application) ---
// Uses the official Texas DMV Form 130-U with pdf-lib for form filling

let cached130UBytes: ArrayBuffer | null = null;

const load130UForm = async (): Promise<ArrayBuffer> => {
    if (cached130UBytes) return cached130UBytes;

    try {
        const response = await fetch('/TX-130-U-2025.pdf');
        cached130UBytes = await response.arrayBuffer();
        return cached130UBytes;
    } catch (error) {
        console.error('Failed to load 130-U form:', error);
        throw new Error('Could not load Form 130-U template');
    }
};

// Pre-load 130-U form on module init
load130UForm().catch(() => {});

export const generateForm130U = async (data: BillOfSaleData, preview: boolean = false): Promise<string | void> => {
    try {
        const formBytes = await load130UForm();
        const pdfDoc = await PDFDocument.load(formBytes);
        const form = pdfDoc.getForm();

        // Helper to safely set text field - tries multiple field name variants
        const setTextField = (fieldName: string, value: string) => {
            // Try the exact field name first, then try with/without extra spaces
            const variants = [
                fieldName,
                fieldName.replace(/\s{2,}/g, ' '),  // Remove double spaces
                fieldName.replace(/\s/g, '  '),     // Add double spaces between words
            ];

            for (const name of variants) {
                try {
                    const field = form.getTextField(name);
                    field.setText(value || '');
                    return; // Success, stop trying variants
                } catch {
                    continue; // Try next variant
                }
            }
            console.warn(`Field not found (tried variants): ${fieldName}`);
        };

        // Helper to safely check checkbox - tries multiple field name variants
        const checkBox = (fieldName: string) => {
            const variants = [
                fieldName,
                fieldName.replace(/\s{2,}/g, ' '),
                fieldName.replace(/\s/g, '  '),
            ];

            for (const name of variants) {
                try {
                    const field = form.getCheckBox(name);
                    field.check();
                    return;
                } catch {
                    continue;
                }
            }
            console.warn(`Checkbox not found (tried variants): ${fieldName}`);
        };

        // --- FILL FORM FIELDS ---

        // Check "Title & Registration" purpose
        checkBox('Title  Registration');

        // Vehicle Information (Section 1)
        setTextField('1 Vehicle Identification Number', data.vin || '');
        setTextField('2 Year', data.year || '');
        setTextField('3 Make', data.make || '');
        setTextField('4 Body Style', data.bodyStyle || '4D');
        setTextField('5 Model', data.model || '');
        setTextField('6 Major Color', data.majorColor || data.exteriorColor || '');
        setTextField('7 Minor Color', data.minorColor || data.interiorColor || '');
        setTextField('8 Texas License Plate No', data.licensePlate || '');
        setTextField('9 Odometer Reading no tenths', data.odometer || '');
        setTextField('10 Texas Plant No', data.texasPlantNo || '');
        setTextField('11 Empty Weight', data.emptyWeight || '');

        // Applicant Type - Default to Individual
        checkBox('Individual');

        // Applicant/Buyer Information (Section 2)
        setTextField('16 Applicant First Name or Entity Name Middle Name Last Name Suffix if any', data.buyerName || '');
        setTextField('18 Applicant Mailing Address City State Zip', data.buyerAddress || '');

        // Applicant Photo ID Information
        if (data.applicantIdType && data.applicantIdNumber) {
            // Map ID type to form field checkbox names
            const idTypeCheckboxMap: Record<string, string> = {
                'US_DRIVERS_LICENSE': 'US Drivers License',
                'US_PASSPORT': 'US Passport',
                'US_MILITARY_ID': 'US Military ID',
                'NATO_ID': 'NATO ID',
                'US_CITIZENSHIP_CERT': 'US Citizenship Certificate',
                'PERMANENT_RESIDENT_CARD': 'Permanent Resident Card',
                'STATE_ID': 'State ID'
            };
            const checkboxName = idTypeCheckboxMap[data.applicantIdType];
            if (checkboxName) {
                checkBox(checkboxName);
            }
            // Set ID number field
            setTextField('17 Applicant ID Number', data.applicantIdNumber || '');
        }

        // County - Auto-detect from zip code in address
        const county = getCountyFromAddress(data.buyerAddress || '');
        if (county) {
            setTextField('19 Applicant County of Residence', county);
        }

        // Seller/Dealer Information (Section 3)
        setTextField('20 Previous Owner Name or Entity Name City State', `${data.sellerName}, Houston, TX`);
        setTextField('21 Dealer GDN if applicable', 'P171632');

        // Sale Information (Section 4)
        setTextField('Date', formatDateUS(data.date));
        setTextField('Seller  Name', data.sellerName || 'Triple J Auto Investment LLC');

        // Tax Calculation
        const salePrice = parseFloat(data.amount?.replace(/[^0-9.]/g, '') || '0');
        const salesTax = salePrice * 0.0625; // Texas 6.25%

        setTextField('Sales Price Minus Rebate Amount', formatCurrency(salePrice.toString()));
        setTextField('Taxable Amount', formatCurrency(salePrice.toString()));
        setTextField('25% Tax on Taxable Amount', formatCurrency(salesTax.toString()));
        setTextField('Amount of Tax and Penalty Due', formatCurrency(salesTax.toString()));

        // Check the $28/$33 application fee checkbox
        checkBox('$28 or $33 Application Fee for Texas Title - contact your county for the correct fee');

        // Flatten form to prevent further editing (makes it look cleaner)
        // form.flatten(); // Uncomment if you want the form to be non-editable

        // Generate output
        const filledPdfBytes = await pdfDoc.save();
        const blob = new Blob([filledPdfBytes], { type: 'application/pdf' });

        if (preview) {
            return URL.createObjectURL(blob);
        }

        // Download the file
        const safeName = (data.buyerName || 'Client').replace(/[^a-z0-9]/gi, '_');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Form_130U_${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error('Error generating Form 130-U:', error);
        // Fallback: generate simple instruction page
        const doc = new jsPDF({ unit: 'mm', format: 'letter' });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Form 130-U - Error Loading Template", PAGE_WIDTH / 2, 50, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Please obtain Form 130-U from your County Tax Office.", PAGE_WIDTH / 2, 70, { align: 'center' });
        doc.text("Or visit: www.txdmv.gov", PAGE_WIDTH / 2, 85, { align: 'center' });

        if (preview) {
            return doc.output('bloburl').toString();
        }
        doc.save('Form_130U_Instructions.pdf');
    }
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
    majorColor: '',
    minorColor: '',
    texasPlantNo: '',
    applicantIdType: 'US_DRIVERS_LICENSE',
    applicantIdNumber: '',
    notes: '',
    buyerName: '',
    buyerAddress: ''
  };
};
