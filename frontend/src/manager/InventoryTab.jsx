import React, { useState, useEffect } from 'react';

// Додаємо showNotification у деструктуризацію пропсів
export default function InventoryTab({ showNotification }) {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/head/warehouse')
            .then(res => res.json())
            .then(data => { setWarehouseItems(data); setLoading(false); });
    }, []);

    const saveItem = async () => {
        if (!editingItem.item_name || editingItem.item_name.trim() === '') {
            // ЗАМІНА ALERT НА TOAST
            showNotification("⚠️ Будь ласка, введіть назву ресурсу.", "warning");
            return;
        }
        if (editingItem.quantity === undefined || editingItem.quantity === null || editingItem.quantity < 0) {
            // ЗАМІНА ALERT НА TOAST
            showNotification("⚠️ Будь ласка, введіть коректну кількість.", "warning");
            return;
        }
        if (!editingItem.unit_of_measure || editingItem.unit_of_measure.trim() === '') {
            // ЗАМІНА ALERT НА TOAST
            showNotification("⚠️ Будь ласка, введіть одиниці виміру.", "warning");
            return;
        }

        const url = isNew ? '/api/head/warehouse' : `/api/head/warehouse/${editingItem.id}`;
        try {
            const response = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem)
            });

            if (response.ok) {
                // Використовуємо дані з відповіді, якщо потрібно оновити ID
                const savedItem = await response.json();
                if (isNew) {
                    setWarehouseItems([...warehouseItems, savedItem]);
                    // ЗАМІНА ALERT НА TOAST
                    showNotification("📦 Новий ресурс успішно додано!", "success");
                } else {
                    setWarehouseItems(warehouseItems.map(i => i.id === savedItem.id ? savedItem : i));
                    // ЗАМІНА ALERT НА TOAST
                    showNotification("💾 Зміни успішно збережено!", "success");
                }
                setEditingItem(null);
            } else {
                // ЗАМІНА ALERT НА TOAST
                showNotification("🚨 Помилка при збереженні на сервері.", "error");
            }
        } catch (err) {
            console.error("Помилка:", err);
            // ЗАМІНА ALERT НА TOAST
            showNotification("🚨 Критична помилка під час збереження.", "error");
        }
    };

    // ВІДНОВЛЕНО ПОЧАТКОВІ ІНЛАЙН-СТИЛІ, ЯКІ ЗАБЕЗПЕЧУЮТЬ ВЕРСТКУ З image_2.png
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
                    setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '' });
                }}>
                    + ДОДАТИ ТОВАР
                </button>
            </div>

            <div className="coord-table-wrapper">
                <table className="coord-warehouse-table">
                    <thead>
                    <tr>
                        <th>НАЗВА</th>
                        <th>К-ТЬ В НАЯВНОСТІ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {warehouseItems
                        .filter(item => item.item_name.toLowerCase().startsWith(searchQuery.toLowerCase()))
                        .map(item => (
                            <tr key={item.id} onClick={() => { setIsNew(false); setEditingItem(item); }} className="coord-table-row-clickable">
                                <td>{item.item_name}</td>
                                <td>{item.quantity} {item.unit_of_measure}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Модальне вікно */}
            {editingItem && (
                <div className="modal-overlay">
                    <div className="coord-editing-panel glass-panel" style={{ width: '400px', padding: '25px', color: '#1e3a8a' }}>

                        <h3 style={{ marginBottom: '20px', color: '#1e3a8a', textAlign: 'center' }}>
                            {isNew ? 'ДОДАВАННЯ ТОВАРУ' : 'РЕДАГУВАННЯ ТОВАРУ'}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                className="coord-search-input"
                                style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                value={editingItem.item_name}
                                onChange={e => setEditingItem({...editingItem, item_name: e.target.value})}
                                placeholder="Назва ресурсу"
                                required
                            />
                            <input
                                type="number"
                                className="coord-search-input"
                                style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                value={editingItem.quantity}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setEditingItem({...editingItem, quantity: val < 0 ? 0 : val || 0});
                                }}
                                placeholder="Кількість"
                                min="0"
                                required
                            />
                            <input
                                className="coord-search-input"
                                style={{ color: '#1e3a8a', border: '1px solid #1e3a8a' }}
                                value={editingItem.unit_of_measure}
                                onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})}
                                placeholder="Од. виміру (напр. шт)"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <button className="coord-btn-save-item" onClick={saveItem}>
                                {isNew ? 'ДОДАТИ' : 'ЗБЕРЕГТИ'}
                            </button>

                            {!isNew && (
                                <button
                                    onClick={async () => {
                                        if(window.confirm('Видалити цей товар зі складу?')) {
                                            try {
                                                await fetch(`/api/head/warehouse/${editingItem.id}`, { method: 'DELETE' });
                                                setWarehouseItems(warehouseItems.filter(i => i.id !== editingItem.id));
                                                // ЗАМІНА ALERT НА TOAST
                                                showNotification("🗑️ Товар успішно видалено зі складу", "success");
                                                setEditingItem(null);
                                            } catch (err) {
                                                console.error("Помилка:", err);
                                                // ЗАМІНА ALERT НА TOAST
                                                showNotification("🚨 Не вдалося видалити товар з сервера", "error");
                                            }
                                        }
                                    }}
                                    style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    ВИДАЛИТИ
                                </button>
                            )}

                            <button className="coord-btn-cancel-item" onClick={() => setEditingItem(null)}>СКАСУВАТИ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}