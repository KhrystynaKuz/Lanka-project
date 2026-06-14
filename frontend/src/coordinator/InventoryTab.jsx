import React, { useState, useEffect, useRef } from 'react';
import './Coordinator.css';

// Компонент тосту
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

// Компонент модального вікна підтвердження
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
                <p className="custom-confirm-text">{message || "Ви впевнені, що хочете видалити цей товар? Цю дію не можна скасувати."}</p>
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
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingMode, setBookingMode] = useState(false);
    const [requests, setRequests] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState('');
    const [bookingQuantity, setBookingQuantity] = useState('');

    const hasLoadedRef = useRef(false);
    const toastShownRef = useRef(false);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => setToasts(prev => prev.filter(toast => toast.id !== id));

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;

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
                console.error("Помилка завантаження складу:", err);
                if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    addToast("🚨 Помилка завантаження складу", "error");
                }
            }
        };

        loadInventory();
    }, []);

    const filteredItems = warehouseItems.filter(item =>
        item.item_name?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())
    );

    const saveItem = async () => {
        if (!editingItem.item_name?.trim() || editingItem.quantity < 0) {
            addToast("⚠️ Будь ласка, заповніть коректно всі поля.", "warning");
            return;
        }

        const url = isNew ? '/api/warehouse' : `/api/warehouse/${editingItem.id}`;
        const method = isNew ? 'POST' : 'PUT';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem)
            });

            if (response.ok) {
                const res = await fetch('/api/warehouse');
                const data = await res.json();
                setWarehouseItems(Array.isArray(data) ? data : []);
                setEditingItem(null);
                addToast(isNew ? "📦 Новий товар успішно додано!" : "💾 Товар успішно оновлено!", "success");
            } else {
                addToast("🚨 Помилка при збереженні товару.", "error");
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Критична помилка під час збереження.", "error");
        }
    };

    const performDelete = async () => {
        if (!itemToDelete) return;

        try {
            await fetch(`/api/warehouse/${itemToDelete.id}`, { method: 'DELETE' });
            const res = await fetch('/api/warehouse');
            const data = await res.json();
            setWarehouseItems(Array.isArray(data) ? data : []);
            setEditingItem(null);
            addToast("🗑️ Товар успішно видалено зі складу", "success");
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Не вдалося видалити товар", "error");
        } finally {
            setItemToDelete(null);
        }
    };

    const handleDeleteClick = () => {
        const currentItem = editingItem;
        setEditingItem(null);

        setTimeout(() => {
            if (sessionStorage.getItem('dontShowInventoryConfirm') === 'true') {
                setItemToDelete(currentItem);
                performDelete();
            } else {
                setItemToDelete(currentItem);
                setShowDeleteConfirm(true);
            }
        }, 50);
    };

    const handleBook = async () => {
        if (!selectedRequestId || selectedRequestId === '') {
            addToast("⚠️ Будь ласка, оберіть заявку", "warning");
            return;
        }

        if (!bookingQuantity || bookingQuantity <= 0) {
            addToast("⚠️ Введіть коректну кількість для бронювання", "warning");
            return;
        }

        try {
            const response = await fetch(`/api/warehouse/book/${editingItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: selectedRequestId,
                    quantity_changed: bookingQuantity
                })
            });

            if (response.ok) {
                setBookingMode(false);
                setSelectedRequestId('');
                setBookingQuantity('');
                setEditingItem(null);
                const res = await fetch('/api/warehouse');
                const data = await res.json();
                setWarehouseItems(Array.isArray(data) ? data : []);
                addToast("✅ Товар успішно заброньовано!", "success");
            } else {
                addToast("🚨 Помилка при бронюванні товару", "error");
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка при бронюванні товару", "error");
        }
    };

    const openBookingModal = async () => {
        try {
            const res = await fetch('/api/warehouse/requests/mine');
            if (res.ok) {
                const data = await res.json();
                setRequests(Array.isArray(data) ? data : []);
                setSelectedRequestId('');
                setBookingQuantity('');
                setBookingMode(true);

                if (data.length === 0) {
                    addToast("📋 У вас немає активних заявок для бронювання", "info");
                }
            } else {
                addToast("🚨 Не вдалося завантажити ваші заявки.", "error");
            }
        } catch (err) {
            console.error("Помилка:", err);
            addToast("🚨 Помилка завантаження заявок", "error");
        }
    };

    return (
        <div className="coord-warehouse-section">
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                ))}
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
                onConfirm={performDelete}
                title="Остаточне видалення"
                message="Ви впевнені, що хочете видалити цей товар зі складу? Цю дію не можна скасувати."
                confirmText="Так, видалити"
                cancelText="Скасувати"
                isDanger={true}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <input className="coord-search-input" placeholder="ПОШУК ТОВАРУ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="coord-table-control-row">
                <button className="coord-btn-add-item" onClick={() => { setIsNew(true); setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '' }); }}>+ ДОДАТИ ТОВАР</button>
            </div>

            <table className="coord-warehouse-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                <tr><th>НАЗВА</th><th>К-ТЬ В НАЯВНОСТІ</th></tr>
                </thead>
                <tbody>
                {filteredItems.map(item => (
                    <tr key={item.id} onClick={() => { setIsNew(false); setEditingItem(item); }} className="coord-table-row-clickable">
                        <td>{item.item_name}</td>
                        <td>{item.quantity} {item.unit_of_measure}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {editingItem && !bookingMode && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="coord-modal-content">
                        <h3 className="coord-modal-title">{isNew ? 'ДОДАВАННЯ ТОВАРУ' : 'РЕДАГУВАННЯ ТОВАРУ'}</h3>

                        <input className="coord-modal-input" value={editingItem.item_name} onChange={e => setEditingItem({...editingItem, item_name: e.target.value})} placeholder="Назва" />
                        <input type="number" className="coord-modal-input" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: Math.max(0, parseInt(e.target.value) || 0)})} placeholder="Кількість" />
                        <input className="coord-modal-input" value={editingItem.unit_of_measure} onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})} placeholder="Од. виміру" />

                        <div className="coord-modal-actions" style={{ flexDirection: 'row', gap: '10px' }}>
                            <button className="btn-save" style={{ margin: 0 }} onClick={saveItem}>{isNew ? 'ДОДАТИ' : 'ЗБЕРЕГТИ'}</button>
                            {!isNew && <button className="btn-delete" style={{ margin: 0 }} onClick={handleDeleteClick}>ВИДАЛИТИ</button>}
                            <button className="btn-cancel" style={{ margin: 0 }} onClick={() => setEditingItem(null)}>СКАСУВАТИ</button>
                        </div>

                        {!isNew && (
                            <button className="btn-save" style={{ background: '#f59e0b', marginTop: '10px' }} onClick={openBookingModal}>
                                ЗАБРОНЮВАТИ
                            </button>
                        )}
                    </div>
                </div>
            )}

            {bookingMode && editingItem && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="coord-modal-content">
                        <h3 className="coord-modal-title">БРОНЮВАННЯ: {editingItem.item_name}</h3>

                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' }}>
                            Оберіть заявку:
                        </label>
                        <select
                            className="coord-modal-input"
                            style={{ marginBottom: '15px', padding: '10px', borderRadius: '8px' }}
                            value={selectedRequestId}
                            onChange={(e) => setSelectedRequestId(e.target.value)}
                        >
                            <option value="">-- Оберіть заявку --</option>
                            {requests.length === 0 ? (
                                <option value="" disabled>Немає доступних заявок</option>
                            ) : (
                                requests.map(req => (
                                    <option key={req.id} value={req.id}>
                                        {req.title} {req.status ? `(${req.status})` : ''}
                                    </option>
                                ))
                            )}
                        </select>

                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block', marginTop: '10px' }}>
                            Кількість до списання:
                        </label>
                        <input
                            type="number"
                            className="coord-modal-input"
                            placeholder="Кількість до списання"
                            value={bookingQuantity}
                            onChange={(e) => setBookingQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                            min="1"
                            max={editingItem.quantity}
                        />

                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px', marginBottom: '15px' }}>
                            Доступно на складі: {editingItem.quantity} {editingItem.unit_of_measure}
                        </div>

                        <div className="coord-modal-actions" style={{ flexDirection: 'row', gap: '10px' }}>
                            <button className="btn-save" style={{ margin: 0 }} onClick={handleBook}>
                                ПІДТВЕРДИТИ
                            </button>
                            <button className="btn-cancel" style={{ margin: 0 }} onClick={() => {
                                setBookingMode(false);
                                setSelectedRequestId('');
                                setBookingQuantity('');
                            }}>
                                НАЗАД
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}