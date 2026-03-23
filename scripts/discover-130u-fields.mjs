/**
 * 130-U PDF Field Discovery Script
 * Extracts all AcroForm field names, types, and positions from the TxDMV 130-U PDF.
 * Run: node scripts/discover-130u-fields.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

const pdfPath = './public/forms/130-U.pdf';
const outputPath = './scripts/discover-130u-output.json';

async function discoverFields() {
  const pdfBytes = readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`Found ${fields.length} form fields in 130-U PDF\n`);

  const fieldData = fields.map((field) => {
    const name = field.getName();
    const type = field.constructor.name;
    const widgets = field.acroField.getWidgets();
    const widgetCount = widgets.length;

    let currentValue = undefined;
    try {
      if (type === 'PDFTextField') {
        currentValue = form.getTextField(name).getText();
      } else if (type === 'PDFCheckBox') {
        currentValue = form.getCheckBox(name).isChecked();
      } else if (type === 'PDFDropdown') {
        currentValue = form.getDropdown(name).getSelected();
      } else if (type === 'PDFRadioGroup') {
        currentValue = form.getRadioGroup(name).getSelected();
      }
    } catch (e) {
      currentValue = `[error reading: ${e.message}]`;
    }

    // Get bounding box from first widget
    let bbox = null;
    let page = null;
    if (widgets.length > 0) {
      const rect = widgets[0].getRectangle();
      bbox = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      // Try to determine which page
      const pages = pdfDoc.getPages();
      for (let i = 0; i < pages.length; i++) {
        const pageRef = pages[i].ref;
        const widgetPage = widgets[0].P();
        if (widgetPage && pageRef === widgetPage) {
          page = i + 1;
          break;
        }
      }
    }

    const entry = { name, type, widgetCount, currentValue, bbox, page };

    console.log(`[${type}] "${name}" (${widgetCount} widget${widgetCount !== 1 ? 's' : ''})${currentValue !== undefined ? ` = ${JSON.stringify(currentValue)}` : ''}`);

    return entry;
  });

  writeFileSync(outputPath, JSON.stringify(fieldData, null, 2));
  console.log(`\nField inventory written to ${outputPath}`);
  console.log(`Total fields: ${fieldData.length}`);
  console.log(`  Text fields: ${fieldData.filter(f => f.type === 'PDFTextField').length}`);
  console.log(`  Checkboxes: ${fieldData.filter(f => f.type === 'PDFCheckBox').length}`);
  console.log(`  Dropdowns: ${fieldData.filter(f => f.type === 'PDFDropdown').length}`);
  console.log(`  Radio groups: ${fieldData.filter(f => f.type === 'PDFRadioGroup').length}`);
  console.log(`  Other: ${fieldData.filter(f => !['PDFTextField', 'PDFCheckBox', 'PDFDropdown', 'PDFRadioGroup'].includes(f.type)).length}`);
}

discoverFields().catch(console.error);
