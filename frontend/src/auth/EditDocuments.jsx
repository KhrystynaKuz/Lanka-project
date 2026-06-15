import React, { useState, useEffect } from 'react';
const API_BASE_URL = 'http://localhost:8080';

const EditDocuments = ({ userId, onBackToDashboard }) => {
    const [rejectionData, setRejectionData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        fetch(`${API_BASE_URL}/api/documents/rejection-info/${userId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Сервер повернув помилку: ' + res.status);
                }
                return res.json();
            })
            .then(data => {
                setRejectionData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Помилка при завантаженні даних:", err);
                setLoading(false);
            });
    }, [userId]);

    const handleRetry = async () => {
        const response = await fetch(`${API_BASE_URL}/api/documents/upload-retry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (response.ok) {
            alert("Успішно!");
            onBackToDashboard();
        }
    };

    if (loading) return <div>Завантаження...</div>;

    if (!rejectionData) return <div>Не вдалося завантажити інформацію про відхилення.</div>;

    return (
        <div className="edit-container" style={{ padding: '20px' }}>
            <div className="alert-error" style={{ border: '1px solid red', padding: '20px', marginBottom: '20px' }}>
                <h2>Ваші документи відхилено</h2>
                <p><strong>Причина:</strong> {rejectionData?.rejection_reason || "Причину не вказано"}</p>
            </div>

            <h3>Завантажте нові документи:</h3>

            <button onClick={handleRetry} style={{ marginRight: '10px' }}>Надіслати на повторну перевірку</button>

            <button onClick={onBackToDashboard} style={{ background: '#ccc' }}>
                Повернутися на головну
            </button>
        </div>
    );
};

export default EditDocuments;