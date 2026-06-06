import React, { useState, useEffect } from 'react';
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './home_page/Home';
import Header from './manager/Manager.jsx';

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

    const handleLoginSuccess = (userRole) => {
        setIsLoggedIn(true);
        setRole(userRole);

        let targetPage = 'customer_dashboard';
        if (userRole === 'HEAD') {
            targetPage = 'head_dashboard';
        } else if (userRole === 'VOLUNTEER') {
            targetPage = 'volunteer_dashboard';
        }

        setCurrentPage(targetPage);


        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('currentPage', targetPage);
    };


    const handleLogOut = () => {
        setIsLoggedIn(false);
        setRole(null);
        setCurrentPage('home');

        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('currentPage');
    };


    const navigateTo = (page) => {
        setCurrentPage(page);
        localStorage.setItem('currentPage', page);
    };

    return (
        <>
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
                <Home onNavigateToLogin={() => navigateTo('login')} />
            )}

            {currentPage === 'head_dashboard' && (
                <Header onLogOut={handleLogOut} />
            )}

            {currentPage === 'volunteer_dashboard' && (
                <div>
                    <h2>VOLUNTEER PAGE</h2>
                    <button onClick={handleLogOut} style={{margin: '20px', padding: '10px'}}>Вийти</button>
                </div>
            )}

            {currentPage === 'customer_dashboard' && (
                <div>
                    <h2>CUSTOMER PAGE</h2>
                    <button onClick={handleLogOut} style={{margin: '20px', padding: '10px'}}>Вийти</button>
                </div>
            )}
        </>
    );
}

export default App;