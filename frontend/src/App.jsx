import React, { useState } from 'react';
import Login from './auth/Login';
import Home from './home_page/Home';

function App() {
  // стейт для збереження статусу входу користувача
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // стейт для керування тим, яку сторінку зараз показувати ('home' або 'login')
  const [currentPage, setCurrentPage] = useState('home');

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage('home'); // Після успішного входу повертаємо на головну
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('home'); // При виході залишаємо на головній, але статус змінюється
  };

  const handleNavigateToLogin = () => {
    setCurrentPage('login');
  };

  const handleNavigateToHome = () => {
    setCurrentPage('home');
  };

  return (
      <>
        {currentPage === 'login' ? (
            <Login
                onLoginSuccess={handleLoginSuccess}
                onBackToHome={handleNavigateToHome}
            />
        ) : (
            <Home
                isLoggedIn={isLoggedIn}
                onLogOut={handleLogout}
                onNavigateToLogin={handleNavigateToLogin}
            />
        )}
      </>
  );
}

export default App;