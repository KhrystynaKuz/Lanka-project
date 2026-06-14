import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function OrderDetailsModal({ orderId, onClose }) {
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('id', orderId)
                .single();

            if (!error && data) {
                setRequestData(data);
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [orderId]);

    const getStatusLabel = (status) => {
        const statuses = {
            'PENDING': 'В очікуванні',
            'APPROVED': 'Затверджено',
            'IN_PROGRESS': 'В процесі',
            'CLOSED': 'Закрито'
        };
        return statuses[status] || status;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Деталі заявки</h3>
                    <span style={{ fontSize: '12px', color: '#888' }}>ID: {orderId}</span>
                </div>

                {loading ? (
                    <p>Завантаження...</p>
                ) : requestData ? (
                    <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <strong>Назва:</strong>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{requestData.title}</div>
                        </div>
                        <div>
                            <strong>Опис:</strong>
                            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                                {requestData.description}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div>
                                <strong>Статус:</strong> <br/>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                    {getStatusLabel(requestData.status)}
                                </span>
                            </div>
                            <div>
                                <strong>Пріоритет:</strong> <br/>
                                <span>{requestData.priority}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                            <strong>Створено:</strong> {new Date(requestData.created_at).toLocaleString('uk-UA')}
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'red' }}>Помилка завантаження даних заявки.</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}