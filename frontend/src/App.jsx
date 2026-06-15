import React, {useState, useEffect} from 'react';
import Login from './auth/Login';
import Home from './home_page/Home';
import Register from './auth/Register';
import Header from './manager/Manager.jsx';
import Customer from './customer/Customer.jsx';
import Volunteer from "./volunteer/Volunteer.jsx";
import Coordinator from './coordinator/Coordinator.jsx';
import EditDocuments from './auth/EditDocuments.jsx';

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
                    alert("Ваш акаунт ще не верифіковано адміністратором. Будь ласка, зачекайте.");
                    return;
                }
            } catch (error) {
                console.error(error);
                alert("Помилка зв'язку з сервером.");
                return;
            }
        } else {
            const dashboard = userRole === 'COORDINATOR' ? 'coordinator_dashboard' : 'head_dashboard';
            proceedLogin(userRole, userId, dashboard);
        }
    };

    const proceedLogin = (role, id, page) => {
        setIsLoggedIn(true);
        setRole(role);
        setCurrentPage(page);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', id);
        localStorage.setItem('currentPage', page);
    };

    const handleLogOut = () => {
        setIsLoggedIn(false);
        setRole(null);
        setCurrentPage('home');

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentPage');
        localStorage.removeItem('userId');
    };


    const navigateTo = (page) => {
        setCurrentPage(page);
        localStorage.setItem('currentPage', page);
    };

    return (
        <>
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