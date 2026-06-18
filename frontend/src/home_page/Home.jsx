import React, {useState, useEffect} from 'react';
import './Home.css';
import { API_BASE_URL } from '.App'
/**
 * Головна публічна сторінка додатку.
 * Відображає інформацію про організацію, активні збори,
 * звіти та фотографії з виконаних робіт.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isLoggedIn - Стан автентифікації користувача.
 * @param {Function} props.onLogOut - Функція виходу з облікового запису.
 * @param {Function} props.onNavigateToLogin - Функція переходу на сторінку входу.
 * @returns {JSX.Element} Рендер головної сторінки.
 */
export default function Home({isLoggedIn, onLogOut, onNavigateToLogin}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [reports, setReports] = useState([]);

    const [siteContent, setSiteContent] = useState({
        home_title: 'ЛАНКА',
        home_description: "Ми — волонтерська організація, що створює міцні зв'язки між тими, хто потребує допомоги.",
        home_image: ''
    });

    const [fundraisers, setFundraisers] = useState([]);

    useEffect(() => {
        /**
         * Завантажує налаштування головної сторінки з бекенду.
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchSettings = async () => {
            try {
                const response = await fetch('${API_BASE_URL}/api/site-editor/settings');
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

        /**
         * Завантажує список активних зборів з бекенду.
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchActiveFundraisers = async () => {
            try {
                const response = await fetch('${API_BASE_URL}/api/site-editor/fundraisers');
                if (response.ok) {
                    const data = await response.json();
                    const visibleFundraisers = data.filter(f => !f.is_hidden);
                    setFundraisers(visibleFundraisers);
                }
            } catch (error) {
                console.error("Помилка завантаження активних зборів:", error);
            }
        };

        /**
         * Завантажує список звітів (фото та документи) з бекенду.
         *
         * @async
         * @returns {Promise<void>}
         */
        const fetchReports = async () => {
            try {
                const response = await fetch('${API_BASE_URL}/api/site-editor/reports');
                if (response.ok) {
                    const data = await response.json();
                    setReports(data);
                }
            } catch (error) {
                console.error("Помилка завантаження звітів:", error);
            }
        }

        fetchSettings();
        fetchActiveFundraisers();
        fetchReports();
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
                                style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px'}}
                            />
                        ) : (
                            <div className="about-photo-placeholder">
                                <span>Фото вашої команди</span>
                            </div>
                        )}
                    </div>
                </section>

                <hr className="section-divider"/>

                <section id="donate" className="fundraisers-public-section">
                    <div className="content-intro">
                        <h2 className="main-title">Активні термінові збори</h2>
                        <p className="main-subtitle">Ваш внесок рятує життя. Оберіть напрямок та підтримайте фінансово
                            або через QR-код.</p>
                    </div>

                    <div className="glass-tasks-feed" style={{marginTop: '30px'}}>
                        {fundraisers.length === 0 ? (
                            <p style={{
                                color: 'rgba(255,255,255,0.4)',
                                textAlign: 'center',
                                width: '100%',
                                fontStyle: 'italic'
                            }}>
                                Наразі немає активних зборів.
                            </p>
                        ) : (
                            fundraisers.map((fundraiser) => (
                                <div key={fundraiser.id} className="glass-task-card fundraiser-card">
                                    <div className="card-top-tag">
                                        <span className="status-indicator">● Терміновий збір</span>
                                    </div>

                                    <div className="fundraiser-main-content">
                                        <div className="fundraiser-text-side">
                                            <h2 className="card-title">{fundraiser.title}</h2>
                                            <p className="card-text">{fundraiser.description}</p>
                                        </div>

                                        {fundraiser.qr_code_url && (
                                            <div className="qr-code-container">
                                                <div className="qr-hint">Скануйте для донату:</div>
                                                <img
                                                    src={fundraiser.qr_code_url}
                                                    alt="QR для оплати"
                                                    className="qr-image"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-bottom">
                                        {fundraiser.link && (
                                            <a
                                                href={fundraiser.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="glass-details-btn"
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

                <hr className="section-divider"/>

                <section id="reports" className="completed-tasks-section">
                    <div className="content-intro">
                        <h2 className="main-title">Звіти про виконану роботу</h2>
                        <p className="main-subtitle">Простір добрих справ, які вдалося втілити завдяки вашій
                            підтримці.</p>
                    </div>

                    <div className="reports-sub-section" style={{marginTop: '30px'}}>
                        <h3 className="section-subtitle" style={{color: '#fff', marginBottom: '15px'}}>Фотозвіти</h3>
                        <div className="glass-photo-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            {reports
                                .filter(item => item.type === 'photo')
                                .map((photo, index) => (
                                    <img
                                        key={index}
                                        src={photo.url}
                                        alt={photo.name}
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            objectFit: 'cover',
                                            borderRadius: '8px'
                                        }}
                                    />
                                ))
                            }
                        </div>
                    </div>

                    <div className="reports-sub-section" style={{marginTop: '40px'}}>
                        <h3 className="section-subtitle" style={{color: '#fff', marginBottom: '15px'}}>Офіційні
                            документи</h3>
                        <div className="glass-docs-list">
                            {reports
                                .filter(item => item.type === 'doc')
                                .map((doc, index) => (
                                    <a
                                        key={index}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-doc-link"
                                        style={{
                                            display: 'block',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            marginBottom: '8px',
                                            borderRadius: '6px',
                                            color: '#1e3a8a',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        📄 {doc.name}
                                    </a>
                                ))
                            }
                        </div>
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
                    <p>Email: info@lanka.org<br/>Instagram: @lanka_volunteer<br/>WhatsApp: @lanka_volunteer</p>
                </div>
            </footer>
        </div>
    );
}