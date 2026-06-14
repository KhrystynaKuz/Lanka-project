import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';

export default function BadgesTab() {
    const [levelData, setLevelData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [levelMap, setLevelMap] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [userName, setUserName] = useState("Волонтер");
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) return;

        Promise.all([
            fetch(`http://localhost:8080/api/badges/${userId}/level`).then(res => res.json()),
            fetch(`http://localhost:8080/api/badges/${userId}/map`).then(res => res.json()),
            fetch(`http://localhost:8080/api/badges/${userId}/achievements`).then(res => res.json()),
            fetch(`http://localhost:8080/api/badges/${userId}/profile`).then(res => res.json())
        ])
            .then(([level, map, badges, profile]) => {
                console.log("Дані профілю з сервера:", profile);

                setLevelData(level);
                setLevelMap(map);
                setAchievements(badges);

                const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

                setUserName(fullName || "Волонтер");
                setLoading(false);
            })
            .catch(err => {
                console.error("Помилка завантаження даних:", err);
                setLoading(false);
            });
    }, [userId]);

    const badgeCatalog = [
        { id: "FIRST_TRIP", name: "Перший виїзд", icon: "🥇", desc: "Виконано твоє перше завдання." },
        { id: "FAST_HELP", name: "Швидка допомога", icon: "⚡", desc: "Завдання закрите швидше ніж за 2 години." },
        { id: "NIGHT_WATCH", name: "Нічний дозор", icon: "🌙", desc: "Виконано завдання у нічний час (22:00-06:00)." },
        { id: "STEADY_HAND", name: "Безвідмовний", icon: "🤝", desc: "У тебе одночасно 3+ завдань в роботі." },
        { id: "WEEKLY_HERO", name: "Тижневий герой", icon: "🔥", desc: "Закрито 5+ завдань за останні 7 днів." },
        { id: "MARATHON_RUNNER", name: "Марафон", icon: "🐢", desc: "Виконав довгострокове завдання (7+ днів)." },
        { id: "VETERAN", name: "Ветеран", icon: "🎖️", desc: "Всього закрито 50+ завдань." },
        { id: "SPEED_DEMON", name: "Стріла", icon: "🚀", desc: "Закрив 3 завдання поспіль менш ніж за добу." }
    ];

    if (loading) return <div>Завантаження...</div>;

    const downloadCertificate = () => {
        if (levelData.levelNumber < 3) {
            alert("Сертифікат доступний лише після досягнення 3-го рівня (Рятівник). Продовжуйте допомагати!");
            return;
        }

        const fullName = userName || "Волонтер";

        const element = document.createElement('div');
        element.innerHTML = `
        <div style="width: 297mm; height: 210mm; padding: 20mm; box-sizing: border-box; border: 15px solid #003366; font-family: sans-serif; text-align: center; background: white; display: flex; flex-direction: column; justify-content: center;">
            <h2 style="color: #003366; margin-bottom: 20px; font-size: 24px;">LANKA</h2>
            <h1 style="font-size: 50px; margin: 10px 0; text-transform: uppercase;">Сертифікат волонтера</h1>
            <p style="font-size: 22px; color: #555; margin-bottom: 30px;">Цим підтверджується, що</p>
            <h2 style="font-size: 45px; margin: 20px 0; color: #000; border-bottom: 2px solid #003366; display: inline-block; padding: 0 40px;">
                ${fullName}
            </h2>
            <p style="font-size: 20px; margin-top: 20px; line-height: 1.6;">
                успішно виконав(-ла) волонтерські завдання та зробив(-ла) вагомий внесок<br/>
                у діяльність нашої організації.
            </p>
            <div style="margin-top: 60px; display: flex; justify-content: space-around; align-items: flex-end;">
                <div style="font-size: 18px;">Дата видачі: ${new Date().toLocaleDateString()}</div>
                <div style="text-align: center; position: relative; width: 300px; margin-top: 20px;">
                    <img src="/stamp_Lanka.png" style="width: 200px; position: absolute; bottom: -50px; left: 130px; z-index: 5; opacity: 0.9; transform: rotate(-10deg);" alt="Stamp" />
                    <img src="/signature_Melnyk.png" style="width: 150px; position: absolute; bottom: 20px; left: 25px; z-index: 10;" alt="Signature" />
                    <div style="width: 200px; border-bottom: 2px solid #000; margin-bottom: 5px;"></div>
                    <span style="font-size: 16px;">Голова організації</span>
                </div>
            </div>
        </div>
    `;

        const opt = {
            margin: 0,
            filename: `Certificate_${fullName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save();
    };

    return (
        <div className="volunteer-badges-grid">
            <div className="volunteer-sub-section level-map-section">
                <div className="volunteer-sub-section-title"><h3>МІЙ РІВЕНЬ</h3></div>

                <div className="volunteer-level-card active-level">
                    <div className="volunteer-level-info">
                        <h4>{levelData.name}</h4>
                        <small>Виконано завдань: {levelData.tasksCompleted}</small>
                    </div>
                    <div className="volunteer-level-num">{levelData.levelNumber}</div>
                </div>

                <div className="progress-container" style={{ width: '100%', background: '#eee', height: '10px', margin: '10px 0' }}>
                    <div style={{ width: `${levelData.progressPercentage}%`, background: 'green', height: '100%' }}></div>
                </div>
                <small>До наступного рівня залишилося: {levelData.tasksRequiredForNextLevel - levelData.tasksCompleted} тасок</small>
                <div className="levels-map-list">
                    {levelMap.map((lvl) => (
                        <div key={lvl.levelNumber} className={`level-item ${lvl.isUnlocked ? 'unlocked' : 'locked'}`}>
                            <span className="lvl-num">{lvl.levelNumber}</span>
                            <span className="lvl-name">{lvl.name}</span>
                            {!lvl.isUnlocked && <span className="lvl-lock">🔒</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="volunteer-sub-section rewards-section">
                <div className="volunteer-sub-section-title"><h3>МОЇ ДОСЯГНЕННЯ</h3></div>
                <div className="volunteer-badges-list">
                    {badgeCatalog.map((b) => {
                        const isUnlocked = achievements.includes(b.id);
                        return (
                            <div
                                key={b.id}
                                className={`volunteer-badge-item ${!isUnlocked ? 'locked-badge' : ''}`}
                            >
                                <div className="badge-icon">{isUnlocked ? b.icon : '🔒'}</div>
                                <div className="badge-info">
                                    <div className="badge-name">{b.name}</div>
                                    <div className="badge-desc-popup">{b.desc}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="volunteer-certificate-box">
                    <h4>СЕРТИФІКАТ ВОЛОНТЕРА</h4>
                    <p>
                        {levelData.levelNumber >= 3
                            ? "Ви можете завантажити офіційний документ, що підтверджує вашу волонтерську діяльність."
                            : "Завантаження сертифіката стане доступним після досягнення 3-го рівня."}
                    </p>
                    <button
                        className={`volunteer-download-cert-btn ${levelData.levelNumber < 3 ? 'disabled' : ''}`}
                        onClick={downloadCertificate}
                        disabled={levelData.levelNumber < 3}
                    >
                        {levelData.levelNumber >= 3 ? "ЗАВАНТАЖИТИ 📥" : "🔒 СЕРТИФІКАТ ЗАБЛОКОВАНО"}
                    </button>
                </div>
            </div>
        </div>
    );
}