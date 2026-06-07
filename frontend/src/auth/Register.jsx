import React, { useState } from 'react';
import './Register.css';

export default function Register({ onRegisterSuccess, onBackToLogin, onBackToHome }) {
    const [step, setStep] = useState(1); // 1: вибір ролі, 2: заповнення форми
    const [role, setRole] = useState(''); // 'VOLUNTEER' або 'CUSTOMER'

    // Поля форми
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState(''); // Відповідає назві в БД
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState(''); // Відповідає назві в БД (date of birth)
    const [phoneNumber, setPhoneNumber] = useState(''); // Відповідає назві в БД
    const [document, setDocument] = useState(null);
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Дані для підключення до твого Supabase (взяті з твого Login.jsx)
    const SUPABASE_BASE_URL = 'https://dxgywtqqzpyrueostjdy.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';

    const handleSelectRole = (selectedRole) => {
        // Переводимо у верхній регістр (VOLUNTEER / CUSTOMER)
        setRole(selectedRole.toUpperCase());
        setStep(2);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setDocument(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // КРОК 1: Реєстрація користувача в системі автентифікації Supabase Auth
            const authResponse = await fetch(`${SUPABASE_BASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const authData = await authResponse.json();

            if (!authResponse.ok) {
                throw new Error(authData.message || 'Помилка створення акаунту в системі автентифікації.');
            }

            // Отримуємо унікальний UUID користувача, який згенерував Supabase Auth
            const userId = authData.id || (authData.user && authData.user.id);

            if (!userId) {
                throw new Error('Не вдалося отримати ідентифікатор користувача.');
            }

            // КРОК 2: Запис усіх анкетних даних у твою таблицю 'users'
            const dbResponse = await fetch(`${SUPABASE_BASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    id: userId,                   // Прив'язка до Auth UUID
                    email: email,                 // varchar
                    first_name: firstName,         // varchar
                    last_name: lastName,           // varchar
                    patronymic: patronymic || null, // varchar (необов'язково)
                    dob: dob || null,             // date (необов'язково)
                    phone_number: phoneNumber,     // varchar
                    role: role                    // Передає 'VOLUNTEER' або 'CUSTOMER'
                })
            });

            if (!dbResponse.ok) {
                const dbError = await dbResponse.json();
                throw new Error(dbError.message || 'Акаунт створено, але виникла помилка збереження анкетних даних у таблиці users.');
            }

            // Якщо все пройшло успішно
            setLoading(false);
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }

        } catch (err) {
            setError(err.message || 'Сталася непередбачувана помилка при реєстрації.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Кнопка ліворуч нагорі */}
            {step === 1 ? (
                <button className="back-home-btn" onClick={onBackToHome}>
                    ← На головну
                </button>
            ) : (
                <button className="back-home-btn" onClick={() => setStep(1)} disabled={loading}>
                    ← Змінити роль
                </button>
            )}

            <div className="login-card register-card">
                <div className="login-header register-header-compact">
                    <h1 className="login-title">ЛАНКА</h1>
                    <p className="login-subtitle">
                        {step === 1 ? 'Оберіть тип акаунту' : `Реєстрація: ${role === 'VOLUNTEER' ? 'Волонтер' : 'Замовник'}`}
                    </p>
                </div>

                {error && <div className="login-error-message" style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center', fontWeight: '500' }}>{error}</div>}

                {/* КРОК 1: ВИБІР РОЛІ */}
                {step === 1 && (
                    <div className="role-selection-wrapper">
                        <div className="role-card" onClick={() => handleSelectRole('volunteer')}>
                            <div className="role-icon-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                            </div>
                            <h3>Волонтер</h3>
                            <p>Хочу допомагати, брати задачі та бути частиною команди.</p>
                        </div>

                        <div className="role-card" onClick={() => handleSelectRole('customer')}>
                            <div className="role-icon-box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <h3>Замовник</h3>
                            <p>Потребую допомоги, створення заявок та координації зборів.</p>
                        </div>
                    </div>
                )}

                {/* КРОК 2: ЗАПОВНЕННЯ ФОРМИ */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="login-form register-form-compact">
                        <div className="form-grid-row">
                            <div className="input-group">
                                <label htmlFor="lastName">Прізвище <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Шевченко"
                                    required
                                    disabled={loading}
                                    autoComplete="family-name"
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="firstName">Ім'я <span className="required-star">*</span></label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Тарас"
                                    required
                                    disabled={loading}
                                    autoComplete="given-name"
                                />
                            </div>
                        </div>

                        <div className="form-grid-row">
                            <div className="input-group">
                                <label htmlFor="patronymic">По-батькові <span className="optional-label">(необов'язково)</span></label>
                                <input
                                    type="text"
                                    id="patronymic"
                                    value={patronymic}
                                    onChange={(e) => setPatronymic(e.target.value)}
                                    placeholder="Григорович"
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="email">Електронна пошта <span className="required-star">*</span></label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-grid-row">
                            <div className="input-group">
                                <label htmlFor="phoneNumber">Номер telefonu <span className="required-star">*</span></label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+380"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="dob">Дата народження <span className="optional-label">(необов'язково)</span></label>
                                <input
                                    type="date"
                                    id="dob"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className={role === 'CUSTOMER' ? "form-grid-row" : "single-input-row"}>
                            <div className="input-group">
                                <label htmlFor="password">Пароль <span className="required-star">*</span></label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {role === 'CUSTOMER' && (
                                <div className="input-group">
                                    <label htmlFor="document">Документ для реєстрації <span className="required-star">*</span></label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            id="document"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleFileChange}
                                            required
                                            disabled={loading}
                                            className="file-hidden-input"
                                        />
                                        <label htmlFor="document" className="file-custom-label">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                            </svg>
                                            {document ? document.name : 'Оберіть файл'}
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="login-btn register-submit-btn" disabled={loading}>
                            {loading ? 'Реєстрація...' : 'Зареєструватися'}
                        </button>
                    </form>
                )}

                <p className="register-redirect-compact">
                    Вже маєте акаунт? <span onClick={onBackToLogin} className="auth-link">Увійти</span>
                </p>
            </div>
        </div>
    );
}