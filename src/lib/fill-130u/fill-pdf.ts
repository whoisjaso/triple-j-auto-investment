/**
 * 130-U PDF Fill Engine
 *
 * Loads the blank TxDMV Form 130-U, fills AcroForm fields using the
 * field mapping, and returns the filled PDF as Uint8Array.
 *
 * The form is NOT flattened — fields remain editable so the tax office
 * can make corrections if needed.
 */

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { FIELD_MAPPINGS, type AgreementData } from './field-mapping';

const PDF_PATH = join(process.cwd(), 'public', 'forms', '130-U.pdf');

// Font sizes tuned to 130-U field heights (~24pt boxes)
const FONT_SIZE_DEFAULT = 9;

// Fields that need smaller font to fit long content
const SMALL_FONT_FIELDS = new Set([
  '16 Applicant First Name or Entity Name Middle Name Last Name Suffix if any',
  '17 Additional Applicant First Name if applicable Middle Name Last Name Suffix if any',
  '18 Applicant Mailing Address City State Zip',
  '20 Previous Owner Name or Entity Name City State',
  '23 Renewal Recipient First Name or Entity Name if different Middle Name Last Name Suffix if any',
  '24 Renewal Notice Mailing Address if different City State Zip',
  '29 Vehicle Location Address if different City State Zip',
  '34 First Lienholder Name if any Mailing Address City State Zip',
  '36 TradeIn if any Year Make Vehicle Identification Number',
  'Seller  Name',
  'Applicant Owner',
  'Additional Applicant',
]);

const TINY_FONT_FIELDS = new Set([
  '26 Email optional',
  'Sales Tax Exemption Reason',
]);

function getFontSize(fieldId: string): number {
  if (TINY_FONT_FIELDS.has(fieldId)) return 7;
  if (SMALL_FONT_FIELDS.has(fieldId)) return 8;
  return FONT_SIZE_DEFAULT;
}

export async function fill130U(data: AgreementData): Promise<Uint8Array> {
  // Load blank 130-U template
  const templateBytes = await readFile(PDF_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Fill each mapped field
  for (const mapping of FIELD_MAPPINGS) {
    try {
      const value = mapping.getValue(data);

      // Skip undefined/empty values
      if (value === undefined || value === null || value === '') continue;

      if (mapping.type === 'text' && typeof value === 'string') {
        const field = form.getTextField(mapping.fieldId);
        field.defaultUpdateAppearances(font);
        field.setFontSize(getFontSize(mapping.fieldId));
        field.setText(value);
      } else if (mapping.type === 'checkbox' && typeof value === 'boolean') {
        const field = form.getCheckBox(mapping.fieldId);
        if (value) {
          field.check();
        } else {
          field.uncheck();
        }
      }
    } catch (err) {
      // Field doesn't exist in PDF — log warning but don't crash
      console.warn(
        `[fill-130u] Warning: Could not fill field "${mapping.fieldId}":`,
        (err as Error).message
      );
    }
  }

  // Do NOT flatten — leave fields editable
  const filledPdf = await pdfDoc.save();
  return filledPdf;
}
