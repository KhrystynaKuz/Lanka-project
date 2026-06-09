import React, { useState, useEffect } from 'react';
import './Coordinator.css';

export default function InventoryTab() {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingMode, setBookingMode] = useState(false);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const loadInventory = async () => {
            try {
                const res = await fetch('/api/warehouse');
                if (!res.ok) throw new Error('Network error');
                const data = await res.json();
                setWarehouseItems(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Помилка завантаження складу:", err);
            }
        };
        loadInventory();
    }, []);

    const filteredItems = warehouseItems.filter(item =>
        item.item_name?.toLowerCase().startsWith(searchQuery.toLowerCase().trim())
    );

    const saveItem = async () => {
        if (!editingItem.item_name?.trim() || editingItem.quantity < 0) {
            alert("Будь ласка, заповніть коректно всі поля.");
            return;
        }

        const url = isNew ? '/api/warehouse' : `/api/warehouse/${editingItem.id}`;
        const method = isNew ? 'POST' : 'PUT';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingItem)
        });

        if (response.ok) {
            fetch('/api/warehouse').then(res => res.json()).then(setWarehouseItems);
            setEditingItem(null);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Видалити цей товар зі складу?')) {
            await fetch(`/api/warehouse/${editingItem.id}`, { method: 'DELETE' });
            setWarehouseItems(prev => prev.filter(i => i.id !== editingItem.id));
            setEditingItem(null);
        }
    };

    const handleBook = async (reqId, qty) => {
        if (!reqId || qty <= 0) return alert("Введіть коректні дані");
        await fetch(`/api/warehouse/book/${editingItem.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: reqId, quantity_changed: qty })
        });
        setBookingMode(false);
        setEditingItem(null);
        fetch('/api/warehouse').then(res => res.json()).then(setWarehouseItems);
    };

    return (
        <div className="coord-warehouse-section">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <input
                    className="coord-search-input"
                    placeholder="ПОШУК ТОВАРУ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="coord-table-control-row">
                <button className="coord-btn-add-item" onClick={() => { setIsNew(true); setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0, unit_of_measure: '' }); }}>+ ДОДАТИ ТОВАР</button>
            </div>

            <table className="coord-warehouse-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead><tr><th>НАЗВА</th><th>К-ТЬ В НАЯВНОСТІ</th></tr></thead>
                <tbody>
                {filteredItems.map(item => (
                    <tr key={item.id} onClick={() => { setIsNew(false); setEditingItem(item); }} className="coord-table-row-clickable">
                        <td>{item.item_name}</td>
                        <td>{item.quantity} {item.unit_of_measure}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Модальне вікно редагування */}
            {editingItem && !bookingMode && (
                <div className="modal-overlay">
                    <div className="coord-modal-content">
                        <h3 className="coord-modal-title">{isNew ? 'ДОДАВАННЯ ТОВАРУ' : 'РЕДАГУВАННЯ ТОВАРУ'}</h3>

                        <input className="coord-modal-input" value={editingItem.item_name} onChange={e => setEditingItem({...editingItem, item_name: e.target.value})} placeholder="Назва" />
                        <input type="number" className="coord-modal-input" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: Math.max(0, parseInt(e.target.value) || 0)})} placeholder="Кількість" />
                        <input className="coord-modal-input" value={editingItem.unit_of_measure} onChange={e => setEditingItem({...editingItem, unit_of_measure: e.target.value})} placeholder="Од. виміру" />

                        <div className="coord-modal-actions" style={{ flexDirection: 'row', gap: '10px' }}>
                            <button className="btn-save" style={{ margin: 0 }} onClick={saveItem}>{isNew ? 'ДОДАТИ' : 'ЗБЕРЕГТИ'}</button>
                            {!isNew && <button className="btn-delete" style={{ margin: 0 }} onClick={handleDelete}>ВИДАЛИТИ</button>}
                            <button className="btn-cancel" style={{ margin: 0 }} onClick={() => setEditingItem(null)}>СКАСУВАТИ</button>
                        </div>

                        {!isNew && (
                            <button
                                className="btn-save"
                                style={{ background: '#f59e0b', marginTop: '10px' }}
                                onClick={async () => {
                                    const res = await fetch('/api/warehouse/requests/mine');
                                    if (res.ok) {
                                        const data = await res.json();
                                        setRequests(data);
                                        setBookingMode(true);
                                    } else {
                                        alert("Не вдалося завантажити ваші заявки.");
                                    }
                                }}
                            >
                                ЗАБРОНЮВАТИ
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Модальне вікно бронювання */}
            {bookingMode && (
                <div className="modal-overlay">
                    <div className="coord-modal-content">
                        <h3 className="coord-modal-title">БРОНЮВАННЯ</h3>

                        {/* Випадаючий список з назвами заявок */}
                        <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' }}>
                            Оберіть заявку:
                        </label>
                        <select
                            id="b_req"
                            className="coord-modal-input"
                            style={{ marginBottom: '15px', padding: '10px', borderRadius: '8px' }}
                        >
                            <option value="">-- Оберіть заявку --</option>
                            {requests.map(req => (
                                <option key={req.id} value={req.id}>
                                    {req.title}
                                </option>
                            ))}
                        </select>

                        <input
                            id="b_qty"
                            type="number"
                            className="coord-modal-input"
                            placeholder="Кількість до списання"
                        />

                        <div className="coord-modal-actions" style={{ flexDirection: 'row', gap: '10px' }}>
                            <button
                                className="btn-save"
                                style={{ margin: 0 }}
                                onClick={() => handleBook(
                                    document.getElementById('b_req').value,
                                    parseInt(document.getElementById('b_qty').value)
                                )}
                            >
                                ПІДТВЕРДИТИ
                            </button>
                            <button
                                className="btn-cancel"
                                style={{ margin: 0 }}
                                onClick={() => setBookingMode(false)}
                            >
                                НАЗАД
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}