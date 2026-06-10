import React from 'react';

export default function BadgesTab() {
    return (
        <div className="volunteer-badges-grid">
            <div className="volunteer-sub-section level-map-section">
                <div className="volunteer-sub-section-title"><h3>МІЙ РІВЕНЬ</h3></div>
                <div className="volunteer-level-card active-level"><div className="volunteer-level-info"><h4>Волонтер-новачок</h4><small>К-ть виконаних завдань: 1</small></div><div className="volunteer-level-num">1</div></div>
                <div className="volunteer-level-divider"></div>
                <div className="volunteer-level-card locked-level"><div className="volunteer-level-info"><h4>Рятівник</h4><small>Потрібно виконати ще 4 завдання</small></div><div className="volunteer-level-num">2</div></div>
                <div className="volunteer-level-divider gray-divider"></div>
                <div className="volunteer-level-card locked-level transparent-level"><div className="volunteer-level-info"><h4>Герой громади</h4><small>Епічні завдання</small></div><div className="volunteer-level-num">3</div></div>
            </div>
            <div className="volunteer-sub-section rewards-section">
                <div>
                    <div className="volunteer-sub-section-title"><h3>МОЇ ДОСЯГНЕННЯ</h3></div>
                    <div className="volunteer-badges-list">
                        <div className="volunteer-badge-item">🥇 Перший виїзд (Отримано за закриття завдання №8)</div>
                        <div className="volunteer-badge-item">⚡ Безвідмовний (3 завдання в процесі одночасно)</div>
                        <div className="volunteer-badge-item locked-badge">🔒 Майстер логістики (Блоковано)</div>
                    </div>
                </div>
                <div className="volunteer-certificate-box">
                    <h4>СЕРТИФІКАТ ВОЛОНТЕРА</h4><p>Ви можете завантажити офіційний документ, що підтверджує вашу волонтерську діяльність у проекті.</p>
                    <button className="volunteer-download-cert-btn" onClick={() => alert('Завантаження сертифікату PDF...')}>ЗАВАНТАЖИТИ 📥</button>
                </div>
            </div>
        </div>
    );
}