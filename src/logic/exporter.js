import * as XLSX from 'xlsx';

/**
 * Downloads a blank template for the user to fill out.
 */
export const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = [['ORDEN_PEDIDO', 'SKU', 'CANTIDAD', 'PRECIO_UNITARIO', 'PRECIO']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    
    // Add some column widths for better UX
    ws['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_reconciliacion.xlsx");
};

/**
 * Exports reconciliation results to an Excel file.
 * @param {Object} results - The results object { matches, mismatches, missing, surprises }
 * @param {Object} totals - Calculated totals { internalQty, factoryQty, internalTotal, factoryTotal }
 * @param {string} fileName - Name of the file to save
 */
export const exportResultsToExcel = (results, totals, fileName = 'resultados_reconciliacion.xlsx') => {
    const wb = XLSX.utils.book_new();

    // Helper to format rows for export
    const formatRows = (items, type) => {
        return items.map(item => {
            const isComparison = item.internal && item.factory;
            let row = {};

            if (isComparison) {
                row = {
                    'Orden': item.ORDEN_PEDIDO,
                    'SKU': item.SKU,
                    'Cant. Interna': item.internal.CANTIDAD,
                    'Cant. Fábrica': item.factory.CANTIDAD,
                    'Prec. Unit. Int.': item.internal.PRECIO_UNITARIO_ESPERADO || 0,
                    'Prec. Unit. Fab.': item.factory.PRECIO_UNITARIO_ESPERADO || 0,
                    'Total Interno': item.internal.PRECIO_TOTAL,
                    'Total Fábrica': item.factory.PRECIO_TOTAL,
                    'Estado': !item.qtyMatch && !item.totalMatch ? 'Doble Discrepancia' : (!item.qtyMatch ? 'Discrepancia Cant.' : 'Discrepancia Precio')
                };
                if (type === 'matches') row['Estado'] = 'Coincidencia';
            } else {
                // Missing or Surprise
                row = {
                    'Orden': item.ORDEN_PEDIDO,
                    'SKU': item.SKU,
                    'Cantidad': item.CANTIDAD,
                    'Precio Total': item.PRECIO_TOTAL,
                    'Tipo': type === 'missing' ? 'Falta en Fábrica' : 'Extra en Fábrica'
                };
            }
            return row;
        });
    };

    // 1. Summary Sheet
    const summaryData = [
        ['Resumen General'],
        ['Concepto', 'Interno', 'Fábrica', 'Diferencia'],
        ['Cantidad Total', totals.internalQty, totals.factoryQty, totals.factoryQty - totals.internalQty],
        ['Monto Total', totals.internalTotal, totals.factoryTotal, totals.factoryTotal - totals.internalTotal],
        [],
        ['Detalle de Items'],
        ['Coincidencias', results.matches.length],
        ['Discrepancias', results.mismatches.length],
        ['Faltantes', results.missing.length],
        ['Extras', results.surprises.length]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

    // 2. Mismatches
    if (results.mismatches.length > 0) {
        const wsMismatches = XLSX.utils.json_to_sheet(formatRows(results.mismatches, 'mismatches'));
        XLSX.utils.book_append_sheet(wb, wsMismatches, "Discrepancias");
    }

    // 3. Matches
    if (results.matches.length > 0) {
        const wsMatches = XLSX.utils.json_to_sheet(formatRows(results.matches, 'matches'));
        XLSX.utils.book_append_sheet(wb, wsMatches, "Coincidencias");
    }

    // 4. Missing
    if (results.missing.length > 0) {
        const wsMissing = XLSX.utils.json_to_sheet(formatRows(results.missing, 'missing'));
        XLSX.utils.book_append_sheet(wb, wsMissing, "Faltantes");
    }

    // 5. Surprises
    if (results.surprises.length > 0) {
        const wsSurprises = XLSX.utils.json_to_sheet(formatRows(results.surprises, 'surprises'));
        XLSX.utils.book_append_sheet(wb, wsSurprises, "Extras");
    }

    XLSX.writeFile(wb, fileName);
};
