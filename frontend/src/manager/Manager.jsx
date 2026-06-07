import React, { useState } from 'react';
import VerificationTab from './VerificationTab';
import RequestsTab from './RequestsTab';
import ChatsTab from './ChatsTab';
import ReportsTab from './ReportsTab';
import SiteEditorTab from './SiteEditorTab';
import InventoryTab from './InventoryTab';
import './Manager.css';

export default function Header({ onLogOut }) {
    const [activeTab, setActiveTab] = useState('verification');
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="admin-glass-container">
            {/* ШАПКА АДМІН-ПАНЕЛІ */}
            <header className="admin-glass-header">
                <div className="admin-header-left">
                    <div className="admin-logo">ЛАНКА</div>
                    <nav className="admin-nav-menu">
                        <button className={`admin-nav-btn ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => setActiveTab('verification')}>Керування</button>
                        <button className={`admin-nav-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Заявки</button>
                        <button className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>Чати</button>
                        <button className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Звіти</button>
                        <button className={`admin-nav-btn ${activeTab === 'site' ? 'active' : ''}`} onClick={() => setActiveTab('site')}>Сайт</button>
                        <button className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Склад</button>
                    </nav>
                </div>

                <div className="admin-profile-zone">
                    <div className="admin-profile-avatar" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span className="profile-arrow">{showDropdown ? '▲' : '▼'}</span>
                    </div>
                    {showDropdown && (
                        <div className="admin-dropdown-menu">
                            <div className="dropdown-info">Голова Організації</div>
                            <button className="dropdown-logout-btn" onClick={onLogOut}>Вийти</button>
                        </div>
                    )}
                </div>
            </header>

            {/* ОСНОВНИЙ КОНТЕНТ */}
            <main className="admin-glass-content">
                {activeTab === 'verification' && <VerificationTab />}
                {activeTab === 'requests' && <RequestsTab />}
                {activeTab === 'chats' && <ChatsTab />}
                {activeTab === 'reports' && <ReportsTab />}
                {activeTab === 'site' && <SiteEditorTab />}
                {activeTab === 'inventory' && <InventoryTab />}
            </main>
        </div>
    );
}