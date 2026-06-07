import React, { useState, useEffect } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, onBackToHome, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                onLoginSuccess(userData.role.toUpperCase().trim(), userId);
            } else {
                setError('Роль користувача не знайдена в таблиці.');
            }

        } catch (err) {
            setError('Помилка мережі: Не вдалося з\'єднатися з хмарою Supabase.');
        } finally {
            setLoading(false);
        }
    };

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
            setIsNewPasswordMode(false); // Повертаємо на звичайний екран входу
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
                                <input
                                    type="password"
                                    id="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Мінімум 6 символів"
                                    disabled={loading}
                                    required
                                />
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
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    required
                                />
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