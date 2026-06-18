import React, { useState, useEffect } from 'react';
import Login from './auth/Login';
import Home from './home_page/Home';
import Register from './auth/Register';
import Header from './manager/Manager.jsx';
import Customer from './customer/Customer.jsx';
import Volunteer from "./volunteer/Volunteer.jsx";
import Coordinator from './coordinator/Coordinator.jsx';
import EditDocuments from './auth/EditDocuments.jsx';
import './App.css';
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Компонент кастомного модального вікна для повідомлень.
 *
 * @component
 * @param {Object} props - Властивості компонента.
 * @param {boolean} props.isOpen - Чи відкрито модальне вікно.
 * @param {Function} props.onClose - Функція закриття вікна.
 * @param {string} props.title - Заголовок повідомлення.
 * @param {string} props.message - Текст повідомлення.
 * @param {string} [props.buttonText="OK"] - Текст кнопки закриття.
 * @returns {JSX.Element|null} Рендер модального вікна або null, якщо закрито.
 */
const CustomAlert = ({ isOpen, onClose, title, message, buttonText = "OK" }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-alert-overlay" onClick={onClose}>
            <div className="custom-alert-card" onClick={(e) => e.stopPropagation()}>
                <div className="custom-alert-icon">🔔</div>
                <h3 className="custom-alert-title">{title || "Повідомлення"}</h3>
                <p className="custom-alert-message">{message}</p>
                <button className="custom-alert-btn" onClick={onClose}>
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

/**
 * Головний кореневий компонент додатку.
 * Відповідає за маршрутизацію, управління станом автентифікації,
 * навігацію між сторінками та перевірку верифікації користувачів.
 *
 * @component
 * @returns {JSX.Element} Рендер всього додатку.
 */
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedIn') === 'true';
    });

    const [currentPage, setCurrentPage] = useState(() => {
        return localStorage.getItem('currentPage') || 'home';
    });

    const [role, setRole] = useState(() => {
        return localStorage.getItem('userRole') || null;
    });

    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        buttonText: 'OK'
    });

    /**
     * Показує кастомне модальне вікно з повідомленням.
     *
     * @param {string} message - Текст повідомлення.
     * @param {string} [title='Повідомлення'] - Заголовок вікна.
     * @param {string} [buttonText='OK'] - Текст кнопки.
     */
    const showAlert = (message, title = 'Повідомлення', buttonText = 'OK') => {
        setAlertModal({
            isOpen: true,
            title: title,
            message: message,
            buttonText: buttonText
        });
    };

    /**
     * Закриває модальне вікно з повідомленням.
     */
    const closeAlert = () => {
        setAlertModal({
            isOpen: false,
            title: '',
            message: '',
            buttonText: 'OK'
        });
    };

    /**
     * Обробляє успішний вхід користувача.
     * Перевіряє статус верифікації для CUSTOMER та VOLUNTEER,
     * визначає цільову сторінку та виконує вхід.
     *
     * @async
     * @param {string} userRole - Роль користувача.
     * @param {string|number} userId - Ідентифікатор користувача.
     * @returns {Promise<void>}
     */
    const handleLoginSuccess = async (userRole, userId) => {
        const API_BASE_URL = 'http://localhost:8080';
        const isProtectedRole = (userRole === 'CUSTOMER' || userRole === 'VOLUNTEER');

        if (isProtectedRole) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/status/${userId}`);
                const data = await response.json();

                console.log("Отриманий JSON з сервера:", data);

                if (data.is_verified === true) {
                    const dashboard = userRole === 'CUSTOMER' ? 'customer_dashboard' : 'volunteer_dashboard';
                    proceedLogin(userRole, userId, dashboard);
                }
                else if (data.is_verified === false) {
                    proceedLogin(userRole, userId, 'edit_documents');
                }
                else {
                    showAlert(
                        "Ваш акаунт ще не верифіковано адміністратором. Будь ласка, зачекайте.",
                        "⏳ Очікування верифікації"
                    );
                    return;
                }
            } catch (error) {
                console.error(error);
                showAlert(
                    "Помилка зв'язку з сервером. Перевірте підключення до інтернету.",
                    "🚨 Помилка мережі"
                );
                return;
            }
        } else {
            const dashboard = userRole === 'COORDINATOR' ? 'coordinator_dashboard' : 'head_dashboard';
            proceedLogin(userRole, userId, dashboard);
        }
    };

    /**
     * Виконує вхід користувача, зберігає дані в локальному сховищі.
     *
     * @param {string} role - Роль користувача.
     * @param {string|number} id - Ідентифікатор користувача.
     * @param {string} page - Назва сторінки для переходу.
     */
    const proceedLogin = (role, id, page) => {
        setIsLoggedIn(true);
        setRole(role);
        setCurrentPage(page);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', id);
        localStorage.setItem('currentPage', page);
    };

    /**
     * Виконує вихід користувача, очищає локальне сховище.
     */
    const handleLogOut = () => {
        setIsLoggedIn(false);
        setRole(null);
        setCurrentPage('home');

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentPage');
        localStorage.removeItem('userId');
    };

    /**
     * Переходить на вказану сторінку та зберігає це в локальному сховищі.
     *
     * @param {string} page - Назва сторінки.
     */
    const navigateTo = (page) => {
        setCurrentPage(page);
        localStorage.setItem('currentPage', page);
    };

    return (
        <>
            <CustomAlert
                isOpen={alertModal.isOpen}
                onClose={closeAlert}
                title={alertModal.title}
                message={alertModal.message}
                buttonText={alertModal.buttonText}
            />

            {currentPage === 'edit_documents' && (
                <EditDocuments
                    userId={localStorage.getItem('userId')}
                    token={localStorage.getItem('token')}
                    onBackToDashboard={() => navigateTo('home')}
                />
            )}

            {currentPage === 'login' && (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onBackToHome={() => navigateTo('home')}
                    onNavigateToRegister={() => navigateTo('register')}
                />
            )}

            {currentPage === 'register' && (
                <Register
                    onRegisterSuccess={() => navigateTo('login')}
                    onBackToLogin={() => navigateTo('login')}
                    onBackToHome={() => navigateTo('home')}
                />
            )}

            {currentPage === 'home' && (
                <Home onNavigateToLogin={() => navigateTo('login')}/>
            )}

            {currentPage === 'head_dashboard' && (
                <Header onLogOut={handleLogOut} onBackToHome={() => navigateTo('home')}/>
            )}

            {currentPage === 'volunteer_dashboard' && (
                <Volunteer onLogout={handleLogOut} onBackToHome={() => navigateTo('home')}/>
            )}

            {currentPage === 'customer_dashboard' && (
                <Customer onLogOut={handleLogOut} onBackToHome={() => navigateTo('home')}/>
            )}

            {currentPage === 'coordinator_dashboard' && (
                <Coordinator onLogout={handleLogOut} onBackToHome={() => navigateTo('home')}/>
            )}
        </>
    );
}

export default App;