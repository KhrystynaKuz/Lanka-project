import React from 'react';

export default function ReportsTab({ showNotification }) {
    return (
        <div className="admin-tab-content fade-in">
            <div className="reports-selectors-card">
                <div className="selector-row">
                    <span className="selector-bullet">•</span>
                    <label>Звіт з виконання: </label>
                    <select className="admin-select">
                        <option>ЗАЯВКА №123</option>
                        <option>ЗАЯВКА №122</option>
                    </select>
                    <button
                        className="btn-download-icon"
                        title="Завантажити"
                        onClick={() => showNotification("📥 Завантаження звіту з виконання заявки розпочато...", "success")}
                    >
                        📥
                    </button>
                </div>

                <div className="selector-row" style={{marginTop: '16px'}}>
                    <span className="selector-bullet">•</span>
                    <label>Звіт за період: </label>
                    <span className="date-span">з</span> <input type="date" className="admin-date-input" defaultValue="2026-05-01"/>
                    <span className="date-span">по</span> <input type="date" className="admin-date-input" defaultValue="2026-05-31"/>
                    <button
                        className="btn-download-icon"
                        title="Завантажити"
                        onClick={() => showNotification("📊 Формування та завантаження звіту за вказаний період розпочато...", "success")}
                    >
                        📥
                    </button>
                </div>
            </div>

            <div className="analytics-section">
                <h3 className="analytics-title">Статистика та аналітика:</h3>
                <div className="charts-mock-grid">
                    <div className="chart-box-glass">
                        <div className="bar-chart-mock">
                            <div className="bar" style={{height: '50%'}}></div>
                            <div className="bar" style={{height: '80%'}}></div>
                            <div className="bar" style={{height: '40%'}}></div>
                            <div className="bar" style={{height: '95%'}}></div>
                        </div>
                        <p className="chart-label">Динаміка закриття заявок</p>
                    </div>

                    <div className="chart-box-glass">
                        <div className="pie-chart-mock"></div>
                        <div className="pie-legend">
                            <div><span className="dot med"></span> Медицина</div>
                            <div><span className="dot hum"></span> Гуманітарка</div>
                            <div><span className="dot transport"></span> Transport</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}