import React, { useState } from 'react';
import CreateRequestTab from './CreateRequestTab';
import MyRequestsTab from './MyRequestsTab';
import ChatsTab from '../components/chat/ChatsTab.jsx';
import './Customer.css';

export default function Customer({ onLogOut }) {
    const [activeTab, setActiveTab] = useState('create_request');
    const [showDropdown, setShowDropdown] = useState(false);

    const currentUserId = localStorage.getItem('userId');

    return (
        <div className="admin-glass-container">
            <header className="admin-glass-header">
                <div className="admin-header-left">
                    <div className="admin-logo">ЛАНКА</div>

                    <nav className="admin-nav-menu">
                        <button
                            className={`admin-nav-btn ${activeTab === 'create_request' ? 'active' : ''}`}
                            onClick={() => setActiveTab('create_request')}
                        >
                            Створити заявку
                        </button>
                        <button
                            className={`admin-nav-btn ${activeTab === 'my_requests' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my_requests')}
                        >
                            Мої заявки
                        </button>
                        <button
                            className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Чати
                        </button>
                    </nav>

                    <div className="admin-profile-zone">
                        <div className="admin-profile-avatar" onClick={() => setShowDropdown(!showDropdown)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                        </div>

                        {showDropdown && (
                            <div className="admin-dropdown-menu fade-in">
                                <div className="dropdown-info">Замовник</div>
                                <button className="dropdown-logout-btn" onClick={onLogOut}>
                                    Вийти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="admin-glass-content">
                {activeTab === 'create_request' && (
                    <CreateRequestTab
                        userId={currentUserId}
                        onSuccessSubmit={() => setActiveTab('my_requests')}
                    />
                )}

                {activeTab === 'my_requests' && (
                    <MyRequestsTab
                        userId={currentUserId}
                        onGoToChat={() => setActiveTab('chats')}
                    />
                )}

                {activeTab === 'chats' && (
                    <ChatsTab />
                )}
            </main>
        </div>
    );
}