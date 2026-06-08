import React, { useState, useEffect } from 'react';

export default function InventoryTab() {
    const [warehouseItems, setWarehouseItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/warehouse').then(res => res.json()).then(setWarehouseItems);
    }, []);

    const syncWithServer = (updatedList) => {
        fetch('/api/warehouse/save-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedList)
        });
    };

    return (
        <div className="coord-warehouse-section">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <input className="coord-search-input" placeholder="ПОШУК..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="coord-table-control-row">
                <button className="coord-btn-add-item" onClick={() => { setIsNew(true); setEditingItem({ id: crypto.randomUUID(), item_name: '', quantity: 0 }); }}>+ ДОДАТИ</button>
            </div>
            <table className="coord-warehouse-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead><tr><th>НАЗВА</th><th>К-ТЬ В НАЯВНОСТІ</th></tr></thead>
                <tbody>
                {warehouseItems.filter(item => item.item_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                    <tr key={item.id} onClick={() => { setIsNew(false); setEditingItem(item); }}>
                        <td>{item.item_name}</td><td>{item.quantity}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}