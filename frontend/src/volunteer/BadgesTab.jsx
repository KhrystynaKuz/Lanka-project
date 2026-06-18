import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';
import './Volunteer.css';
import { API_BASE_URL } from '..App';

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
 * Компонент порталу для відображення тостів у глобальному контейнері.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Array} props.toasts - Масив сповіщень для відображення.
 * @param {Function} props.onRemove - Функція видалення сповіщення за ідентифікатором.
 * @returns {JSX.Element|null} Рендер порталу з тостами або null, якщо контейнер відсутній.
 */
const ToastPortal = ({ toasts, onRemove }) => {
    const [container, setContainer] = useState(null);

    useEffect(() => {
        let toastContainer = document.getElementById('toast-notifications-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-notifications-container';
            toastContainer.className = 'toast-notifications-container';
            document.body.appendChild(toastContainer);
        }
        setContainer(toastContainer);

        return () => {
            if (toastContainer && toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        };
    }, []);

    if (!container) return null;

    return createPortal(
        <>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </>,
        container
    );
};

/**
 * Головний компонент вкладки "Відзнаки".
 * Відображає рівень волонтера, прогрес до наступного рівня,
 * список досягнень та дозволяє завантажити сертифікат.
 *
 * @component
 * @returns {JSX.Element} Рендер вкладки відзнак.
 */
export default function BadgesTab() {
    const [levelData, setLevelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [levelMap, setLevelMap] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [userName, setUserName] = useState("Волонтер");
    const [toasts, setToasts] = useState([]);
    const userId = localStorage.getItem('userId');

    const hasLoadedRef = useRef(false);
    const previousLevelRef = useRef(null);
    const previousTasksRef = useRef(null);

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
     * Повертає мотиваційне повідомлення на основі поточного рівня,
     * кількості виконаних завдань та факту підвищення рівня.
     *
     * @param {number} level - Номер поточного рівня.
     * @param {number} tasksCompleted - Кількість виконаних завдань.
     * @param {boolean} [isLevelUp=false] - Чи відбулося підвищення рівня.
     * @returns {string} Мотиваційне повідомлення.
     */
    const getMotivationalMessage = (level, tasksCompleted, isLevelUp = false) => {
        const levels = [
            { number: 1, name: "Новачок", minTasks: 0, maxTasks: 3, nextName: "Помічник",
                message: "🌟 Вітаємо в команді! Ви - новачок. Виконайте ще завдання, щоб перейти на рівень 'Помічник'!",
                levelUpMessage: "🎉 Вітаємо! Ви перейшли на новий рівень 'Помічник'! Продовжуйте в тому ж дусі!" },
            { number: 2, name: "Помічник", minTasks: 3, maxTasks: 10, nextName: "Рятівник",
                message: "💪 Ви вже помічник! Ви на правильному шляху!",
                levelUpMessage: "🏆 Неймовірно! Ви досягли рівня 'Рятівник'! Тепер вам доступний сертифікат волонтера!" },
            { number: 3, name: "Рятівник", minTasks: 10, maxTasks: 20, nextName: "Координатор змін",
                message: "⭐ Ви - справжній рятівник! Ви робите велику справу!",
                levelUpMessage: "🎯 Вражаюче! Ви досягли рівня 'Координатор змін'! Тепер ви можете координувати інших волонтерів!" },
            { number: 4, name: "Координатор змін", minTasks: 20, maxTasks: 35, nextName: "Майстер логістики",
                message: "🤝 Ви вже координатор!. Продовжуйте надихати інших!",
                levelUpMessage: "🚛 Вітаємо! Ви стали 'Майстром логістики'! Ваша організаційна майстерність вражає!" },
            { number: 5, name: "Майстер логістики", minTasks: 35, maxTasks: 55, nextName: "Ветеран волонтерства",
                message: "📦 Ви - майстер логістики! Ви незамінні!",
                levelUpMessage: "🎖️ Неймовірне досягнення! Ви - 'Ветеран волонтерства'! Ваш досвід безцінний!" },
            { number: 6, name: "Ветеран волонтерства", minTasks: 55, maxTasks: 80, nextName: "Герой громади",
                message: "🦾 Ви - ветеран! Ви приклад для наслідування!",
                levelUpMessage: "🦸‍♂️ Вітаємо! Ви отримали звання 'Герой громади'! Ваша спільнота пишається вами!" },
            { number: 7, name: "Герой громади", minTasks: 80, maxTasks: 110, nextName: "Орденоносець",
                message: "🌟 Ви - герой громади! Ви змінюєте світ на краще!",
                levelUpMessage: "🏅 Найвища честь! Ви стали 'Орденоносцем'! Ваш внесок відзначено на найвищому рівні!" },
            { number: 8, name: "Орденоносець", minTasks: 110, maxTasks: 150, nextName: "Експерт-наставник",
                message: "🏅 Ви - орденоносець!Дякуємо за вашу відданість!",
                levelUpMessage: "🎓 Вітаємо! Ви досягли рівня 'Експерт-наставник'! Тепер ви можете навчати нових волонтерів!" },
            { number: 9, name: "Експерт-наставник", minTasks: 150, maxTasks: 200, nextName: "Легенда проекту",
                message: "📚 Ви - експерт-наставник!Ви передаєте знання новим поколінням!",
                levelUpMessage: "👑 НЕЙМОВІРНО! Ви стали 'Легендою проекту'! Ваше ім'я назавжди в історії Ланка!" },
            { number: 10, name: "Легенда проекту", minTasks: 200, maxTasks: Infinity, nextName: null,
                message: "🔥 Ви - жива легенда! Дякуємо за вашу неймовірну відданість справі! Ви надихаєте тисячі людей!",
                levelUpMessage: null }
        ];

        const currentLevel = levels.find(l => l.number === level);

        if (!currentLevel) {
            return `🏆 Вітаємо! Продовжуйте допомагати!`;
        }

        if (isLevelUp && currentLevel.levelUpMessage) {
            return currentLevel.levelUpMessage;
        }

        if (tasksCompleted < currentLevel.maxTasks && currentLevel.nextName) {
            const remaining = currentLevel.maxTasks - tasksCompleted;
            return currentLevel.message.replace('{remaining}', remaining);
        }

        return currentLevel.message;
    };

    /**
     * Завантажує дані про рівень, карту рівнів, досягнення та профіль користувача.
     * Перевіряє зміну рівня та показує відповідні сповіщення.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchData = async () => {
        if (!userId) return;

        try {
            const [level, map, badges, profile] = await Promise.all([
                fetch(`${API_BASE_URL}/api/badges/${userId}/level`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/badges/${userId}/map`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/badges/${userId}/achievements`).then(res => res.json()),
                fetch(`${API_BASE_URL}/api/badges/${userId}/profile`).then(res => res.json())
            ]);

            const oldLevel = previousLevelRef.current;
            const oldTasks = previousTasksRef.current;
            const newLevel = level.levelNumber;
            const newTasks = level.tasksCompleted;

            setLevelData(level);
            setLevelMap(map);
            setAchievements(badges);

            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            setUserName(fullName || "Волонтер");

            if (oldLevel !== null && newLevel > oldLevel) {
                const levelUpMsg = getMotivationalMessage(newLevel, newTasks, true);
                addToast(levelUpMsg, "success");
            }
            else if (oldLevel !== null && oldTasks !== null && newTasks > oldTasks && newLevel === oldLevel) {
                const remainingMsg = getMotivationalMessage(newLevel, newTasks, false);
                if (remainingMsg && !remainingMsg.includes("Вітаємо! Ви перейшли")) {
                    addToast(remainingMsg, "info");
                }
            }
            else if (oldLevel === null) {
                const msg = getMotivationalMessage(newLevel, newTasks, false);
                if (msg) {
                    addToast(msg, "info");
                }
            }

            previousLevelRef.current = newLevel;
            previousTasksRef.current = newTasks;
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження даних:", err);
            addToast("🚨 Помилка завантаження даних про досягнення", "error");
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
        fetchData();

        const interval = setInterval(() => {
            if (!loading) {
                fetchData();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    const badgeCatalog = [
        { id: "FIRST_TRIP", name: "Перший виїзд", icon: "🥇", desc: "Виконано твоє перше завдання." },
        { id: "FAST_HELP", name: "Швидка допомога", icon: "⚡", desc: "Завдання закрите швидше ніж за 2 години." },
        { id: "NIGHT_WATCH", name: "Нічний дозор", icon: "🌙", desc: "Виконано завдання у нічний час (22:00-06:00)." },
        { id: "STEADY_HAND", name: "Безвідмовний", icon: "🤝", desc: "У тебе одночасно 3+ завдань в роботі." },
        { id: "WEEKLY_HERO", name: "Тижневий герой", icon: "🔥", desc: "Закрито 5+ завдань за останні 7 днів." },
        { id: "MARATHON_RUNNER", name: "Марафон", icon: "🐢", desc: "Виконав довгострокове завдання (7+ днів)." },
        { id: "VETERAN", name: "Ветеран", icon: "🎖️", desc: "Всього закрито 50+ завдань." },
        { id: "SPEED_DEMON", name: "Стріла", icon: "🚀", desc: "Закрив 3 завдання поспіль менш ніж за добу." }
    ];

    if (loading) return <div className="volunteer-loader">Завантаження...</div>;

    /**
     * Завантажує PDF-сертифікат волонтера.
     * Доступно лише для користувачів з рівнем 3 та вище.
     */
    const downloadCertificate = () => {
        if (levelData.levelNumber < 3) {
            addToast("⚠️ Сертифікат доступний лише після досягнення 3-го рівня (Рятівник). Продовжуйте допомагати!", "warning");
            return;
        }

        const fullName = userName || "Волонтер";

        const element = document.createElement('div');
        element.innerHTML = `
        <div style="width: 297mm; height: 210mm; padding: 20mm; box-sizing: border-box; border: 15px solid #003366; font-family: sans-serif; text-align: center; background: white; display: flex; flex-direction: column; justify-content: center;">
            <h2 style="color: #003366; margin-bottom: 20px; font-size: 24px;">LANKA</h2>
            <h1 style="font-size: 50px; margin: 10px 0; text-transform: uppercase;">Сертифікат волонтера</h1>
            <p style="font-size: 22px; color: #555; margin-bottom: 30px;">Цим підтверджується, що</p>
            <h2 style="font-size: 45px; margin: 20px 0; color: #000; border-bottom: 2px solid #003366; display: inline-block; padding: 0 40px;">
                ${fullName}
            </h2>
            <p style="font-size: 20px; margin-top: 20px; line-height: 1.6;">
                успішно виконав(-ла) волонтерські завдання та зробив(-ла) вагомий внесок<br/>
                у діяльність нашої організації.
            </p>
            <div style="margin-top: 60px; display: flex; justify-content: space-around; align-items: flex-end;">
                <div style="font-size: 18px;">Дата видачі: ${new Date().toLocaleDateString()}</div>
                <div style="text-align: center; position: relative; width: 300px; margin-top: 20px;">
                    <img src="/stamp_Lanka.png" style="width: 200px; position: absolute; bottom: -50px; left: 130px; z-index: 5; opacity: 0.9; transform: rotate(-10deg);" alt="Stamp" />
                    <img src="/signature_Melnyk.png" style="width: 150px; position: absolute; bottom: 20px; left: 25px; z-index: 10;" alt="Signature" />
                    <div style="width: 200px; border-bottom: 2px solid #000; margin-bottom: 5px;"></div>
                    <span style="font-size: 16px;">Голова організації</span>
                </div>
            </div>
        </div>
    `;

        const opt = {
            margin: 0,
            filename: `Certificate_${fullName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
        addToast("📄 Сертифікат успішно завантажено!", "success");
    };

    return (
        <>
            <ToastPortal toasts={toasts} onRemove={removeToast} />

            <div className="volunteer-badges-grid">
                <div className="volunteer-sub-section level-map-section">
                    <div className="volunteer-sub-section-title"><h3>МІЙ РІВЕНЬ</h3></div>

                    <div className="volunteer-level-card active-level">
                        <div className="volunteer-level-info">
                            <h4>{levelData.name}</h4>
                            <small>Виконано завдань: {levelData.tasksCompleted}</small>
                        </div>
                        <div className="volunteer-level-num">{levelData.levelNumber}</div>
                    </div>

                    <div className="progress-container" style={{ width: '100%', background: '#eee', height: '10px', margin: '10px 0' }}>
                        <div style={{ width: `${levelData.progressPercentage}%`, background: 'green', height: '100%' }}></div>
                    </div>
                    <small>До наступного рівня залишилося: {Math.max(0, levelData.tasksRequiredForNextLevel - levelData.tasksCompleted)} завдань</small>

                    <div className="levels-map-list">
                        {levelMap.map((lvl) => (
                            <div key={lvl.levelNumber} className={`level-item ${lvl.isUnlocked ? 'unlocked' : 'locked'}`}>
                                <span className="lvl-num">{lvl.levelNumber}</span>
                                <span className="lvl-name">{lvl.name}</span>
                                {!lvl.isUnlocked && <span className="lvl-lock">🔒</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="volunteer-sub-section rewards-section">
                    <div className="volunteer-sub-section-title"><h3>МОЇ ДОСЯГНЕННЯ</h3></div>
                    <div className="volunteer-badges-list">
                        {badgeCatalog.map((b) => {
                            const isUnlocked = achievements.includes(b.id);
                            return (
                                <div
                                    key={b.id}
                                    className={`volunteer-badge-item ${!isUnlocked ? 'locked-badge' : ''}`}
                                >
                                    <div className="badge-icon">{isUnlocked ? b.icon : '🔒'}</div>
                                    <div className="badge-info">
                                        <div className="badge-name">{b.name}</div>
                                        <div className="badge-desc-popup">{b.desc}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="volunteer-certificate-box">
                        <h4>СЕРТИФІКАТ ВОЛОНТЕРА</h4>
                        <p>
                            {levelData.levelNumber >= 3
                                ? "Ви можете завантажити офіційний документ, що підтверджує вашу волонтерську діяльність."
                                : `Завантаження сертифіката стане доступним після досягнення 3-го рівня. До нього залишилося ${Math.max(0, 10 - levelData.tasksCompleted)} завдань.`}
                        </p>
                        <button
                            className={`volunteer-download-cert-btn ${levelData.levelNumber < 3 ? 'disabled' : ''}`}
                            onClick={downloadCertificate}
                            disabled={levelData.levelNumber < 3}
                        >
                            {levelData.levelNumber >= 3 ? "ЗАВАНТАЖИТИ 📥" : "🔒 СЕРТИФІКАТ ЗАБЛОКОВАНО"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}