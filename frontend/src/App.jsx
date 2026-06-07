import React, {useState, useEffect} from 'react';
import Login from './auth/Login';
import Home from './home_page/Home';
import Register from './auth/Register';
import Header from './manager/Manager.jsx';
import Customer from './customer/Customer.jsx';
import Volunteer from "./volunteer/Volunteer.jsx";
import Coordinator from './coordinator/Coordinator.jsx';

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

    const handleLoginSuccess = (userRole, userId) => {
        setIsLoggedIn(true);
        setRole(userRole);

        let targetPage = 'home';

        if (userRole === 'CUSTOMER') {
            targetPage = 'customer_dashboard';
        } else if (userRole === 'VOLUNTEER') {
            targetPage = 'volunteer_dashboard';
        } else if (userRole === 'COORDINATOR') {
            targetPage = 'coordinator_dashboard';
        } else if (userRole === 'HEAD') {
            targetPage = 'head_dashboard';
        }

        setCurrentPage(targetPage);

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('currentPage', targetPage);

        if (userId) {
            localStorage.setItem('userId', userId);
        }
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