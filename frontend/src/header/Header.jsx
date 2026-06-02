import React from 'react';
import './Header.css';

function Header({ isLoggedIn, onLogOut, onNavigateToLogin }) {
    return (
        <header className="main-header-glass">
            <div className="header-logo-section">
                {/* Іконка у вигляді двох переплетених кіл (ланок), що нагадує знак нескінченності */}
                <div className="header-logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="12" r="5" />
                        <circle cx="15" cy="12" r="5" />
                    </svg>
                </div>
                <div className="header-title-block">
                    <h1 className="header-brand-name">ЛАНКА</h1>
                    <span className="header-slogan">єднаємо заради допомоги</span>
                </div>
            </div>

            <nav className="header-nav-actions">
                {isLoggedIn ? (
                    <div className="user-profile-menu">
                        <span className="user-status-badge">Волонтер</span>
                        <button className="header-btn btn-logout" onClick={onLogOut}>
                            Вийти
                        </button>
                    </div>
                ) : (
                    <button className="header-btn btn-login" onClick={onNavigateToLogin}>
                        Увійти
                    </button>
                )}
            </nav>
        </header>
    );
}

export default Header;