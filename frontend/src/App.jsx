import React, { useState } from 'react';
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home_page/Home';
import Header from './manager/Manager.jsx';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [role, setRole] = useState(null);

    const handleLoginSuccess = (userRole) => {
        setIsLoggedIn(true);
        setRole(userRole);

        if (userRole === 'HEAD') {
            setCurrentPage('head_dashboard');
        } else if (userRole === 'VOLUNTEER') {
            setCurrentPage('volunteer_dashboard');
        } else {
            setCurrentPage('customer_dashboard');
        }
    };

    return (
        <>
            {currentPage === 'login' && (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onBackToHome={() => setCurrentPage('home')}
                    onNavigateToRegister={() => setCurrentPage('register')}
                />
            )}

            {currentPage === 'register' && (
                <Register
                    onRegisterSuccess={() => setCurrentPage('login')}
                    onBackToLogin={() => setCurrentPage('login')}
                    onBackToHome={() => setCurrentPage('home')}
                />
            )}

            {currentPage === 'home' && (
                <Home onNavigateToLogin={() => setCurrentPage('login')} />
            )}

            {currentPage === 'head_dashboard' && (
                <Header onLogOut={() => setCurrentPage('home')} />
            )}

            {currentPage === 'volunteer_dashboard' && (
                <div>VOLUNTEER PAGE</div>
            )}

            {currentPage === 'customer_dashboard' && (
                <div>CUSTOMER PAGE</div>
            )}
        </>
    );
}

export default App;