import React from 'react';
import '../styles/components/DiscrepancyAnalysis.css';

const DiscrepancyAnalysis = ({ results, totals }) => {
    if (!results) return null;

    const { matches, mismatches, missing, surprises } = results;
    const { internalQty, factoryQty, internalTotal, factoryTotal } = totals;

    // Calculate Net Differences
    const netQtyDiff = factoryQty - internalQty;
    const netPriceDiff = factoryTotal - internalTotal;

    // Breakdown
    // 1. Missing (In Internal, not in Factory) -> Negative impact on Factory relative to Internal
    const missingQty = missing.reduce((sum, item) => sum + item.CANTIDAD, 0);
    const missingTotal = missing.reduce((sum, item) => sum + item.PRECIO_TOTAL, 0);

    // 2. Surprises (In Factory, not in Internal) -> Positive impact
    const surpriseQty = surprises.reduce((sum, item) => sum + item.CANTIDAD, 0);
    const surpriseTotal = surprises.reduce((sum, item) => sum + item.PRECIO_TOTAL, 0);

    // 3. Mismatches (Common items with diffs) -> Factory - Internal
    const mismatchQty = mismatches.reduce((sum, item) => sum + (item.factory.CANTIDAD - item.internal.CANTIDAD), 0);
    const mismatchTotal = mismatches.reduce((sum, item) => sum + (item.factory.PRECIO_TOTAL - item.internal.PRECIO_TOTAL), 0);

    // Verification Sum
    const calculatedQtyDiff = surpriseQty - missingQty + mismatchQty;
    const calculatedPriceDiff = surpriseTotal - missingTotal + mismatchTotal;

    const isQtySquared = Math.abs(netQtyDiff - calculatedQtyDiff) < 0.001;
    const isPriceSquared = Math.abs(netPriceDiff - calculatedPriceDiff) < 0.01;

    const formatCurrency = (val) => '$' + val.toLocaleString(undefined, { maximumFractionDigits: 0 });

    return (
        <div className="analysis-container glass-panel">
            <h3>Análisis de Diferencias</h3>

            <div className="analysis-grid">
                {/* Quantity Analysis */}
                <div className="analysis-column">
                    <h4>Diferencias en Cantidad</h4>
                    <div className="stat-row main">
                        <span>Diferencia Total (Fábrica - Interno):</span>
                        <span className={netQtyDiff !== 0 ? 'bad' : 'good'}>{netQtyDiff > 0 ? '+' : ''}{netQtyDiff}</span>
                    </div>
                    <div className="breakdown">
                        <div className="stat-row">
                            <span>Por Faltantes (No enviados):</span>
                            <span className="diff-neg">-{missingQty}</span>
                        </div>
                        <div className="stat-row">
                            <span>Por Extras (No pedidos):</span>
                            <span className="diff-pos">+{surpriseQty}</span>
                        </div>
                        <div className="stat-row">
                            <span>Por Discrepancias en items:</span>
                            <span className={mismatchQty !== 0 ? (mismatchQty > 0 ? 'diff-pos' : 'diff-neg') : ''}>
                                {mismatchQty > 0 ? '+' : ''}{mismatchQty}
                            </span>
                        </div>
                        <div className="stat-row summary">
                            <span>Cuadre Explicado:</span>
                            <span className={isQtySquared ? 'good' : 'bad'}>{isQtySquared ? 'OK' : 'ERROR'}</span>
                        </div>
                    </div>
                </div>

                {/* Price Analysis */}
                <div className="analysis-column">
                    <h4>Diferencias en Dinero</h4>
                    <div className="stat-row main">
                        <span>Diferencia Total (Fábrica - Interno):</span>
                        <span className={netPriceDiff !== 0 ? 'bad' : 'good'}>{netPriceDiff > 0 ? '+' : ''}{formatCurrency(netPriceDiff)}</span>
                    </div>
                    <div className="breakdown">
                        <div className="stat-row">
                            <span>Por Faltantes:</span>
                            <span className="diff-neg">-{formatCurrency(missingTotal)}</span>
                        </div>
                        <div className="stat-row">
                            <span>Por Extras:</span>
                            <span className="diff-pos">+{formatCurrency(surpriseTotal)}</span>
                        </div>
                        <div className="stat-row">
                            <span>Por Discrepancias de Precio:</span>
                            <span className={mismatchTotal !== 0 ? (mismatchTotal > 0 ? 'diff-pos' : 'diff-neg') : ''}>
                                {mismatchTotal > 0 ? '+' : ''}{formatCurrency(mismatchTotal)}
                            </span>
                        </div>
                        <div className="stat-row summary">
                            <span>Cuadre Explicado:</span>
                            <span className={isPriceSquared ? 'good' : 'bad'}>{isPriceSquared ? 'OK' : 'ERROR'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiscrepancyAnalysis;
