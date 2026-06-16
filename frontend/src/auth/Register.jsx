import React, { useState, useEffect } from 'react';
import './Register.css';

/**
 * Головний компонент сторінки реєстрації.
 * Відповідає за вибір ролі (волонтер/замовник), введення особистих даних,
 * завантаження документів та створення облікового запису через Supabase.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onRegisterSuccess - Функція, що викликається після успішної реєстрації.
 * @param {Function} props.onBackToLogin - Функція переходу на сторінку входу.
 * @param {Function} props.onBackToHome - Функція переходу на головну сторінку.
 * @returns {JSX.Element} Рендер сторінки реєстрації.
 */
export default function Register({ onRegisterSuccess, onBackToLogin, onBackToHome }) {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [patronymic, setPatronymic] = useState('');
    const [email, setEmail] = useState('');
    const [dob, setDob] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [documents, setDocuments] = useState([]);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [departmentId, setDepartmentId] = useState('');

    const [departments, setDepartments] = useState([]);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const SUPABASE_BASE_URL = 'https://dxgywtqqzpyrueostjdy.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';
    const API_BASE_URL = 'http://localhost:8080';

    /**
     * Завантажує список відділів з бекенду.
     *
     * @async
     * @returns {Promise<void>}
     */
    const fetchDepartments = async () => {
        setLoadingDepartments(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/departments`);
            if (!response.ok) {
                throw new Error('Не вдалося завантажити список відділів');
            }
            const data = await response.json();
            setDepartments(data);
        } catch (err) {
            console.error('Помилка завантаження відділів:', err);
            setError('Не вдалося завантажити список відділів. Спробуйте пізніше.');
        } finally {
            setLoadingDepartments(false);
        }
    };

    useEffect(() => {
        if (role === 'VOLUNTEER') {
            fetchDepartments();
        }
    }, [role]);

    /**
     * Обробляє вибір ролі користувача та переходить до кроку заповнення даних.
     *
     * @param {string} selectedRole - Обрана роль ('volunteer' або 'customer').
     */
    const handleSelectRole = (selectedRole) => {
        setRole(selectedRole.toUpperCase());
        setDocuments([]);
        setStep(2);
    };

    /**
     * Обробляє вибір файлів для завантаження.
     * Перевіряє розмір кожного файлу та сумарний об'єм.
     *
     * @param {Event} e - Подія вибору файлу.
     */
    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const MAX_FILE = 10 * 1024 * 1024;
            const MAX_TOTAL = 20 * 1024 * 1024;

            const validFiles = newFiles.filter(f => f.size <= MAX_FILE);

            const currentTotalSize = documents.reduce((acc, f) => acc + f.size, 0);
            const newFilesSize = validFiles.reduce((acc, f) => acc + f.size, 0);

            if (currentTotalSize + newFilesSize > MAX_TOTAL) {
                showNotification("Сумарний розмір файлів перевищує ліміт (20 МБ)", "error");
                return;
            }

            setDocuments(prev => [...prev, ...validFiles]);
        }
    };

    /**
     * Видаляє файл зі списку за індексом.
     *
     * @param {number} index - Індекс файлу в списку.
     */
    const removeFile = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Завантажує документ на бекенд.
     *
     * @async
     * @param {string} userId - Ідентифікатор користувача.
     * @param {File} file - Файл для завантаження.
     * @param {string} token - Токен доступу Supabase.
     * @returns {Promise<Object|boolean>} Результат завантаження або false у разі помилки.
     */
    const uploadDocument = async (userId, file, token) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        formData.append('title', `${lastName} ${firstName} - реєстраційний документ`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Помилка сервера: ${errorText}`);
            }
            return await response.json();
        } catch (err) {
            console.error('Помилка при завантаженні:', err);
            return false;
        }
    };

    /**
     * Обробляє відправку форми реєстрації.
     * Створює користувача в Supabase, додає дані в таблиці users та user_details,
     * завантажує документи.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (documents.length === 0) {
            setError("Будь ласка, завантажте хоча б один документ.");
            return;
        }

        const hasOversized = documents.some(f => f.size > 10 * 1024 * 1024);
        if (hasOversized) {
            setError("Один з файлів завеликий. Видаліть його та оберіть менший.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            const authResponse = await fetch(`${SUPABASE_BASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({ email, password })
            });

            const authData = await authResponse.json();

            if (!authResponse.ok) {

                if (authData.error_code === "user_already_exists") {
                    throw new Error("Користувач з такою електронною поштою вже зареєстрований");
                }

                throw new Error(authData.msg || "Помилка реєстрації");
            }
            if (!authResponse.ok) throw new Error(authData.message || "Помилка реєстрації");

            const userId = authData.user?.id;
            const accessToken = authData.access_token;

            await fetch(`${SUPABASE_BASE_URL}/rest/v1/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    id: userId,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    patronymic,
                    dob: dob || null,
                    phone_number: phoneNumber,
                    role,
                    is_verified: null
                })
            });

            await fetch(`${SUPABASE_BASE_URL}/rest/v1/user_details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    id: userId,
                    department_id: role === 'VOLUNTEER' ? departmentId : null,
                    status: 'PENDING'
                })
            });

            for (const file of documents) {
                await uploadDocument(userId, file, accessToken);
            }

            setLoading(false);
            if (onRegisterSuccess) onRegisterSuccess();

        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
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
                                <label htmlFor="phoneNumber">Номер телефона <span className="required-star">*</span></label>
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

                        {role === 'VOLUNTEER' && (
                            <>
                                <div className="form-grid-row">
                                    <div className="input-group">
                                        <label htmlFor="password">
                                            Пароль <span className="required-star">*</span>
                                        </label>

                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                disabled={loading}
                                            />

                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.77 21.77 0 0 1 5.06-5.94" />
                                                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.77 21.77 0 0 1-4.35 5.35" />
                                                        <line x1="1" y1="1" x2="23" y2="23" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="department">Відділ <span className="required-star">*</span></label>
                                        {loadingDepartments ? (
                                            <div className="loading-departments">
                                                <span>Завантаження...</span>
                                            </div>
                                        ) : (
                                            <select
                                                id="department"
                                                value={departmentId}
                                                onChange={(e) => setDepartmentId(e.target.value)}
                                                required
                                                disabled={loading}
                                                className="department-select"
                                            >
                                                <option value="" disabled>Оберіть відділ</option>
                                                {departments.map((dept) => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="form-grid-row">
                                    <div className="input-group" style={{ width: '100%' }}>
                                        <label>Документи для реєстрації <span className="required-star">*</span></label>
                                        <div className="file-upload-wrapper">
                                            <input
                                                type="file"
                                                id="docs-upload"
                                                multiple
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={handleFileChange}
                                                disabled={loading}
                                                className="file-hidden-input"
                                            />
                                            <label htmlFor="docs-upload" className="file-custom-label">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                                </svg>
                                                {documents.length > 0 ? `Вибрано файлів: ${documents.length}` : 'Оберіть файли'}
                                            </label>
                                        </div>

                                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {documents.map((file, index) => (
                                                <div key={index} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    background: '#f1f5f9',
                                                    padding: '5px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '13px'
                                                }}>
                                                    <span>{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {role === 'CUSTOMER' && (
                            <div className="form-grid-row">
                                <div className="input-group">
                                    <label htmlFor="password">
                                        Пароль <span className="required-star">*</span>
                                    </label>

                                    <div className="password-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />

                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.77 21.77 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.77 21.77 0 0 1-4.35 5.35" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label htmlFor="document">Документи для реєстрації <span className="required-star">*</span></label>
                                    <div className="file-upload-wrapper">
                                        <input
                                            type="file"
                                            id="document"
                                            multiple
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
                                            {documents.length > 0 ? `Вибрано файлів: ${documents.length}` : 'Оберіть файли'}
                                        </label>
                                    </div>

                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {documents.map((file, index) => (
                                            <div key={index} style={{
                                                display: 'flex', justifyContent: 'space-between', background: '#f1f5f9',
                                                padding: '5px 10px', borderRadius: '6px', fontSize: '13px'
                                            }}>
                                                <span>{file.name}</span>
                                                <button type="button" onClick={() => removeFile(index)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="login-btn register-submit-btn"
                            disabled={loading || documents.length === 0}
                        >
                            {loading ? 'Реєстрація...' : documents.length === 0 ? 'Завантажте документи' : 'Зареєструватися'}
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