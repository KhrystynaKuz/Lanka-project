import React, { useState } from 'react';

export default function CreateRequestTab({ userId, onSuccessSubmit }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Гуманітарна допомога');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateRequest = async (e) => {
        e.preventDefault();

        if (!userId) {
            alert("Помилка: Не вдалося визначити ID користувача. Перезайдіть у систему.");
            return;
        }

        setIsLoading(true);

        const requestData = {
            customerId: userId,
            title: title,
            category: category,
            description: description,
            priority: Number(priority)
        };

        try {
            const response = await fetch('http://localhost:8080/api/requests/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                await response.json();
                alert(`Заявку успішно створено в БД!`);
                setTitle('');
                setDescription('');
                setPriority(1);
                if (onSuccessSubmit) onSuccessSubmit();
            } else {
                const errorText = await response.text();
                alert(`Помилка сервера: ${errorText}`);
            }
        } catch (error) {
            console.error("Error sending request:", error);
            alert("Не вдалося з'єднатися з сервером.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ marginTop: '15px' }}>
            <div className="tab-header-block">
                <h2 className="tab-title">Нова заявка на допомогу</h2>
            </div>

            <form onSubmit={handleCreateRequest} className="request-full-card">
                <div className="editor-glass-block" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                    <div className="input-field-group">
                        <label>Назва заявки / Що саме потрібно? *</label>
                        <input
                            type="text"
                            placeholder="Наприклад: Продукти харчування для ВПО"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="input-field-group" style={{ marginTop: '15px' }}>
                        <label>Категорія допомоги</label>
                        <select
                            className="admin-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: '100%', padding: '12px' }}
                            disabled={isLoading}
                        >
                            <option value="Гуманітарна допомога">Гуманітарна допомога</option>
                            <option value="Медикаменти">Медикаменти</option>
                            <option value="Військова амуніція">Військова амуніція</option>
                            <option value="Транспортування">Транспортування</option>
                        </select>
                    </div>

                    <div className="input-field-group" style={{ marginTop: '15px' }}>
                        <label>Терміновість / Пріоритет *</label>
                        <select
                            className="admin-select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            style={{ width: '100%', padding: '12px' }}
                            disabled={isLoading}
                        >
                            <option value={1}> Низький </option>
                            <option value={2}> Середній </option>
                            <option value={3}> Високий </option>
                            <option value={4}> Критичний </option>
                        </select>
                    </div>

                    <div className="input-field-group" style={{ marginTop: '15px' }}>
                        <label>Детальний опис ситуації та потреб *</label>
                        <textarea
                            placeholder="Опишіть кількість, терміновість та куди потрібна доставка..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ height: '140px' }}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="request-action-footer" style={{ marginTop: '25px' }}>
                    <div />
                    <button type="submit" className="btn-approve-request" disabled={isLoading || !userId}>
                        {isLoading ? 'Публікація...' : 'Опублікувати заявку'}
                    </button>
                </div>
            </form>
        </div>
    );
}