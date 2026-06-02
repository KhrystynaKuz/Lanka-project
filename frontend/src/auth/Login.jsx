import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, onBackToHome }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const SUPABASE_BASE_URL = 'https://dxgywtqqzpyrueostjdy.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_avyWvNv3SrmJZGmaMszNrw_AGJptVhK';

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
            const userId = authData.user.id; // Отримуємо унікальний UUID користувача

            const dbResponse = await fetch(`${SUPABASE_BASE_URL}/rest/v1/users?id=eq.${userId}&select=role`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${authData.access_token}`,
                    'Accept': 'application/vnd.pgrst.object+json' // Повертає один об'єкт користувача замість масиву
                }
            });

            if (!dbResponse.ok) {
                setError('Користувача знайдено, але виникла помилка отримання ролі з бази даних.');
                setLoading(false);
                return;
            }

            const userData = await dbResponse.json();

            // Крок 3: Перевіряємо наявність ролі та передаємо її в App.jsx
            if (userData && userData.role) {
                onLoginSuccess(userData.role.toUpperCase().trim());
            } else {
                setError('Роль користувача не знайдена в таблиці.');
            }

        } catch (err) {
            setError('Помилка мережі: Не вдалося з\'єднатися з хмарою Supabase.');
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
                <h2 className="login-title">Вхід до системи</h2>
                <p className="login-subtitle">Будь ласка, введіть свої дані для доступу</p>

                {error && (
                    <div className="error-message" style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>
                        {error}
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
                        <a href="#forgot" className="forgot-password">Забули пароль?</a>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Перевірка...' : 'Увійти'}
                    </button>
                </form>

                <p className="register-redirect">
                    Немає акаунту? <a href="#register">Зареєструватися</a>
                </p>
            </div>
        </div>
    );
}