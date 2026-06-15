import React, { useState, useEffect } from 'react';

export default function InventoryTab({ showNotification }) {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Стан для історії
    const [showHistory, setShowHistory] = useState(false);
    const [itemHistory, setItemHistory] = useState([]);

    const loadInventory = async () => {
        try {
            const res = await fetch('/api/head/warehouse');
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

    const fetchHistory = async (itemId) => {
        try {
            const res = await fetch(`/api/warehouse/history/${itemId}`);
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

    const handleDelete = async () => {
        if(window.confirm('Видалити цей тип товару? Увага: це також видалить усю історію транзакцій для нього!')) {
            try {
                const response = await fetch(`/api/head/warehouse/${editingItem.id}`, { method: 'DELETE' });
                if (response.ok) {
                    await loadInventory();
                    showNotification("🗑️ Товар успішно видалено", "success");
                    setEditingItem(null);
                } else {
                    showNotification("🚨 Не вдалося видалити товар", "error");
                }
            } catch (err) {
                showNotification("🚨 Помилка при видаленні", "error");
            }
        }
    };

    return (
        <div className="admin-tab-content fade-in">
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

            {/* Модальне вікно */}
            {editingItem && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="coord-editing-panel glass-panel" style={{ width: showHistory ? '700px' : '400px', padding: '25px', color: '#1e3a8a', maxHeight: '80vh', overflowY: 'auto' }}>

                        {!showHistory ? (
                            <>
                                <h3 style={{ marginBottom: '20px', color: '#1e3a8a', textAlign: 'center' }}>
                                    {isNew ? 'ДОДАВАННЯ ТОВАРУ' : 'РЕДАГУВАННЯ ТОВАРУ'}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Назва ресурсу:</label>
                                    <input
                                        className="coord-search-input"
                                        style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                        value={editingItem.item_name}
                                        onChange={e => setEditingItem({...editingItem, item_name: e.target.value})}
                                        placeholder="Назва ресурсу"
                                    />

                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Одиниці виміру:</label>
                                    <input
                                        className="coord-search-input"
                                        style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                        value={editingItem.unit_of_measure}
                                        onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})}
                                        placeholder="Од. виміру (напр. шт)"
                                    />

                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Оціночна вартість (₴):</label>
                                    <input
                                        type="number"
                                        className="coord-search-input"
                                        style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                        value={editingItem.unit_price}
                                        onChange={e => setEditingItem({...editingItem, unit_price: parseFloat(e.target.value) || 0})}
                                        placeholder="Ціна за одиницю"
                                        min="0"
                                    />

                                    {!isNew && (
                                        <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '5px', fontSize: '0.9rem' }}>
                                            <strong>Поточний залишок:</strong> {editingItem.quantity} {editingItem.unit_of_measure}
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                                (Кількість змінюється координаторами через надходження та списання)
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="coord-btn-save-item" style={{ flex: 1 }} onClick={saveItem}>
                                            {isNew ? 'ДОДАТИ' : 'ЗБЕРЕГТИ'}
                                        </button>
                                        <button className="coord-btn-cancel-item" style={{ flex: 1 }} onClick={() => setEditingItem(null)}>
                                            СКАСУВАТИ
                                        </button>
                                    </div>

                                    {!isNew && (
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <button
                                                style={{ flex: 1, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                onClick={() => fetchHistory(editingItem.id)}
                                            >
                                                📜 ІСТОРІЯ ТРАНЗАКЦІЙ
                                            </button>
                                            <button
                                                style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                onClick={handleDelete}
                                            >
                                                🗑️ ВИДАЛИТИ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 style={{ marginBottom: '20px', color: '#1e3a8a', textAlign: 'center' }}>
                                    ІСТОРІЯ РУХУ: {editingItem.item_name}
                                </h3>

                                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                                    {itemHistory.length === 0 ? (
                                        <p style={{ textAlign: 'center' }}>Історія транзакцій порожня.</p>
                                    ) : (
                                        <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                            <thead>
                                            <tr style={{ borderBottom: '2px solid #cbd5e1' }}>
                                                <th style={{ padding: '8px' }}>Точний час</th>
                                                <th style={{ padding: '8px' }}>Тип</th>
                                                <th style={{ padding: '8px' }}>К-ть</th>
                                                <th style={{ padding: '8px' }}>Логістика</th>
                                                <th style={{ padding: '8px' }}>Користувач</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {itemHistory.map(txn => (
                                                <tr key={txn.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                                                    <td style={{padding: '8px', whiteSpace: 'nowrap'}}>
                                                        {txn.transaction_date ? new Date(txn.transaction_date).toLocaleString('uk-UA', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                                        }) : '—'}
                                                    </td>
                                                    <td style={{padding: '8px'}}>
                                                        {txn.type === 'ADDITION' ? (
                                                            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 Надх.</span>
                                                        ) : (
                                                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>🔴 Спис.</span>
                                                        )}
                                                    </td>
                                                    <td style={{padding: '8px', fontWeight: 'bold'}}>
                                                        {txn.quantity_changed > 0 ? `+${txn.quantity_changed}` : txn.quantity_changed}
                                                    </td>
                                                    <td style={{padding: '8px'}}>
                                                        {txn.transportation_cost ? `${txn.transportation_cost} ₴` : '-'}
                                                    </td>
                                                    <td style={{padding: '8px'}}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.85rem'}}>
                                                                {txn.user_full_name || 'Невідомий'}
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
                                    className="coord-btn-cancel-item"
                                    style={{width: '100%'}}
                                    onClick={() => setShowHistory(false)}
                                >
                                    НАЗАД ДО РЕДАГУВАННЯ
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}