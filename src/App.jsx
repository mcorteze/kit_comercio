import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Activity, DollarSign, XCircle, FileCheck } from 'lucide-react';
import FileUploader from './components/FileUploader';
import SummaryCard from './components/SummaryCard';
import DiscrepancyAnalysis from './components/DiscrepancyAnalysis';
import ResultsTable from './components/ResultsTable';
import { parseFile } from './logic/parser';
import { reconcileData } from './logic/reconciliation';
import { exportResultsToExcel, downloadTemplate } from './logic/exporter';
import './styles/main.css';
import './styles/components/Components.css'; // Import shared component styles (Uploader, Cards)
import './styles/AppLayout.css';

function App() {
  const [internalFile, setInternalFile] = useState(null);
  const [factoryFile, setFactoryFile] = useState(null);

  const [internalData, setInternalData] = useState([]);
  const [factoryData, setFactoryData] = useState([]);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState('');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [includeMissing, setIncludeMissing] = useState(false);

  const [totals, setTotals] = useState({
    internalQty: 0,
    factoryQty: 0,
    internalTotal: 0,
    factoryTotal: 0
  });

  // Extract unique orders when data changes
  useEffect(() => {
    const orders = new Set();
    internalData.forEach(item => { if (item.ORDEN_PEDIDO) orders.add(item.ORDEN_PEDIDO); });
    factoryData.forEach(item => { if (item.ORDEN_PEDIDO) orders.add(item.ORDEN_PEDIDO); });
    setAvailableOrders(Array.from(orders).sort());
  }, [internalData, factoryData]);

  // Auto-process when both files are loaded or order changes
  useEffect(() => {
    if (internalData.length > 0 && factoryData.length > 0) {
      if (selectedOrder === '') {
        setResults(null);
      } else {
        processReconciliation();
      }
    }
  }, [internalData, factoryData, selectedOrder, includeMissing]);

  const handleInternalUpload = async (file) => {
    setLoading(true);
    setInternalFile(file);
    try {
      const data = await parseFile(file);
      setInternalData(data);
      console.log('Internal Data:', data);
    } catch (err) {
      setError("Error parsing internal file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFactoryUpload = async (file) => {
    setLoading(true);
    setFactoryFile(file);
    try {
      const data = await parseFile(file);
      setFactoryData(data);
      console.log('Factory Data:', data);
    } catch (err) {
      setError("Error parsing factory file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processReconciliation = () => {
    try {
      let filteredInternal = internalData;
      let filteredFactory = factoryData;

      if (selectedOrder && selectedOrder !== 'all') {
        filteredInternal = internalData.filter(item => item.ORDEN_PEDIDO === selectedOrder);
        filteredFactory = factoryData.filter(item => item.ORDEN_PEDIDO === selectedOrder);
      }

      const res = reconcileData(filteredInternal, filteredFactory);

      // Filter missing if unchecked
      let finalResults = { ...res };
      if (!includeMissing) {
        finalResults.missing = [];
      }

      // Calculate totals based on FINAL results to ensure consistency
      // Internal = Matches + Mismatches + Missing
      // Factory = Matches + Mismatches + Surprises

      const sumList = (list, side, field) => list.reduce((acc, item) => {
        const target = side ? item[side] : item;
        return acc + (Number(target[field]) || 0);
      }, 0);

      const tInternalQty = sumList(finalResults.matches, 'internal', 'CANTIDAD') +
        sumList(finalResults.mismatches, 'internal', 'CANTIDAD') +
        sumList(finalResults.missing, null, 'CANTIDAD');

      const tFactoryQty = sumList(finalResults.matches, 'factory', 'CANTIDAD') +
        sumList(finalResults.mismatches, 'factory', 'CANTIDAD') +
        sumList(finalResults.surprises, null, 'CANTIDAD');

      const tInternalTotal = sumList(finalResults.matches, 'internal', 'PRECIO_TOTAL') +
        sumList(finalResults.mismatches, 'internal', 'PRECIO_TOTAL') +
        sumList(finalResults.missing, null, 'PRECIO_TOTAL');

      const tFactoryTotal = sumList(finalResults.matches, 'factory', 'PRECIO_TOTAL') +
        sumList(finalResults.mismatches, 'factory', 'PRECIO_TOTAL') +
        sumList(finalResults.surprises, null, 'PRECIO_TOTAL');

      setTotals({
        internalQty: tInternalQty,
        factoryQty: tFactoryQty,
        internalTotal: tInternalTotal,
        factoryTotal: tFactoryTotal
      });

      setResults(finalResults);
      setError(null);
    } catch (err) {
      setError("Fallo en la reconciliación: " + err.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container">
          <h1>Reconciliación de Pedidos</h1>
          <p className="subtitle">Contraste de Órdenes de Compra vs Despachos de Fábrica</p>
        </div>
      </header>

      <main className="container main-content">
        {error && (
          <div className="error-banner glass-panel" style={{ color: 'var(--error)', padding: '1rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="upload-section grid-2">
          <FileUploader
            label="Cargar Planilla Propia"
            onFileSelect={handleInternalUpload}
            fileName={internalFile?.name}
          />
          <FileUploader
            label="Cargar Planilla Fábrica"
            onFileSelect={handleFactoryUpload}
            fileName={factoryFile?.name}
          />
        </div>

        {
          availableOrders.length > 0 && (
            <div className="filter-section glass-panel">
              <div className="filter-group">
                <label htmlFor="order-select">Filtrar por Orden de Pedido: </label>
                <select
                  id="order-select"
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="order-dropdown"
                >
                  <option value="" disabled>Seleccione una Orden...</option>
                  <option value="all">Todas las Órdenes</option>
                  {availableOrders.map(order => (
                    <option key={order} value={order}>{order}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeMissing}
                    onChange={(e) => setIncludeMissing(e.target.checked)}
                  />
                  Considerar Faltantes
                </label>
              </div>

              <div className="filter-group">
                <button
                  className="btn-export"
                  onClick={downloadTemplate}
                  title="Descargar Plantilla Vacía"
                >
                  <FileSpreadsheet size={18} /> Descargar Plantilla
                </button>
              </div>
            </div>
          )
        }

        {loading && <div className="loading">Procesando...</div>}

        {
          results && (
            <div className="dashboard animate-fade-in">
              <div className="summary-grid">
                <SummaryCard
                  title="Comparación de Cantidades"
                  value={<>Interno: {totals.internalQty} <br /> Fábrica: {totals.factoryQty}</>}
                  icon={FileSpreadsheet}
                  colorClass={totals.internalQty === totals.factoryQty ? 'card-green' : 'card-red'}
                />
                <SummaryCard
                  title="Comparación de Montos ($)"
                  value={<>Interno: ${totals.internalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <br /> Fábrica: ${totals.factoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
                  icon={DollarSign}
                  colorClass={Math.abs(totals.factoryTotal - totals.internalTotal) < 1 ? 'card-green' : 'card-red'}
                />
              </div>

              <DiscrepancyAnalysis results={results} totals={totals} />

              <div className="summary-grid">
                <SummaryCard
                  title="Coincidencias"
                  value={results.matches.length}
                  icon={FileCheck}
                  colorClass="card-green"
                />
                <SummaryCard
                  title="Discrepancias"
                  value={results.mismatches.length}
                  icon={Activity}
                  colorClass="card-red"
                />
                <SummaryCard
                  title="Faltantes"
                  value={results.missing.length}
                  icon={XCircle}
                  colorClass="card-purple"
                />
                <SummaryCard
                  title="Nuevos/Extras"
                  value={results.surprises.length}
                  icon={DollarSign}
                  colorClass="card-blue"
                />
              </div>

              <ResultsTable results={results} />
            </div>
          )
        }
      </main >
    </div >
  );
}

export default App;
