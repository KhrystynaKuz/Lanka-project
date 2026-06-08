import React from 'react';

export default function ManagementTab() {
    return (
        <div className="admin-tab-content fade-in">
            <div className="tab-header-block">
                <h2 className="tab-title">Верифікація</h2>
                <div className="badge-counter">Нові користувачі: <span className="counter-number">2</span> ▲</div>
            </div>

            <div className="glass-verification-list">
                <div className="verification-card">
                    <div className="user-info-side">
                        <span className="user-name">Олександр Ковальчук</span>
                        <span className="user-role-badge">Роль: Волонтер</span>
                        <span className="user-docs">📄 Паспорт_верифікація.pdf</span>
                    </div>
                    <div className="action-buttons-side">
                        <button className="btn-detail-view">Детальніше</button>
                        <button className="btn-action-circle approve">✓</button>
                        <button className="btn-action-circle reject">✕</button>
                    </div>
                </div>

                <div className="verification-card">
                    <div className="user-info-side">
                        <span className="user-name">Благодійний Фонд "Разом"</span>
                        <span className="user-role-badge">Role: Замовник (Організація)</span>
                        <span className="user-docs">📄 Виписка_ЄДРПОУ.pdf</span>
                    </div>
                    <div className="action-buttons-side">
                        <button className="btn-detail-view">Детальніше</button>
                        <button className="btn-action-circle approve">✓</button>
                        <button className="btn-action-circle reject">✕</button>
                    </div>
                </div>
            </div>

            <div className="grid-split-sections">
                <div className="glass-sub-section">
                    <div className="sub-section-header">
                        <h3>Відділи</h3>
                        <div className="search-bar-mini"><input type="text" placeholder="Пошук..."/> 🔍</div>
                    </div>
                    <div className="list-items-box clickable-hint">
                        <div className="list-item">Медичний відділ</div>
                        <div className="list-item">Гуманітарний відділ (Продукти)</div>
                        <div className="list-item">Технічний та авто-відділ</div>
                        <span className="hint-text">*при натисканні — редагування</span>
                    </div>
                </div>

                <div className="glass-sub-section">
                    <div className="sub-section-header">
                        <h3>Волонтери обраного відділу</h3>
                        <div className="search-bar-mini"><input type="text" placeholder="Пошук..."/> 🔍</div>
                    </div>
                    <div className="list-items-box font-creative-cloud">
                        <div className="list-item">Дмитро Литвин (Координатор)</div>
                        <div className="list-item">Анна Сидоренко</div>
                        <div className="list-item">Максим Мороз</div>
                    </div>
                </div>
            </div>
        </div>
    );
}