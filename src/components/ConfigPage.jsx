import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Lock, Save, Trash2, X, MapPin, CreditCard } from 'lucide-react';
import './Styles/ConfigPage.css';
import { getKioskBaseUrl, defaultFetchHeaders } from '../utils/kioskApi';

const ADMIN_PIN = '9579';

function flattenKioskConfig(storesPayload) {
  if (!Array.isArray(storesPayload)) return [];
  const rows = [];
  for (const store of storesPayload) {
    const terminals = Array.isArray(store.terminals) ? store.terminals : [];
    for (const t of terminals) {
      rows.push({
        id: `${store.store_id}__${t.terminal_id}`,
        store_id: store.store_id,
        store_code: store.store_code,
        store_name: store.store_name,
        terminal_id: t.terminal_id,
        pinelabs_store_id: t.pinelabs_store_id,
        terminal_labels: t.labels,
      });
    }
  }
  return rows;
}

const ConfigPage = () => {
    const navigate = useNavigate();
    const BASE_URL = getKioskBaseUrl();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    const [terminalRows, setTerminalRows] = useState([]);
    const [selectedRowId, setSelectedRowId] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [currentConfig, setCurrentConfig] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('kiosk_config');
        if (saved) {
            setCurrentConfig(JSON.parse(saved));
        }
    }, []);

    const handlePinChange = (index, value) => {
        if (value.length > 1) value = value[0];

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setPinError('');

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        if (index === 3 && value) {
            const fullPin = newPin.join('');
            if (fullPin === ADMIN_PIN) {
                setIsAuthenticated(true);
                fetchKioskTerminalList();
            } else {
                setPinError('Invalid PIN');
                setPin(['', '', '', '']);
                inputRefs[0].current?.focus();
            }
        }
    };

    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const fetchKioskTerminalList = async () => {
        if (!BASE_URL) {
            setPinError('VITE_Base_url is not set');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/admin/kiosk-config`, {
                headers: { ...defaultFetchHeaders() },
            });
            if (!response.ok) throw new Error('Failed to fetch kiosk configuration');

            const data = await response.json();
            const rows = flattenKioskConfig(data);
            setTerminalRows(rows);

            if (currentConfig) {
                const match = rows.find(
                    (r) =>
                        String(r.store_id) === String(currentConfig.store_id) &&
                        String(r.terminal_id) === String(currentConfig.terminal_id)
                );
                if (match) {
                    setSelectedRowId(match.id);
                    setSelectedRow(match);
                }
            }
        } catch (error) {
            console.error('Error fetching kiosk-config:', error);
            setPinError('Failed to load configurations');
        } finally {
            setLoading(false);
        }
    };

    const handleRowChange = (e) => {
        const id = e.target.value;
        setSelectedRowId(id);

        if (id) {
            const row = terminalRows.find((r) => r.id === id);
            setSelectedRow(row || null);
        } else {
            setSelectedRow(null);
        }
        setSuccessMessage('');
    };

    const handleSaveConfig = () => {
        if (!selectedRow) {
            alert('Please select a store terminal');
            return;
        }

        const configToSave = {
            store_id: selectedRow.store_id,
            store_code: selectedRow.store_code,
            store_name: selectedRow.store_name,
            terminal_id: selectedRow.terminal_id,
            pinelabs_store_id: selectedRow.pinelabs_store_id,
            configured_at: new Date().toISOString(),
        };

        localStorage.setItem('kiosk_config', JSON.stringify(configToSave));
        setCurrentConfig(configToSave);
        setSuccessMessage('Configuration saved!');

        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleClearConfig = () => {
        if (window.confirm('Clear current configuration?')) {
            localStorage.removeItem('kiosk_config');
            setCurrentConfig(null);
            setSelectedRowId('');
            setSelectedRow(null);
            setSuccessMessage('Configuration cleared');
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const formatTerminalOption = (r) =>
        `${r.store_name || r.store_id} · terminal ${r.terminal_id}`;

    if (!isAuthenticated) {
        return (
            <div className="config-overlay">
                <div className="config-pin-modal">
                    <div className="pin-icon">
                        <Lock size={36} />
                    </div>
                    <h2>Admin Access</h2>
                    <p>Enter 4-digit PIN</p>

                    <div className="pin-inputs">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]"
                                maxLength="1"
                                className="pin-digit"
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handlePinKeyDown(index, e)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {pinError && <div className="pin-error">{pinError}</div>}

                    <button onClick={() => navigate('/')} className="cancel-btn-full">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="config-page">
            <div className="config-container">
                <div className="config-header">
                    <div className="header-left">
                        <Settings size={24} />
                        <h1>Kiosk config</h1>
                    </div>
                    <button onClick={() => navigate('/')} className="close-config-btn">
                        <X size={16} />
                        Close
                    </button>
                </div>

                {loading && <div className="loading">Loading...</div>}

                {successMessage && (
                    <div className="success-banner">
                        {successMessage}
                    </div>
                )}

                <div className="config-grid">
                    <div className="config-card current-card">
                        <div className="card-header">
                            <MapPin size={18} />
                            <h3>Active Config</h3>
                        </div>

                        {currentConfig ? (
                            <>
                                <div className="config-info">
                                    <div className="info-row">
                                        <span className="info-label">Store</span>
                                        <span className="info-value">{currentConfig.store_name || currentConfig.store_id}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">PineLabs store</span>
                                        <span className="info-value">{currentConfig.pinelabs_store_id ?? currentConfig.mid_on_device ?? '—'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Terminal (client ID)</span>
                                        <span className="info-value small">{currentConfig.terminal_id}</span>
                                    </div>
                                </div>
                                <button onClick={handleClearConfig} className="clear-btn">
                                    <Trash2 size={14} />
                                    Clear
                                </button>
                            </>
                        ) : (
                            <div className="no-config">
                                <p>Not configured</p>
                            </div>
                        )}
                    </div>

                    <div className="config-card setup-card">
                        <div className="card-header">
                            <CreditCard size={18} />
                            <h3>Select terminal</h3>
                        </div>

                        <select
                            value={selectedRowId}
                            onChange={handleRowChange}
                            className="edc-select"
                        >
                            <option value="">Choose...</option>
                            {terminalRows.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {formatTerminalOption(r)}
                                </option>
                            ))}
                        </select>

                        {terminalRows.length === 0 && !loading && (
                            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.85 }}>
                                No PineLabs terminals returned for active stores. Verify{' '}
                                <code>GET /admin/kiosk-config</code> on the server.
                            </p>
                        )}

                        {selectedRow && (
                            <>
                                <div className="config-info">
                                    <div className="info-row">
                                        <span className="info-label">Store</span>
                                        <span className="info-value">{selectedRow.store_name}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">PineLabs store</span>
                                        <span className="info-value">{selectedRow.pinelabs_store_id ?? '—'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Terminal</span>
                                        <span className="info-value small">{selectedRow.terminal_id}</span>
                                    </div>
                                </div>

                                <button onClick={handleSaveConfig} className="save-btn">
                                    <Save size={14} />
                                    Save Config
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;
