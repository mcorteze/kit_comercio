import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';
import '../styles/components/ResultsTable.css';

const ResultsTable = ({ results }) => {
    const [tab, setTab] = useState('mismatches'); // 'all', 'matches', 'mismatches', 'missing', 'surprises'

    if (!results) return null;

    const { matches, mismatches, missing, surprises } = results;

    const getActiveList = () => {
        switch (tab) {
            case 'matches': return matches;
            case 'mismatches': return mismatches;
            case 'missing': return missing;
            case 'surprises': return surprises;
            default: return [];
        }
    };

    const activeList = getActiveList();

    return (
        <div className="results-container glass-panel">
            <div className="tabs">
                <button
                    className={`tab-btn ${tab === 'mismatches' ? 'active' : ''}`}
                    onClick={() => setTab('mismatches')}
                >
                    <AlertTriangle size={18} /> Discrepancias ({mismatches.length})
                </button>
                <button
                    className={`tab-btn ${tab === 'matches' ? 'active' : ''}`}
                    onClick={() => setTab('matches')}
                >
                    <CheckCircle size={18} /> Coincidencias ({matches.length})
                </button>
                <button
                    className={`tab-btn ${tab === 'missing' ? 'active' : ''}`}
                    onClick={() => setTab('missing')}
                >
                    <XCircle size={18} /> Faltantes ({missing.length})
                </button>
                <button
                    className={`tab-btn ${tab === 'surprises' ? 'active' : ''}`}
                    onClick={() => setTab('surprises')}
                >
                    <Search size={18} /> Extras ({surprises.length})
                </button>
            </div>

            <div className="table-wrapper">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>SKU</th>
                            <th>Cant. Interna</th>
                            <th>Cant. Fábrica</th>
                            <th>Precio Unit. Int.</th>
                            <th>Precio Unit. Fab.</th>
                            <th>Total Interno</th>
                            <th>Total Fábrica</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeList.map((item, idx) => {
                            // Determine item props based on type (comparison object vs direct aggregated object)
                            const isComparison = item.internal && item.factory;
                            const order = item.ORDEN_PEDIDO;
                            const sku = item.SKU;

                            let internalQty = '-';
                            let factoryQty = '-';
                            let internalTotal = '-';
                            let factoryTotal = '-';
                            let status = '';

                            if (isComparison) {
                                internalQty = item.internal.CANTIDAD;
                                factoryQty = item.factory.CANTIDAD;
                                internalTotal = item.internal.PRECIO_TOTAL;
                                factoryTotal = item.factory.PRECIO_TOTAL;

                                if (!item.qtyMatch && !item.totalMatch) status = 'Doble Discrepancia';
                                else if (!item.qtyMatch) status = 'Discrepancia Cant.';
                                else if (!item.totalMatch) status = 'Discrepancia Precio';
                                else status = 'Coincidencia';
                            } else if (tab === 'missing') {
                                // Item i s internal object
                                internalQty = item.CANTIDAD;
                                internalTotal = item.PRECIO_TOTAL;
                                status = 'Falta en Fábrica';
                            } else if (tab === 'surprises') {
                                // Item is factory object
                                factoryQty = item.CANTIDAD;
                                factoryTotal = item.PRECIO_TOTAL;
                                status = 'Item Extra';
                            }

                            // Determine CSS class based on status for rows/badges
                            // We map Spanish status to English classes to keep CSS working
                            let statusClass = '';
                            if (status === 'Coincidencia') statusClass = 'match';
                            else if (status.includes('Doble')) statusClass = 'double-mismatch';
                            else if (status.includes('Cant')) statusClass = 'qty-mismatch';
                            else if (status.includes('Precio')) statusClass = 'price-mismatch';
                            else if (status.includes('Falta')) statusClass = 'missing-in-factory';
                            else if (status.includes('Extra')) statusClass = 'surprise-item';

                            return (
                                <tr key={idx} className={statusClass}>
                                    <td>{order}</td>
                                    <td>{sku}</td>
                                    <td className={isComparison && !item.qtyMatch ? 'diff' : ''}>{internalQty}</td>
                                    <td className={isComparison && !item.qtyMatch ? 'diff' : ''}>{factoryQty}</td>
                                    <td>{isComparison ? (item.internal.PRECIO_UNITARIO_ESPERADO || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                    <td>{isComparison ? (item.factory.PRECIO_UNITARIO_ESPERADO || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                    <td className={isComparison && !item.totalMatch ? 'diff' : ''}>{typeof internalTotal === 'number' ? internalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : internalTotal}</td>
                                    <td className={isComparison && !item.totalMatch ? 'diff' : ''}>{typeof factoryTotal === 'number' ? factoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : factoryTotal}</td>
                                    <td><span className={`badge ${statusClass}`}>{status}</span></td>
                                </tr>
                            );
                        })}
                        {activeList.length === 0 && (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron registros en esta categoría.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsTable;
