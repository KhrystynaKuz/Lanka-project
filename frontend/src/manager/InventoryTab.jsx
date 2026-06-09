import React, { useState, useEffect } from 'react';

export default function InventoryTab() {
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
            alert("Будь ласка, введіть назву ресурсу.");
            return;
        }
        if (editingItem.quantity === undefined || editingItem.quantity === null || editingItem.quantity < 0) {
            alert("Будь ласка, введіть коректну кількість.");
            return;
        }
        if (!editingItem.unit_of_measure || editingItem.unit_of_measure.trim() === '') {
            alert("Будь ласка, введіть одиниці виміру.");
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
                setWarehouseItems(isNew ? [...warehouseItems, editingItem] : warehouseItems.map(i => i.id === editingItem.id ? editingItem : i));
                setEditingItem(null);
            } else {
                alert("Помилка при збереженні на сервері.");
            }
        } catch (err) {
            console.error("Помилка:", err);
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
                                            await fetch(`/api/head/warehouse/${editingItem.id}`, { method: 'DELETE' });
                                            setWarehouseItems(warehouseItems.filter(i => i.id !== editingItem.id));
                                            setEditingItem(null);
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