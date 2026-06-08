import React, { useState, useEffect } from 'react';

export default function InventoryTab() {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/warehouse')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setWarehouseItems(data);
                }
            })
            .catch(err => console.error("Помилка отримання складу:", err));
    }, []);

    const syncWithServer = (updatedList) => {
        fetch('/api/warehouse/save-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedList)
        })
            .then(res => {
                if (!res.ok) throw new Error();
                console.log("Склад успішно синхронізовано з сервером!");
            })
            .catch(err => console.error("Помилка синхронізації з сервером:", err));
    };

    const handleAddWarehouseItem = () => {
        const newItem = {
            id: crypto.randomUUID(),
            item_name: 'Новий ресурс',
            quantity: 0,
            unit_of_measure: null,
            last_updated_by: null,
            updated_at: new Date().toISOString()
        };

        const updatedList = [...warehouseItems, newItem];
        setWarehouseItems(updatedList);
        setEditingItem(newItem);
        syncWithServer(updatedList);
    };

    const handleDeleteWarehouseItem = (id) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей продукт зі складу?')) {
            const updatedList = warehouseItems.filter(item => item.id !== id);
            setWarehouseItems(updatedList);
            setEditingItem(null);
            syncWithServer(updatedList);
        }
    };

    return (
        <div className="admin-tab-content fade-in">
            <h2 className="tab-title">Облік складу логістики</h2>

            <div className="coord-search-bar-row" style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    className="coord-search-input"
                    placeholder="ПОШУК..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(30, 58, 138, 0.2)' }}
                />
                <button className="coord-btn-search-action" style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>ЗНАЙТИ</button>
            </div>

            <div className="coord-table-control-row" style={{ marginBottom: '15px' }}>
                <button className="coord-btn-add-item" onClick={handleAddWarehouseItem} style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>+ ДОДАТИ</button>
            </div>

            <div className="coord-table-wrapper">
                <table className="coord-warehouse-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(30, 58, 138, 0.1)' }}>
                        <th style={{ padding: '10px' }}>НАЗВА</th>
                        <th style={{ padding: '10px' }}>К-ТЬ В НАЯВНОСТІ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {warehouseItems && warehouseItems
                        .filter(item => item.item_name && item.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(item => (
                            <tr
                                key={item.id}
                                onClick={() => setEditingItem(item)}
                                className="coord-table-row-clickable"
                                style={{ cursor: 'pointer', borderBottom: '1px solid rgba(30, 58, 138, 0.05)' }}
                            >
                                <td style={{ padding: '10px' }}>{item.item_name}</td>
                                <td style={{ padding: '10px' }}>{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="coord-table-hint" style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    💡 при натисканні на рядок відкривається форма редагування
                </div>
            </div>

            {editingItem && (
                <div className="coord-editing-panel fade-in" style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px', border: '1px solid rgba(30, 58, 138, 0.1)' }}>
                    <h4>Редагування ресурсу: {editingItem.item_name}</h4>
                    <div className="coord-editing-inputs" style={{ display: 'flex', gap: '10px', margin: '10px 0' }}>
                        <input
                            type="text"
                            value={editingItem.item_name}
                            onChange={(e) => setEditingItem({...editingItem, item_name: e.target.value})}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(30, 58, 138, 0.2)' }}
                        />
                        <input
                            type="number"
                            value={editingItem.quantity}
                            onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 0})}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(30, 58, 138, 0.2)' }}
                        />
                    </div>
                    <div className="coord-editing-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="coord-btn-save-item" onClick={() => {
                            const updatedList = warehouseItems.map(i => i.id === editingItem.id ? editingItem : i);
                            setWarehouseItems(updatedList);
                            setEditingItem(null);
                            syncWithServer(updatedList);
                        }} style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Зберегти зміни</button>

                        <button className="coord-btn-cancel-item" onClick={() => setEditingItem(null)} style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Скасувати</button>

                        <button
                            className="coord-btn-delete-item"
                            onClick={() => handleDeleteWarehouseItem(editingItem.id)}
                            style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}