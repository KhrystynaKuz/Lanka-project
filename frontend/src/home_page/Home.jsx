import React, { useState, useEffect } from 'react';
import './Home.css';

export default function Home({ isLoggedIn, onLogOut, onNavigateToLogin }) {
    const [showDropdown, setShowDropdown] = useState(false);

    const [siteContent, setSiteContent] = useState({
        home_title: 'ЛАНКА',
        home_description: "Ми — волонтерська організація, що створює міцні зв'язки між тими, хто потребує допомоги...",
        home_image: ''
    });

    const [fundraisers, setFundraisers] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/site-editor/settings');
                if (response.ok) {
                    const data = await response.json();
                    setSiteContent({
                        home_title: data.home_title || 'ЛАНКА',
                        home_description: data.home_description || "Ми — волонтерська організація...",
                        home_image: data.home_image || ''
                    });
                }
            } catch (error) {
                console.error("Помилка завантаження контенту сайту:", error);
            }
        };

        const fetchActiveFundraisers = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/site-editor/fundraisers');
                if (response.ok) {
                    const data = await response.json();
                    const visibleFundraisers = data.filter(f => !f.is_hidden);
                    setFundraisers(visibleFundraisers);
                }
            } catch (error) {
                console.error("Помилка завантаження активних зборів:", error);
            }
        };

        fetchSettings();
        fetchActiveFundraisers();
    }, []);

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
            description: 'Завдяки спільнимзусиллям вдалося закрити збір та доставити матеріали для ремонту даху постраждалого будинку пані Олени.',
            date: '24.05.2026',
            tags: ['Реконструкція']
        }
    ]);

    return (
        <div className="home-glass-container">
            <header className="home-glass-header">
                <div className="header-left">
                    <div className="header-logo">ЛАНКА</div>
                    <nav className="header-nav-menu">
                        <a href="#about" className="nav-link-item">Про нас</a>
                        <a href="#donate" className="nav-link-item">Активні збори</a>
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
                {/* СЕКЦІЯ 1: ПРО НАС */}
                <section id="about" className="about-hero-section">
                    <div className="about-text-block">
                        <h1 className="about-main-title">{siteContent.home_title}</h1>
                        <p className="about-description-text">{siteContent.home_description}</p>
                    </div>
                    <div className="about-image-block">
                        {siteContent.home_image ? (
                            <img
                                src={siteContent.home_image}
                                alt="Волонтерська команда Ланка"
                                className="about-hero-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                            />
                        ) : (
                            <div className="about-photo-placeholder">
                                <span>Фото вашої команди</span>
                            </div>
                        )}
                    </div>
                </section>

                <hr className="section-divider" />

                {/* СЕКЦІЯ 2: АКТИВНІ ЗБОРИ */}
                <section id="donate" className="fundraisers-public-section">
                    <div className="content-intro">
                        <h2 className="main-title">Активні термінові збори</h2>
                        <p className="main-subtitle">Ваш внесок рятує життя. Оберіть напрямок та підтримайте фінансово або через QR-код.</p>
                    </div>

                    <div className="glass-tasks-feed" style={{ marginTop: '20px' }}>
                        {fundraisers.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', width: '100%' }}>Наразі немає активних зборів.</p>
                        ) : (
                            fundraisers.map((fundraiser) => (
                                <div key={fundraiser.id} className="glass-task-card fundraiser-card" style={{ borderColor: 'rgba(0, 212, 255, 0.2)' }}>
                                    <h2 className="card-title" style={{ color: '#00d4ff' }}>{fundraiser.title}</h2>
                                    <p className="card-text">{fundraiser.description}</p>

                                    {fundraiser.qr_code_url && (
                                        <div style={{ margin: '15px 0', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px' }}>Скануйте для донату:</div>
                                            <img
                                                src={fundraiser.qr_code_url}
                                                alt="QR для оплати"
                                                style={{ width: '120px', height: '120px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }}
                                            />
                                        </div>
                                    )}

                                    <div className="card-bottom" style={{ marginTop: 'auto' }}>
                                        <span className="status-indicator" style={{ color: '#ffb703' }}>● Терміново</span>
                                        {fundraiser.link && (
                                            <a
                                                href={fundraiser.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="glass-details-btn"
                                                style={{ textDecoration: 'none', textAlign: 'center', lineHeight: '30px' }}
                                            >
                                                ПОСИЛАННЯ НА БАНКУ
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <hr className="section-divider" />

                {/* СЕКЦІЯ 3: ВИКОНАНІ ЗАДАЧІ */}
                <section id="reports" className="completed-tasks-section">
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
                </section>
            </main>

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