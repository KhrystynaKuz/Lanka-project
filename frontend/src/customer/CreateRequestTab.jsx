import React, { useState } from 'react';
import { API_BASE_URL } from '../App';
/**
 * Компонент сповіщення (тосту), яке автоматично зникає через 4 секунди.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string} props.message - Текст сповіщення.
 * @param {string} props.type - Тип сповіщення ('info', 'success', 'error', 'warning').
 * @param {Function} props.onClose - Функція закриття сповіщення.
 * @returns {JSX.Element} Рендер тосту.
 */
const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast-item toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close-btn" onClick={onClose}>✕</button>
        </div>
    );
};

/**
 * Головний компонент вкладки "Створити заявку" для замовника.
 * Відповідає за створення нової заявки на допомогу з
 * обов'язковими полями: назва, категорія, опис, пріоритет.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {string|number} props.userId - Ідентифікатор поточного користувача.
 * @param {Function} props.onSuccessSubmit - Функція, що викликається після успішного створення заявки.
 * @returns {JSX.Element} Рендер форми створення заявки.
 */
export default function CreateRequestTab({ userId, onSuccessSubmit }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Гуманітарна допомога');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    /**
     * Додає нове сповіщення до списку.
     *
     * @param {string} message - Текст сповіщення.
     * @param {string} [type='info'] - Тип сповіщення.
     */
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    /**
     * Видаляє сповіщення зі списку за ідентифікатором.
     *
     * @param {number} id - Ідентифікатор сповіщення.
     */
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    /**
     * Обробляє відправку форми створення заявки.
     * Виконує валідацію полів та надсилає запит на бекенд.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleCreateRequest = async (e) => {
        e.preventDefault();

        if (!userId) {
            addToast("⚠️ Помилка: Не вдалося визначити ID користувача. Перезайдіть у систему.", "error");
            return;
        }

        if (!title.trim()) {
            addToast("⚠️ Будь ласка, введіть назву заявки.", "warning");
            return;
        }

        if (!description.trim()) {
            addToast("⚠️ Будь ласка, введіть опис заявки.", "warning");
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
            const response = await fetch(`${API_BASE_URL}/api/requests/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                await response.json();
                addToast("✅ Заявку успішно створено!", "success");
                setTitle('');
                setDescription('');
                setPriority(1);
                if (onSuccessSubmit) onSuccessSubmit();
            } else {
                const errorText = await response.text();
                addToast(`🚨 Помилка сервера: ${errorText}`, "error");
            }
        } catch (error) {
            console.error("Error sending request:", error);
            addToast("🚨 Не вдалося з'єднатися з сервером.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ marginTop: '15px' }}>
            <div className="toast-notifications-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

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
                            <option value={1}>Низький</option>
                            <option value={2}>Середній</option>
                            <option value={3}>Високий</option>
                            <option value={4}>Критичний</option>
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