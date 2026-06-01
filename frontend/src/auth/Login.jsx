import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, onBackToHome }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Авторизація:', { email, password });
        // Тут згодом буде fetch/axios запит до вашого Java-бекенду
        onLoginSuccess();
    };

    return (
        <div className="login-container">
            <button className="back-home-btn" onClick={onBackToHome}>
                ← На головну
            </button>

            <div className="login-card">
                <h2 className="login-title">Вхід до системи</h2>
                <p className="login-subtitle">Будь ласка, введіть свої дані для доступу</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email">Електронна пошта</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@mail.com"
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
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <label className="remember-me">
                            <input type="checkbox" /> Запам'ятати мене
                        </label>
                        <a href="#forgot" className="forgot-password">Забули пароль?</a>
                    </div>

                    <button type="submit" className="login-btn">Увійти</button>
                </form>

                <p className="register-redirect">
                    Немає акаунту? <a href="#register">Зареєструватися</a>
                </p>
            </div>
        </div>
    );
}