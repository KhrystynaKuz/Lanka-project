import React, { useState, useEffect, useRef } from 'react';
import './Coordinator.css';

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
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && isOpen && onClose();
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (dontShowAgain) sessionStorage.setItem('dontShowInventoryConfirm', 'true');
        onConfirm();
        onClose();
    };

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">{isDanger ? '🗑️' : '⚠️'}</div>
                <h3 className="custom-confirm-title">{title || "Остаточне видалення"}</h3>
                <p className="custom-confirm-text">{message}</p>
                <div className="modal-checkbox-container">
                    <input type="checkbox" id="dontShowAgain" className="modal-checkbox-input" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                    <label htmlFor="dontShowAgain" className="modal-checkbox-label">Більше не попереджати в цій сесії</label>
                </div>
                <div className="custom-confirm-actions">
                    <button className="btn-confirm-cancel" onClick={onClose}>{cancelText}</button>
                    <button className={`btn-confirm-execute ${isDanger ? 'danger-action' : ''}`} onClick={handleConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default function InventoryTab() {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [modalMode, setModalMode] = useState(''); // 'create', 'info', 'add_stock', 'sign_off', 'history'
    const [searchQuery, setSearchQuery] = useState('');

    // Transaction specific state
    const [requests, setRequests] = useState([]);
    const [transactionQty, setTransactionQty] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState('');
    const [transportCost, setTransportCost] = useState('');
    const [itemHistory, setItemHistory] = useState([]);

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
            const res = await fetch('/api/warehouse');
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

    // Creates a completely new item type (defined by name + unit_price)
    const createNewItemType = async () => {
        if (!editingItem.item_name?.trim() || editingItem.unit_price < 0) {
            addToast("⚠️ Заповніть коректно всі поля.", "warning");
            return;
        }
        try {
            const response = await fetch('/api/warehouse', {
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
        }
    };

    // Adds stock to an existing item type
    const handleAddStock = async () => {
        if (!transactionQty || transactionQty <= 0) {
            addToast("⚠️ Введіть коректну кількість", "warning"); return;
        }
        try {
            const response = await fetch(`/api/warehouse/transaction/${editingItem.id}`, {
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
            }
        } catch (err) {
            addToast("🚨 Помилка при додаванні", "error");
        }
    };

    // Signs off stock for a request
    const handleSignOff = async () => {
        if (!selectedRequestId) {
            addToast("⚠️ Оберіть заявку", "warning"); return;
        }
        if (!transactionQty || transactionQty <= 0 || transactionQty > editingItem.quantity) {
            addToast("⚠️ Введіть коректну кількість для списання", "warning"); return;
        }

        try {
            const response = await fetch(`/api/warehouse/book/${editingItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: selectedRequestId,
                    quantity_changed: -Math.abs(transactionQty), // Always negative for deduction
                    transportation_cost: transportCost ? parseFloat(transportCost) : null
                })
            });

            if (response.ok) {
                await loadInventory();
                resetTransactionState();
                addToast("✅ Товар успішно списано на заявку!", "success");
            }
        } catch (err) {
            addToast("🚨 Помилка при списанні", "error");
        }
    };

    const fetchHistory = async (itemId) => {
        try {
            const res = await fetch(`/api/warehouse/history/${itemId}`);
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
            const res = await fetch('/api/warehouse/requests/mine');
            if (res.ok) {
                setRequests(await res.json());
                setModalMode('sign_off');
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
        try {
            await fetch(`/api/warehouse/${itemToDelete.id}`, { method: 'DELETE' });
            await loadInventory();
            addToast("🗑️ Товар видалено", "success");
        } catch (err) {
            addToast("🚨 Не вдалося видалити", "error");
        } finally {
            setItemToDelete(null);
            setModalMode('');
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
                message="Видалити цей тип товару? Це може вплинути на історію заявок."
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <input className="coord-search-input" placeholder="ПОШУК ТОВАРУ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="coord-table-control-row">
                <button className="coord-btn-add-item" onClick={() => {
                    setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '', unit_price: 0 });
                    setModalMode('create');
                }}>
                    + ДОДАТИ НОВИЙ ТИП ТОВАРУ
                </button>
            </div>

            <table className="coord-warehouse-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                <tr><th>НАЗВА</th><th>ЦІНА (за од.)</th><th>В НАЯВНОСТІ</th></tr>
                </thead>
                <tbody>
                {filteredItems.map(item => (
                    <tr key={item.id} onClick={() => { setEditingItem(item); setModalMode('info'); }} className="coord-table-row-clickable">
                        <td>{item.item_name}</td>
                        <td>{item.unit_price} ₴</td>
                        <td>{item.quantity} {item.unit_of_measure}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* MODAL WORKFLOWS */}
            {modalMode && editingItem && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="coord-modal-content">

                        {/* MODE: CREATE NEW ITEM TYPE */}
                        {modalMode === 'create' && (
                            <>
                                <h3 className="coord-modal-title">НОВИЙ ТИП ТОВАРУ</h3>
                                <input className="coord-modal-input" value={editingItem.item_name} onChange={e => setEditingItem({...editingItem, item_name: e.target.value})} placeholder="Назва товару" />
                                <input className="coord-modal-input" value={editingItem.unit_of_measure} onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})} placeholder="Од. виміру (шт, кг, ящики...)" />
                                <input type="number" className="coord-modal-input" value={editingItem.unit_price} onChange={e => setEditingItem({...editingItem, unit_price: parseFloat(e.target.value) || 0})} placeholder="Ціна за одиницю (₴)" />

                                <div className="coord-modal-actions">
                                    <button className="btn-save" onClick={createNewItemType}>СТВОРИТИ</button>
                                    <button className="btn-cancel" onClick={resetTransactionState}>СКАСУВАТИ</button>
                                </div>
                            </>
                        )}

                        {/* MODE: ITEM INFO & ACTIONS */}
                        {modalMode === 'info' && (
                            <>
                                <h3 className="coord-modal-title">{editingItem.item_name}</h3>
                                <p><strong>В наявності:</strong> {editingItem.quantity} {editingItem.unit_of_measure}</p>
                                <p><strong>Оціночна вартість (за 1):</strong> {editingItem.unit_price} ₴</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                    <button className="btn-save" onClick={() => setModalMode('add_stock')}>➕ ДОДАТИ НАДХОДЖЕННЯ (ТАКОГО Ж ТИПУ)</button>
                                    <button className="btn-save" style={{ background: '#f59e0b' }} onClick={openSignOffMode}>➖ СПИСАТИ НА ЗАЯВКУ</button>
                                    <button className="btn-cancel" style={{ background: '#1e293b', color: 'white' }} onClick={() => fetchHistory(editingItem.id)}>📜 ІСТОРІЯ ТРАНЗАКЦІЙ</button>
                                </div>

                                <div className="coord-modal-actions" style={{ marginTop: '20px' }}>
                                    <button className="btn-cancel" onClick={resetTransactionState}>ЗАКРИТИ</button>
                                    <button className="btn-delete" onClick={() => { setItemToDelete(editingItem); setShowDeleteConfirm(true); }}>ВИДАЛИТИ ТИП</button>
                                </div>
                            </>
                        )}

                        {/* MODE: ADD STOCK */}
                        {modalMode === 'add_stock' && (
                            <>
                                <h3 className="coord-modal-title">ДОДАТИ: {editingItem.item_name}</h3>
                                <input type="number" className="coord-modal-input" placeholder="Кількість надходження" value={transactionQty} onChange={(e) => setTransactionQty(Math.max(0, parseInt(e.target.value) || 0))} />
                                <div className="coord-modal-actions">
                                    <button className="btn-save" onClick={handleAddStock}>ПІДТВЕРДИТИ</button>
                                    <button className="btn-cancel" onClick={() => setModalMode('info')}>НАЗАД</button>
                                </div>
                            </>
                        )}

                        {/* MODE: SIGN OFF (BOOKING) */}
                        {modalMode === 'sign_off' && (
                            <>
                                <h3 className="coord-modal-title">СПИСАННЯ: {editingItem.item_name}</h3>

                                <select className="coord-modal-input" value={selectedRequestId} onChange={(e) => setSelectedRequestId(e.target.value)}>
                                    <option value="">-- Оберіть заявку --</option>
                                    {requests.map(req => <option key={req.id} value={req.id}>{req.title}</option>)}
                                </select>

                                <input type="number" className="coord-modal-input" placeholder="Кількість до списання" value={transactionQty} onChange={(e) => setTransactionQty(Math.max(0, parseInt(e.target.value) || 0))} max={editingItem.quantity} />

                                <input type="number" className="coord-modal-input" placeholder="Вартість транспортування (₴) - Опціонально" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} />

                                <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '5px', margin: '10px 0', fontSize: '0.9rem' }}>
                                    <div><strong>Загальна вартість товару:</strong> {(transactionQty * editingItem.unit_price).toFixed(2)} ₴</div>
                                    <div><strong>Залишок після списання:</strong> {editingItem.quantity - transactionQty} {editingItem.unit_of_measure}</div>
                                </div>

                                <div className="coord-modal-actions">
                                    <button className="btn-save" onClick={handleSignOff}>СПИСАТИ</button>
                                    <button className="btn-cancel" onClick={() => setModalMode('info')}>НАЗАД</button>
                                </div>
                            </>
                        )}

                        {/* MODE: HISTORY */}
                        {modalMode === 'history' && (
                            <>
                                <h3 className="coord-modal-title">ІСТОРІЯ: {editingItem.item_name}</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                                    {itemHistory.length === 0 ? <p>Історія порожня.</p> : (
                                        <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left' }}>
                                            <thead>
                                            <tr><th>Дата</th><th>Тип</th><th>К-ть</th><th>Логістика</th></tr>
                                            </thead>
                                            <tbody>
                                            {itemHistory.map(txn => (
                                                <tr key={txn.id}>
                                                    <td>{new Date(txn.transaction_date).toLocaleDateString()}</td>
                                                    <td>{txn.type === 'ADDITION' ? '🟢 Надх.' : '🔴 Спис.'}</td>
                                                    <td>{txn.quantity_changed}</td>
                                                    <td>{txn.transportation_cost ? `${txn.transportation_cost} ₴` : '-'}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <button className="btn-cancel" style={{ width: '100%' }} onClick={() => setModalMode('info')}>НАЗАД</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}