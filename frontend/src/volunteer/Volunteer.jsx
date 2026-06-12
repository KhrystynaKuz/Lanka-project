import React, { useState, useEffect } from 'react';
import './Volunteer.css';
import TasksTab from './TasksTab.jsx';
import ArchiveTab from './ArchiveTab.jsx';
import ChatsTab from './ChatsTab.jsx';
import BadgesTab from './BadgesTab.jsx';

export default function Volunteer({ onLogout, onBackToHome }) {
    const [activeTab, setActiveTab] = useState('tasks');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const volunteerId = localStorage.getItem('userId');

    useEffect(() => {
        const handleClickOutside = () => setIsDropdownOpen(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="volunteer-glass-container">
            <header className="volunteer-glass-header">
                <div className="volunteer-header-left">
                    <div className="volunteer-logo" onClick={onBackToHome} style={{ cursor: 'pointer' }}>ЛАНКА</div>
                    <nav className="volunteer-nav-menu">
                        <button className={`volunteer-nav-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Мої завдання</button>
                        <button className={`volunteer-nav-btn ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>Архів</button>
                        <button className={`volunteer-nav-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>Мої чати</button>
                        <button className={`volunteer-nav-btn ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>Відзнаки</button>
                    </nav>

                    <div className="volunteer-profile-zone" onClick={(e) => e.stopPropagation()}>
                        <div className="volunteer-profile-avatar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="volunteer-profile-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                        </div>
                        {isDropdownOpen && (
                            <div className="volunteer-dropdown-menu fade-in">
                                <div className="volunteer-dropdown-info">Волонтер (ID: {volunteerId ? volunteerId.substring(0, 8) : '...'})</div>
                                <button className="volunteer-logout-btn" onClick={onLogout}>Вийти</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="volunteer-glass-content fade-in">
                {activeTab === 'tasks' && <TasksTab />}
                {activeTab === 'archive' && <ArchiveTab />}
                {activeTab === 'chats' && <ChatsTab />}
                {activeTab === 'badges' && <BadgesTab />}
            </main>
        </div>
    );
}