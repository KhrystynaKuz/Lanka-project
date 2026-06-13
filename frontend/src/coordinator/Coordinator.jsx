import React, { useState } from 'react';
import './Coordinator.css';

import DepartmentTasksTab from './DepartmentTasksTab';
import ChatsTab from '../components/chat/ChatsTab';
import InventoryTab from './InventoryTab';

export default function Coordinator({ onLogout, onBackToHome }) {
    const [activeTab, setActiveTab] = useState('department_tasks');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="coord-glass-container">
            {/* ШАПКА ПОВЕРТАЄТЬСЯ ТУТ */}
            <header className="coord-glass-header">
                <div className="coord-header-left">
                    <div className="coord-logo" onClick={onBackToHome} style={{ cursor: 'pointer' }}>ЛАНКА</div>

                    <nav className="coord-nav-menu">
                        <button className={`coord-nav-btn ${activeTab === 'department_tasks' ? 'active' : ''}`} onClick={() => setActiveTab('department_tasks')}>Завдання відділу</button>
                        <button className={`coord-nav-btn ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>Чати</button>
                        <button className={`coord-nav-btn ${activeTab === 'warehouse' ? 'active' : ''}`} onClick={() => setActiveTab('warehouse')}>Склад</button>
                    </nav>

                    <div className="coord-profile-zone">
                        <div className="coord-profile-avatar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                        {isDropdownOpen && (
                            <div className="volunteer-dropdown-menu fade-in">
                                <button className="volunteer-logout-btn" onClick={onLogout}>Вийти</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* КОНТЕНТ ВІДКЛАДОК ПІД ШАПКОЮ */}
            <main className="coord-glass-content fade-in">
                {activeTab === 'department_tasks' && <DepartmentTasksTab />}
                {activeTab === 'chats' && <ChatsTab />}
                {activeTab === 'warehouse' && <InventoryTab />}
            </main>
        </div>
    );
}