import React, {useState} from 'react';
import Login from './auth/Login';
import Home from './home_page/Home';
import Header from './header/Header';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [role, setRole] = useState(null);

    const handleLoginSuccess = (userRole) => {
        setIsLoggedIn(true);
        setRole(userRole);

        if (userRole === 'HEAD') {
            setCurrentPage('head_dashboard');
        } else {
            setCurrentPage('home');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setRole(null);
        setCurrentPage('home');
    };

    return (
        <>
            {currentPage === 'login' && (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onBackToHome={() => setCurrentPage('home')}
                />
            )}

            {currentPage === 'home' && (
                <Home
                    isLoggedIn={isLoggedIn}
                    onLogOut={handleLogout}
                    onNavigateToLogin={() => setCurrentPage('login')}
                />
            )}

            {currentPage === 'head_dashboard' && (
                <Header onLogOut={handleLogout}/>
            )}
        </>
    );
}

export default App;