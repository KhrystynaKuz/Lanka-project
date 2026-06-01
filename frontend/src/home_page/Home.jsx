import React, {useState} from 'react';
import './Home.css';

export default function Home({isLoggedIn, onLogOut, onNavigateToLogin}) {

    const [showDropdown, setShowDropdown] = useState(false);


    const [completedTasks] = useState([
        {
            id: 1,
            title: 'Медична допомога: Доставка ліків',
            description: 'Успішно придбали та доставили необхідні медикаменти для 15 літніх людей у прифронтових зонах. Дякуємо кожному за донати!',
            date: '29.05.2026',
            tags: ['Медицина', 'Терміново']
        },
        {
            id: 2,
            title: 'Відновлення житла: Збір будматеріалів',
            description: 'Завдяки спільним зусиллям вдалося закрити збір та доставити матеріали для ремонту даху постраждалого будинку пані Олени.',
            date: '24.05.2026',
            tags: ['Реконструкція']
        },
        {
            id: 3,
            title: 'Еко-ініціатива: Озеленення парку',
            description: 'Разом із командою волонтерів висадили понад 50 нових саджанців дерев та облаштували зону відпочинку.',
            date: '18.05.2026',
            tags: ['Екологія']
        }
    ]);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div className="home-glass-container">
            <header className="home-glass-header">
                <div className="header-logo">ЛАНКА</div>

                <div className="header-profile-zone">
                    <div className="header-profile" onClick={toggleDropdown}>
                        <div className="profile-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                        </div>
                        <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                    </div>

                    {showDropdown && (
                        <div className="profile-dropdown-menu">
                            {isLoggedIn ? (
                                <>
                                    <div className="dropdown-user-info">Акаунт активний</div>
                                    <button className="dropdown-btn logout" onClick={() => {
                                        onLogOut();
                                        setShowDropdown(false);
                                    }}>
                                        Вийти
                                    </button>
                                </>
                            ) : (
                                <button className="dropdown-btn login" onClick={() => {
                                    onNavigateToLogin();
                                    setShowDropdown(false);
                                }}>
                                    Увійти
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="home-glass-content">
                <div className="content-intro">
                    <h1 className="main-title">Наші виконані волонтерські задачі</h1>
                    <p className="main-subtitle">Простір добрих справ, які вдалося втілити в життя завдяки вашій
                        підтримці.</p>
                </div>

                <div className="glass-tasks-feed">
                    {completedTasks.map((task) => (
                        <div key={task.id} className="glass-task-card">
                            <div className="card-top">
                                <div className="card-tags">
                                    {task.tags.map((tag, idx) => (
                                        <span key={idx} className="glass-tag">{tag}</span>
                                    ))}
                                </div>
                                <span className="card-date">{task.date}</span>
                            </div>

                            <h2 className="card-title">{task.title}</h2>
                            <p className="card-text">{task.description}</p>

                            <div className="card-bottom">
                                <span className="status-indicator">✓ Виконано</span>
                                <button className="glass-details-btn">Детальніше</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}