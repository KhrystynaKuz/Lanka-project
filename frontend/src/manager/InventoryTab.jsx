import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../App';

/**
 * Компонент модального вікна підтвердження дії.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isOpen - Чи відкрито модальне вікно.
 * @param {Function} props.onClose - Функція закриття вікна.
 * @param {Function} props.onConfirm - Функція підтвердження дії.
 * @param {string} props.title - Заголовок модального вікна.
 * @param {string} props.message - Текст повідомлення.
 * @param {string} [props.confirmText="Так, видалити"] - Текст кнопки підтвердження.
 * @param {string} [props.cancelText="Скасувати"] - Текст кнопки скасування.
 * @param {boolean} [props.isDanger=true] - Чи є дія небезпечною.
 * @returns {JSX.Element|null} Рендер модального вікна або null, якщо закрито.
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Так, видалити", cancelText = "Скасувати", isDanger = true }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-confirm-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
            <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-confirm-icon">
                    {isDanger ? '🗑️' : '⚠️'}
                </div>
                <h3 className="custom-confirm-title">{title || "Підтвердження"}</h3>
                <p className="custom-confirm-text">
                    {message || "Ви впевнені, що хочете виконати цю дію?"}
                </p>
                <div className="custom-confirm-actions">
                    <button className="btn-confirm-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className={`btn-confirm-execute ${isDanger ? 'danger-action' : ''}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Головний компонент вкладки "Склад" для керівника/адміністратора.
 * Відповідає за управління складськими ресурсами: додавання, редагування,
 * видалення товарів, перегляд історії транзакцій та пошук.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.showNotification - Функція для показу сповіщень.
 * @returns {JSX.Element} Рендер вкладки складу.
 */
export default function InventoryTab({ showNotification }) {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [itemHistory, setItemHistory] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, itemId: null });

    /**
     * Завантажує список товарів зі складу з бекенду.
     *
     * @async
     * @returns {Promise<void>}
     */
    const loadInventory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/head/warehouse`);
            if (res.ok) {
                const data = await res.json();
                setWarehouseItems(Array.isArray(data) ? data : []);
            } else {
                throw new Error('Помилка сервера');
            }
        } catch (err) {
            console.error(err);
            showNotification("🚨 Помилка завантаження складу", "error");
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    /**
     * Зберігає новий або оновлює існуючий товар на складі.
     *
     * @async
     * @returns {Promise<void>}
     */
    const saveItem = async () => {
        if (!editingItem.item_name || editingItem.item_name.trim() === '') {
            showNotification("⚠️ Будь ласка, введіть назву ресурсу.", "warning");
            return;
        }
        if (!editingItem.unit_of_measure || editingItem.unit_of_measure.trim() === '') {
            showNotification("⚠️ Будь ласка, введіть одиниці виміру.", "warning");
            return;
        }
        if (editingItem.unit_price === undefined || editingItem.unit_price === null || editingItem.unit_price < 0) {
            showNotification("⚠️ Введіть коректну ціну (не менше 0).", "warning");
            return;
        }

        const url = isNew ? '/api/head/warehouse' : `/api/head/warehouse/${editingItem.id}`;
        try {
            const response = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingItem,
                    quantity: isNew ? 0 : editingItem.quantity
                })
            });

            if (response.ok) {
                await loadInventory();
                showNotification(isNew ? "📦 Новий тип ресурсу успішно додано!" : "💾 Зміни успішно збережено!", "success");
                setEditingItem(null);
            } else {
                showNotification("🚨 Помилка при збереженні на сервері.", "error");
            }
        } catch (err) {
            console.error("Помилка:", err);
            showNotification("🚨 Критична помилка під час збереження.", "error");
        }
    };

    /**
     * Завантажує історію транзакцій для конкретного товару.
     *
     * @async
     * @param {string|number} itemId - Ідентифікатор товару.
     * @returns {Promise<void>}
     */
    const fetchHistory = async (itemId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/warehouse/history/${itemId}`);
            if (res.ok) {
                const data = await res.json();
                setItemHistory(Array.isArray(data) ? data : []);
                setShowHistory(true);
            } else {
                showNotification("🚨 Не вдалося завантажити історію", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("🚨 Помилка при завантаженні історії", "error");
        }
    };

    /**
     * Відкриває модальне вікно підтвердження видалення товару.
     */
    const handleDeleteClick = () => {
        setConfirmDelete({ isOpen: true, itemId: editingItem.id });
    };

    /**
     * Виконує видалення товару з бекенду.
     *
     * @async
     * @returns {Promise<void>}
     */
    const executeDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/head/warehouse/${confirmDelete.itemId}`, { method: 'DELETE' });
            if (response.ok) {
                await loadInventory();
                showNotification("🗑️ Товар успішно видалено", "success");
                setEditingItem(null);
            } else {
                showNotification("🚨 Не вдалося видалити товар", "error");
            }
        } catch (err) {
            showNotification("🚨 Помилка при видаленні", "error");
        } finally {
            setConfirmDelete({ isOpen: false, itemId: null });
        }
    };

    return (
        <div className="admin-tab-content fade-in">
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, itemId: null })}
                onConfirm={executeDelete}
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
                    className="coord-search-input"
                    placeholder="ПОШУК ТОВАРУ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '350px' }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button className="coord-btn-add-item" onClick={() => {
                    setIsNew(true);
                    setShowHistory(false);
                    setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '', unit_price: 0 });
                }}>
                    + ДОДАТИ НОВИЙ ТИП ТОВАРУ
                </button>
            </div>

            <div className="coord-table-wrapper">
                <table className="coord-warehouse-table">
                    <thead>
                    <tr>
                        <th>НАЗВА</th>
                        <th>ЦІНА (за од.)</th>
                        <th>К-ТЬ В НАЯВНОСТІ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {warehouseItems
                        .filter(item => item.item_name?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
                        .map(item => (
                            <tr key={item.id} onClick={() => {
                                setIsNew(false);
                                setShowHistory(false);
                                setEditingItem(item);
                            }} className="coord-table-row-clickable">
                                <td>{item.item_name}</td>
                                <td>{item.unit_price} ₴</td>
                                <td>{item.quantity} {item.unit_of_measure}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingItem && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) setEditingItem(null);
                }}>
                    <div className="glass-panel" style={{
                        width: showHistory ? '750px' : '450px',
                        padding: '0',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'white',
                        backdropFilter: 'none'
                    }}>

                        {!showHistory ? (
                            <>
                                <div style={{
                                    padding: '20px 25px',
                                    background: '#3b82f6',
                                    borderTopLeftRadius: '20px',
                                    borderTopRightRadius: '20px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.35rem', fontWeight: '700' }}>
                                            {isNew ? 'ДОДАВАННЯ ТОВАРУ' : 'РЕДАГУВАННЯ ТОВАРУ'}
                                        </h3>
                                        <button
                                            onClick={() => setEditingItem(null)}
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

                                <div style={{ padding: '25px', overflowY: 'auto', flex: 1, background: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            НАЗВА РЕСУРСУ
                                        </label>
                                        <input
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
                                            placeholder="Введіть назву ресурсу"
                                            autoFocus
                                        />
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ОДИНИЦІ ВИМІРУ
                                        </label>
                                        <input
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
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e3a8a', marginBottom: '6px' }}>
                                            ОЦІНОЧНА ВАРТІСТЬ (₴)
                                        </label>
                                        <input
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

                                    {!isNew && (
                                        <div style={{
                                            background: '#f1f5f9',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            margin: '15px 0',
                                            borderLeft: '4px solid #3b82f6'
                                        }}>
                                            <strong style={{ color: '#1e3a8a', fontSize: '0.9rem' }}>Поточний залишок:</strong>
                                            <span style={{ color: '#1e3a8a', fontSize: '0.9rem', marginLeft: '5px' }}>
                                                {editingItem.quantity} {editingItem.unit_of_measure}
                                            </span>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>
                                                (Кількість змінюється координаторами через надходження та списання)
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
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
                                            onClick={saveItem}
                                        >
                                            {isNew ? 'ДОДАТИ' : 'ЗБЕРЕГТИ'}
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
                                            onClick={() => setEditingItem(null)}
                                        >
                                            СКАСУВАТИ
                                        </button>
                                    </div>

                                    {!isNew && (
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
                                                    textAlign: 'center',
                                                    flex: 1
                                                }}
                                                onClick={() => fetchHistory(editingItem.id)}
                                            >
                                                ІСТОРІЯ ТРАНЗАКЦІЙ
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
                                                onClick={handleDeleteClick}
                                            >
                                                ВИДАЛИТИ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
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
                                            onClick={() => setShowHistory(false)}
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

                                <div style={{ padding: '25px', background: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
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
                                                {itemHistory.map((txn, idx) => (
                                                    <tr key={txn.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#334155', fontWeight: '500' }}>
                                                            {txn.transaction_date ? new Date(txn.transaction_date).toLocaleString('uk-UA', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            }) : '—'}
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
                                        onClick={() => setShowHistory(false)}
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