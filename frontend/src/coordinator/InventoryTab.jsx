import React, { useState, useEffect, useRef } from 'react';
import './Coordinator.css';
import { API_BASE_URL } from '../App';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-item toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close-btn" onClick={onClose}>✕</button>
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, видалити", cancelText = "Скасувати", isDanger = true }) => {
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && isOpen && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">{isDanger ? '🗑️' : '⚠️'}</div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">{message}</p>
                <div className="custom-confirm-actions">
                    <button className="btn-confirm-cancel" onClick={onClose}>{cancelText}</button>
                    <button className={`btn-confirm-execute ${isDanger ? 'danger-action' : ''}`} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default function InventoryTab() {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [modalMode, setModalMode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [requests, setRequests] = useState([]);
    const [transactionQty, setTransactionQty] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState('');
    const [transportCost, setTransportCost] = useState('');
    const [itemHistory, setItemHistory] = useState([]);

    const [isProcessing, setIsProcessing] = useState(false);

    const [toasts, setToasts] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const hasLoadedRef = useRef(false);
    const toastShownRef = useRef(false);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

    const loadInventory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/warehouse`);
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            setWarehouseItems(Array.isArray(data) ? data : []);
            if (!toastShownRef.current) {
                toastShownRef.current = true;
                addToast("📦 Склад успішно завантажено", "success");
            }
        } catch (err) {
            addToast("🚨 Помилка завантаження складу", "error");
        }
    };

    useEffect(() => {
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadInventory();
        }
    }, []);

    const filteredItems = warehouseItems.filter(item =>
        item.item_name?.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const createNewItemType = async () => {
        if (!editingItem.item_name?.trim() || !editingItem.unit_of_measure?.trim()) {
            addToast("⚠️ Заповніть коректно всі поля.", "warning");
            return;
        }
        if (editingItem.unit_price < 0) {
            addToast("⚠️ Ціна не може бути від'ємною.", "warning");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/warehouse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem)
            });
            if (response.ok) {
                await loadInventory();
                setEditingItem(null);
                setModalMode('');
                addToast("📦 Новий тип товару додано!", "success");
            } else {
                addToast("🚨 Помилка при збереженні", "error");
            }
        } catch (err) {
            addToast("🚨 Критична помилка", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddStock = async () => {
        if (!transactionQty || transactionQty <= 0) {
            addToast("⚠️ Введіть коректну кількість", "warning");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/warehouse/transaction/${editingItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ADDITION',
                    quantity_changed: transactionQty
                })
            });
            if (response.ok) {
                await loadInventory();
                resetTransactionState();
                addToast("✅ Надходження зафіксовано!", "success");
            } else {
                addToast("🚨 Помилка при додаванні (Перевірте авторизацію)", "error");
            }
        } catch (err) {
            addToast("🚨 Критична помилка при додаванні", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignOff = async () => {
        if (!selectedRequestId) {
            addToast("⚠️ Оберіть заявку", "warning");
            return;
        }
        if (!transactionQty || transactionQty <= 0 || transactionQty > editingItem.quantity) {
            addToast("⚠️ Введіть коректну кількість для списання", "warning");
            return;
        }

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/warehouse/book/${editingItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: selectedRequestId,
                    quantity_changed: -Math.abs(transactionQty),
                    transportation_cost: transportCost ? parseFloat(transportCost) : null
                })
            });

            if (response.ok) {
                await loadInventory();
                resetTransactionState();
                addToast("✅ Товар успішно списано на заявку!", "success");
            } else {
                addToast("🚨 Помилка при списанні", "error");
            }
        } catch (err) {
            addToast("🚨 Критична помилка при списанні", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const fetchHistory = async (itemId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/warehouse/history/${itemId}`);
            if (res.ok) {
                const data = await res.json();
                setItemHistory(data);
                setModalMode('history');
            }
        } catch (err) {
            addToast("🚨 Не вдалося завантажити історію", "error");
        }
    };

    const openSignOffMode = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/warehouse/requests/mine`);
            if (res.ok) {
                setRequests(await res.json());
                setModalMode('sign_off');
            } else {
                addToast("🚨 Не вдалося завантажити заявки", "error");
            }
        } catch (err) {
            addToast("🚨 Не вдалося завантажити заявки", "error");
        }
    };

    const resetTransactionState = () => {
        setTransactionQty('');
        setSelectedRequestId('');
        setTransportCost('');
        setModalMode('info');
        setEditingItem(null);
    };

    const performDelete = async () => {
        if (!itemToDelete) return;

        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/warehouse/${itemToDelete.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await loadInventory();
                addToast("🗑️ Товар видалено", "success");
                setModalMode('');
                setEditingItem(null);
            } else {
                addToast("🚨 Не вдалося видалити", "error");
            }
        } catch (err) {
            addToast("🚨 Не вдалося видалити", "error");
        } finally {
            setItemToDelete(null);
            setShowDeleteConfirm(false);
            setIsProcessing(false);
        }
    };

    return (
        <div className="coord-warehouse-section">
            <div className="toast-notifications-container">
                {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />)}
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
                onConfirm={performDelete}
                title="Видалення товару"
                message="Ви впевнені, що хочете видалити цей товар? Увага: це також видалить усю історію транзакцій для нього!"
                confirmText="Так, видалити"
                cancelText="Скасувати"
                isDanger={true}
            />

            <h2 className="tab-title" style={{ marginBottom: '25px' }}>Облік складу логістики</h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <input
                    type="text"
                    id="search_query"
                    name="search_query"
                    className="coord-search-input"
                    placeholder="ПОШУК ТОВАРУ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '350px' }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button className="coord-btn-add-item" onClick={() => {
                    setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '', unit_price: 0 });
                    setModalMode('create');
                }}>
                    + ДОДАТИ НОВИЙ ТИП ТОВАРУ
                </button>
            </div>

            <div className="coord-table-wrapper">
                <table className="coord-warehouse-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead>
                    <tr>
                        <th>НАЗВА</th>
                        <th>ЦІНА (за од.)</th>
                        <th>В НАЯВНОСТІ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredItems.map(item => (
                        <tr
                            key={item.id}
                            onClick={() => {
                                setEditingItem(item);
                                setModalMode('info');
                            }}
                            className="coord-table-row-clickable"
                        >
                            <td>{item.item_name}</td>
                            <td>{item.unit_price} ₴</td>
                            <td>{item.quantity} {item.unit_of_measure}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {modalMode && editingItem && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setModalMode('');
                        setEditingItem(null);
                    }
                }}>
                    <div className="coord-modal-content" style={{
                        width: modalMode === 'history' ? '750px' : '450px',
                        padding: '0',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'white',
                        borderRadius: '20px',
                        overflow: 'hidden'
                    }}>

                        {modalMode === 'create' && (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            НОВИЙ ТИП ТОВАРУ
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setModalMode('');
                                                setEditingItem(null);
                                            }}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '25px', overflowY: 'auto', flex: 1, background: 'white' }}>
                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="item_name_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            НАЗВА ТОВАРУ
                                        </label>
                                        <input
                                            id="item_name_input"
                                            name="item_name_input"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            value={editingItem.item_name}
                                            onChange={e => setEditingItem({...editingItem, item_name: e.target.value})}
                                            placeholder="Введіть назву товара"
                                            autoFocus
                                        />
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="unit_measure_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ОДИНИЦІ ВИМІРУ
                                        </label>
                                        <input
                                            id="unit_measure_input"
                                            name="unit_measure_input"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            value={editingItem.unit_of_measure}
                                            onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})}
                                            placeholder="шт, кг, л, м², т..."
                                        />
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="unit_price_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ЦІНА ЗА ОДИНИЦЮ (₴)
                                        </label>
                                        <input
                                            id="unit_price_input"
                                            name="unit_price_input"
                                            type="number"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            value={editingItem.unit_price}
                                            onChange={e => setEditingItem({...editingItem, unit_price: parseFloat(e.target.value) || 0})}
                                            placeholder="0"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div style={{ padding: '0 25px 25px 25px', background: 'white' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#1e3a8a',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={createNewItemType}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'ОБРОБКА...' : 'СТВОРИТИ'}
                                        </button>
                                        <button
                                            style={{
                                                background: '#e2e8f0',
                                                color: '#1e3a8a',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={() => {
                                                setModalMode('');
                                                setEditingItem(null);
                                            }}
                                            disabled={isProcessing}
                                        >
                                            СКАСУВАТИ
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modalMode === 'info' && (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            {editingItem.item_name}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setModalMode('');
                                                setEditingItem(null);
                                            }}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '25px', background: 'white' }}>
                                    <div style={{
                                        background: '#f1f5f9',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        marginBottom: '20px',
                                        borderLeft: '4px solid #3b82f6'
                                    }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <strong style={{ color: '#1e3a8a' }}>В наявності:</strong>
                                            <span style={{ color: '#1e3a8a', marginLeft: '8px' }}>{editingItem.quantity} {editingItem.unit_of_measure}</span>
                                        </div>
                                        <div>
                                            <strong style={{ color: '#1e3a8a' }}>Ціна за 1 одиницю:</strong>
                                            <span style={{ color: '#1e3a8a', marginLeft: '8px' }}>{editingItem.unit_price} ₴</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#1e3a8a',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center'
                                            }}
                                            onClick={() => setModalMode('add_stock')}
                                        >
                                            ДОДАТИ НАДХОДЖЕННЯ
                                        </button>
                                        <button
                                            style={{
                                                background: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center'
                                            }}
                                            onClick={openSignOffMode}
                                        >
                                            СПИСАТИ НА ЗАЯВКУ
                                        </button>
                                        <button
                                            style={{
                                                background: '#3b82f6',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center'
                                            }}
                                            onClick={() => fetchHistory(editingItem.id)}
                                        >
                                            ІСТОРІЯ ТРАНЗАКЦІЙ
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '0 25px 25px 25px', background: 'white' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#e2e8f0',
                                                color: '#1e3a8a',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={() => {
                                                setModalMode('');
                                                setEditingItem(null);
                                            }}
                                        >
                                            ЗАКРИТИ
                                        </button>
                                        <button
                                            style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={() => {
                                                setItemToDelete(editingItem);
                                                setShowDeleteConfirm(true);
                                            }}
                                        >
                                            ВИДАЛИТИ ТИП
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modalMode === 'add_stock' && (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            ДОДАТИ НАДХОДЖЕННЯ
                                        </h3>
                                        <button
                                            onClick={() => setModalMode('info')}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '25px', background: 'white' }}>
                                    <p style={{ marginBottom: '15px', color: '#1e3a8a', fontWeight: 'bold' }}>
                                        {editingItem.item_name}
                                    </p>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="add_stock_qty" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            КІЛЬКІСТЬ НАДХОДЖЕННЯ
                                        </label>
                                        <input
                                            id="add_stock_qty"
                                            name="add_stock_qty"
                                            type="number"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="Введіть кількість"
                                            value={transactionQty}
                                            onChange={(e) => setTransactionQty(Math.max(0, parseInt(e.target.value) || 0))}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div style={{ padding: '0 25px 25px 25px', background: 'white' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#1e3a8a',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={handleAddStock}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'ОБРОБКА...' : 'ПІДТВЕРДИТИ'}
                                        </button>
                                        <button
                                            style={{
                                                background: '#e2e8f0',
                                                color: '#1e3a8a',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={() => setModalMode('info')}
                                            disabled={isProcessing}
                                        >
                                            НАЗАД
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modalMode === 'sign_off' && (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            СПИСАННЯ ТОВАРУ
                                        </h3>
                                        <button
                                            onClick={() => setModalMode('info')}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '25px', background: 'white' }}>
                                    <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#1e3a8a' }}>
                                        {editingItem.item_name} | В наявності: {editingItem.quantity} {editingItem.unit_of_measure}
                                    </p>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="request_select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ОБЕРІТЬ ЗАЯВКУ
                                        </label>
                                        <select
                                            id="request_select"
                                            name="request_select"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            value={selectedRequestId}
                                            onChange={(e) => setSelectedRequestId(e.target.value)}
                                        >
                                            <option value="">-- Оберіть заявку --</option>
                                            {requests.map(req => (
                                                <option key={req.id} value={req.id}>{req.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="sign_off_qty" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            КІЛЬКІСТЬ ДО СПИСАННЯ
                                        </label>
                                        <input
                                            id="sign_off_qty"
                                            name="sign_off_qty"
                                            type="number"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="Кількість до списання"
                                            value={transactionQty}
                                            onChange={(e) => setTransactionQty(Math.max(0, parseInt(e.target.value) || 0))}
                                            max={editingItem.quantity}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label htmlFor="transport_cost_input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ВАРТІСТЬ ТРАНСПОРТУВАННЯ (₴)
                                        </label>
                                        <input
                                            id="transport_cost_input"
                                            name="transport_cost_input"
                                            type="number"
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                fontSize: '0.95rem',
                                                color: '#1e3a8a',
                                                transition: 'all 0.2s',
                                                boxSizing: 'border-box'
                                            }}
                                            placeholder="Опціонально"
                                            value={transportCost}
                                            onChange={(e) => setTransportCost(e.target.value)}
                                            step="0.01"
                                        />
                                    </div>

                                    <div style={{
                                        background: '#f1f5f9',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        margin: '15px 0',
                                        borderLeft: '4px solid #f59e0b'
                                    }}>
                                        <div><strong>💰 Загальна вартість товару:</strong> {(transactionQty * editingItem.unit_price).toFixed(2)} ₴</div>
                                        <div><strong>📦 Залишок після списання:</strong> {editingItem.quantity - transactionQty} {editingItem.unit_of_measure}</div>
                                    </div>
                                </div>

                                <div style={{ padding: '0 25px 25px 25px', background: 'white' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            style={{
                                                background: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={handleSignOff}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'ОБРОБКА...' : 'СПИСАТИ'}
                                        </button>
                                        <button
                                            style={{
                                                background: '#e2e8f0',
                                                color: '#1e3a8a',
                                                border: 'none',
                                                padding: '12px 20px',
                                                borderRadius: '12px',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                textAlign: 'center',
                                                flex: 1
                                            }}
                                            onClick={() => setModalMode('info')}
                                            disabled={isProcessing}
                                        >
                                            НАЗАД
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {modalMode === 'history' && (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            ІСТОРІЯ РУХУ: {editingItem.item_name}
                                        </h3>
                                        <button
                                            onClick={() => setModalMode('info')}
                                            style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                border: 'none',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '25px', background: 'white' }}>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                                        {itemHistory.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', fontSize: '0.95rem' }}>
                                                Історія транзакцій порожня
                                                <div style={{ fontSize: '0.8rem', marginTop: '8px', color: '#94a3b8' }}>
                                                    Транзакції з'являться після надходжень або списань
                                                </div>
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                <thead>
                                                <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#f8fafc', color: '#1e3a8a', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>ТОЧНИЙ ЧАС</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#f8fafc', color: '#1e3a8a', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>ТИП</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#f8fafc', color: '#1e3a8a', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>КІЛЬКІСТЬ</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#f8fafc', color: '#1e3a8a', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>ЛОГІСТИКА</th>
                                                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#f8fafc', color: '#1e3a8a', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>КОРИСТУВАЧ</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {itemHistory.map(txn => (
                                                    <tr key={txn.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#334155', fontWeight: '500' }}>
                                                            {new Date(txn.transaction_date).toLocaleString('uk-UA', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ padding: '10px 8px' }}>
                                                            {txn.type === 'ADDITION' ? (
                                                                <span style={{ display: 'inline-block', background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.7rem' }}>🟢 НАДХ.</span>
                                                            ) : (
                                                                <span style={{ display: 'inline-block', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.7rem' }}>🔴 СПИС.</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '10px 8px', fontWeight: 'bold', color: txn.quantity_changed > 0 ? '#16a34a' : '#dc2626' }}>
                                                            {txn.quantity_changed > 0 ? `+${txn.quantity_changed}` : txn.quantity_changed}
                                                        </td>
                                                        <td style={{ padding: '10px 8px' }}>
                                                            {txn.transportation_cost ? (
                                                                <span style={{ fontWeight: 600, color: '#1e3a8a' }}>{txn.transportation_cost} ₴</span>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8' }}>—</span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '10px 8px' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.85rem' }}>
                                                                        {txn.user_full_name || 'Невідомий користувач'}
                                                                    </span>
                                                                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b' }}>
                                                                        {txn.user_id}
                                                                    </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    <button
                                        style={{
                                            width: '100%',
                                            background: '#e2e8f0',
                                            color: '#1e3a8a',
                                            border: 'none',
                                            padding: '12px 20px',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setModalMode('info')}
                                    >
                                        НАЗАД ДО РЕДАГУВАННЯ
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}