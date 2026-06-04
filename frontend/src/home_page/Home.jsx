import React, { useState } from 'react';
import './Home.css';

export default function Home({ isLoggedIn, onLogOut, onNavigateToLogin }) {
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
            description: 'Завдяки спільним зусиллям вдалося закрити збір та доставити材料 для ремонту даху постраждалого будинку пані Олени.',
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

    return (
        <div className="home-glass-container">
            {/* ШАПКА З НАВІГАЦІЄЮ ЗІ СКЕТЧУ */}
            <header className="home-glass-header">
                <div className="header-left">
                    <div className="header-logo">ЛАНКА</div>
                    <nav className="header-nav-menu">
                        <a href="#about" className="nav-link-item">Про нас</a>
                        <a href="#donate" className="nav-link-item">Задонатити на збір</a>
                        <a href="#reports" className="nav-link-item">Звіти</a>
                    </nav>
                </div>

                <div className="header-profile-zone">
                    {isLoggedIn ? (
                        <div className="header-profile" onClick={() => setShowDropdown(!showDropdown)}>
                            <div className="profile-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                        </div>
                    ) : (
                        <button className="header-top-login-btn" onClick={onNavigateToLogin}>
                            Увійти
                        </button>
                    )}

                    {showDropdown && isLoggedIn && (
                        <div className="profile-dropdown-menu">
                            <div className="dropdown-user-info">Акаунт активний</div>
                            <button className="dropdown-btn logout" onClick={() => {
                                onLogOut();
                                setShowDropdown(false);
                            }}>
                                Вийти
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="home-glass-content">
                {/* НОВИЙ БЛОК: ПРО НАС (ІНТРО З ФОТО) */}
                <section id="about" className="about-hero-section">
                    <div className="about-text-block">
                        <h1 className="about-main-title">ЛАНКА</h1>
                        <p className="about-description-text">
                            Ми — волонтерська організація, що створює міцні зв'язки між тими, хто потребує допомоги,
                            та тими, хто має можливість її надати. Кожна добра справа — це важлива ланка в ланцюгу
                            нашої спільної перемоги та взаємопідтримки. Приєднуйтесь до нашої спільноти!
                        </p>
                    </div>
                    <div className="about-image-block">
                        {/* Можеш замінити src на реальне фото з папки assets */}
                        <div className="about-photo-placeholder">
                            <span>Фото вашої команди</span>
                        </div>
                    </div>
                </section>

                <hr className="section-divider" />

                {/* СТРІЧКА ЗАДАЧ */}
                <div className="content-intro">
                    <h2 className="main-title">Наші виконані волонтерські задачі</h2>
                    <p className="main-subtitle">Простір добрих справ, які вдалося втілити в життя завдяки вашій підтримці.</p>
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

            {/* ПІДВАЛ (FOOTER) ЗІ СКЕТЧУ */}
            <footer className="home-glass-footer">
                <div className="footer-section">
                    <h3>Як долучитися до нас:</h3>
                    <p>Ставайте волонтером, діліться інформацією або підтримуйте збори фінансово.</p>
                </div>
                <div className="footer-section">
                    <h3>Контакти:</h3>
                    <p>Email: info@lanka.org<br />Telegram: @lanka_volunteer</p>
                </div>
            </footer>
        </div>
    );
}