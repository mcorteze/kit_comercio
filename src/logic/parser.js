import * as XLSX from 'xlsx';

/**
 * Parses an Excel or CSV file and maps it to a standard internal structure.
 * @param {File} file - The file object to parse.
 * @returns {Promise<Array>} - Array of normalized row objects.
 */
export const parseFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        // Normalize keys (trim, uppercase) and values
        const normalized = jsonData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.trim().toUpperCase().replace(/_/g, ' '); // Allow flexible matching if needed, but stick to requested names
             // Map to standard keys
             if (cleanKey.includes('ORDEN') && cleanKey.includes('PEDIDO')) newRow.ORDEN_PEDIDO = String(row[key]).trim(); // treat as string to preserve leading zeros if any
             else if (cleanKey === 'SKU') newRow.SKU = String(row[key]).trim();
             else if (cleanKey === 'CANTIDAD') newRow.CANTIDAD = Number(row[key]) || 0;
             else if (cleanKey.includes('PRECIO') && cleanKey.includes('UNITARIO')) newRow.PRECIO_UNITARIO = Number(row[key]) || 0;
             else if (cleanKey === 'PRECIO') newRow.PRECIO_TOTAL = Number(row[key]) || 0; // Use PRECIO as total price
          });
          return newRow;
        }).filter(r => r.ORDEN_PEDIDO && r.SKU); // Filter out empty or invalid rows

        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
