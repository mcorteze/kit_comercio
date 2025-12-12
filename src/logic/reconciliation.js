/**
 * Aggregates data by ORDEN_PEDIDO and SKU.
 * @param {Array} data - List of raw rows.
 * @returns {Map} - Map where key is Order_SKU and value is aggregated info.
 */
const aggregateData = (data) => {
  const map = new Map();

  data.forEach((row) => {
    const key = `${row.ORDEN_PEDIDO}_${row.SKU}`;
    
    if (!map.has(key)) {
      map.set(key, {
        ORDEN_PEDIDO: row.ORDEN_PEDIDO,
        SKU: row.SKU,
        CANTIDAD: 0,
        PRECIO_TOTAL: 0,
        // We track unit prices found to detect inconsistencies within the same group if needed, 
        // but for now we'll take the first one or calculate average.
        PRECIO_UNITARIO_ESPERADO: row.PRECIO_UNITARIO || 0, 
        rows: []
      });
    }

    const entry = map.get(key);
    entry.CANTIDAD += Number(row.CANTIDAD) || 0;
    
    // If PRECIO_TOTAL is present, use it. If not, calculate from Unit Price * Qty (fallback)
    // The user said "PRECIO" field exists for total.
    let rowTotal = Number(row.PRECIO_TOTAL) || 0;

    
    entry.PRECIO_TOTAL += rowTotal;
    entry.rows.push(row);
  });

  return map;
};

/**
 * Reconciles internal records vs factory records.
 * @param {Array} internalData 
 * @param {Array} factoryData 
 */
export const reconcileData = (internalData, factoryData) => {
  const internalMap = aggregateData(internalData);
  const factoryMap = aggregateData(factoryData);

  const results = {
    matches: [],
    mismatches: [],
    missing: [], // In Internal, not in Factory
    surprises: [] // In Factory, not in Internal
  };

  // Check Internal vs Factory
  internalMap.forEach((internalItem, key) => {
    if (factoryMap.has(key)) {
      const factoryItem = factoryMap.get(key);
      
      const qtyMatch = internalItem.CANTIDAD === factoryItem.CANTIDAD;
      
      // Compare totals with some tolerance for floating point
      const totalDiff = Math.abs(internalItem.PRECIO_TOTAL - factoryItem.PRECIO_TOTAL);
      const totalMatch = totalDiff < 0.01;

      // Calculate implied unit price for comparison display
      const internalUnitPrice = internalItem.CANTIDAD ? (internalItem.PRECIO_TOTAL / internalItem.CANTIDAD) : 0;
      const factoryUnitPrice = factoryItem.CANTIDAD ? (factoryItem.PRECIO_TOTAL / factoryItem.CANTIDAD) : 0;
      
      const comparisonItem = {
        key,
        ORDEN_PEDIDO: internalItem.ORDEN_PEDIDO,
        SKU: internalItem.SKU,
        internal: internalItem,
        factory: factoryItem,
        qtyMatch,
        totalMatch,
        unitPriceMatch: Math.abs(internalUnitPrice - factoryUnitPrice) < 0.01
      };

      if (qtyMatch && totalMatch) {
        results.matches.push(comparisonItem);
      } else {
        results.mismatches.push(comparisonItem);
      }
      
      // Remove from factory map so we know what's left is "surprise"
      factoryMap.delete(key);
    } else {
      results.missing.push(internalItem);
    }
  });

  // Remaining items in factoryMap are surprises
  factoryMap.forEach((factoryItem, key) => {
    results.surprises.push(factoryItem);
  });

  return results;
};
