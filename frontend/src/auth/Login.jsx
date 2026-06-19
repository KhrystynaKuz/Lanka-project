import React, { useState, useEffect } from 'react';
import './Login.css';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../App';
/**
 * Головний компонент сторінки входу.
 * Відповідає за автентифікацію користувача через Supabase,
 * відновлення пароля, встановлення нового пароля
 * та передачу даних успішного входу в додаток.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {Function} props.onLoginSuccess - Функція, що викликається після успішного входу.
 * @param {Function} props.onBackToHome - Функція переходу на головну сторінку.
 * @param {Function} props.onNavigateToRegister - Функція переходу на сторінку реєстрації.
 * @returns {JSX.Element} Рендер сторінки входу.
 */
export default function Login({ onLoginSuccess, onBackToHome, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isResetMode, setIsResetMode] = useState(false);
    const [isNewPasswordMode, setIsNewPasswordMode] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [accessToken, setAccessToken] = useState('');

    const SUPABASE_BASE_URL = 'https://dxgywtqqzpyrueostjdy.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';

    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            const params = new URLSearchParams(hash.replace('#', '?'));
            const token = params.get('access_token');

            if (token) {
                setAccessToken(token);
                setIsNewPasswordMode(true);
                window.location.hash = '';
            }
        }
    }, []);

    /**
     * Обробляє вхід користувача.
     * Виконує автентифікацію через Supabase, отримує роль користувача
     * та викликає onLoginSuccess.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const authResponse = await fetch(`${SUPABASE_BASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY
                },
                body: JSON.stringify({ email, password })
            });

            if (!authResponse.ok) {
                const authData = await authResponse.json();
                setError(authData.error_description || 'Невірний email або пароль');
                setLoading(false);
                return;
            }

            const authData = await authResponse.json();
            const userId = authData.user.id;

            await supabase.auth.setSession({
                access_token: authData.access_token,
                refresh_token: authData.refresh_token
            });
            console.log('Session set, now:', await supabase.auth.getSession());

            const dbResponse = await fetch(`${SUPABASE_BASE_URL}/rest/v1/users?id=eq.${userId}&select=role`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${authData.access_token}`,
                    'Accept': 'application/vnd.pgrst.object+json'
                }
            });

            if (!dbResponse.ok) {
                setError('Користувача знайдено, але виникла помилка отримання ролі з бази даних.');
                setLoading(false);
                return;
            }

            const userData = await dbResponse.json();

            if (userData && userData.role) {
                await fetch(`${API_BASE_URL}/api/auth/login-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userId })
                });

                onLoginSuccess(userData.role.toUpperCase().trim(), userId);
            }
        } catch (err) {
            setError('Помилка мережі: Не вдалося з\'єднатися з хмарою Supabase.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Обробляє відновлення пароля.
     * Надсилає запит на відновлення пароля на вказану електронну пошту.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${SUPABASE_BASE_URL}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || data.error_description || 'Не вдалося відправити запит на відновлення.');
            }

            setResetMessage('Інструкцію для зміни пароля надіслано на вашу пошту! Перевірте скриньку (та папку Спам).');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Обробляє збереження нового пароля після відновлення.
     *
     * @async
     * @param {Event} e - Подія відправки форми.
     * @returns {Promise<void>}
     */
    const handleSaveNewPassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${SUPABASE_BASE_URL}/auth/v1/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || data.error_description || 'Не вдалося оновити пароль.');
            }

            setResetMessage('Пароль успішно змінено! Тепер ви можете увійти з новим паролем.');
            setIsNewPasswordMode(false);
            setIsResetMode(false);
            setNewPassword('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <button className="back-home-btn" onClick={onBackToHome}>
                ← На головну
            </button>

            <div className="login-card">

                {isNewPasswordMode ? (
                    <>
                        <h2 className="login-title">Новий пароль</h2>
                        <p className="login-subtitle">Придумайте та введіть новий надійний пароль</p>

                        {error && (
                            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSaveNewPassword} className="login-form">
                            <div className="input-group">
                                <label htmlFor="new-password">Новий пароль</label>

                                <div className="password-wrapper">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="new-password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Мінімум 6 символів"
                                        disabled={loading}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
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

                            <button type="submit" className="login-btn" style={{ marginTop: '20px' }} disabled={loading}>
                                {loading ? 'Збереження...' : 'Оновити пароль'}
                            </button>
                        </form>
                    </>
                ) : isResetMode ? (

                    <>
                        <h2 className="login-title">Відновлення пароля</h2>
                        <p className="login-subtitle">Введіть пошту вашого акаунту для отримання посилання</p>

                        {error && (
                            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="success-message" style={{ color: '#16a34a', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
                                {resetMessage}
                            </div>
                        )}

                        <form onSubmit={handleResetPassword} className="login-form">
                            <div className="input-group">
                                <label htmlFor="reset-email">Електронна пошта</label>
                                <input
                                    type="email"
                                    id="reset-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button type="submit" className="login-btn" style={{ marginTop: '20px' }} disabled={loading}>
                                {loading ? 'Надсилання...' : 'Надіслати листа'}
                            </button>
                        </form>

                        <p className="register-redirect">
                            Згадали пароль?{" "}
                            <span
                                onClick={() => { setIsResetMode(false); setError(''); setResetMessage(''); }}
                                className="auth-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Повернутися до входу
                            </span>
                        </p>
                    </>
                ) : (

                    <>
                        <h2 className="login-title">Вхід до системи</h2>
                        <p className="login-subtitle">Будь ласка, введіть свої дані для доступу</p>

                        {error && (
                            <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="success-message" style={{ color: '#16a34a', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>
                                {resetMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="input-group">
                                <label htmlFor="email">Електронна пошта</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Пароль</label>

                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={loading}
                                        required
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

                            <div className="form-actions">
                                <label className="remember-me">
                                    <input type="checkbox" disabled={loading} /> Запам'ятати мене
                                </label>
                                <span
                                    onClick={() => { setIsResetMode(true); setError(''); setResetMessage(''); }}
                                    className="forgot-password"
                                    style={{ cursor: 'pointer' }}
                                >
                                    Забули пароль?
                                </span>
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? 'Перевірка...' : 'Увійти'}
                            </button>
                        </form>

                        <p className="register-redirect">
                            Немає акаунту?{" "}
                            <span
                                onClick={onNavigateToRegister}
                                className="auth-link"
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Зареєструватися
                            </span>
                        </p>
                    </>
                )}

            </div>
        </div>
    );
}