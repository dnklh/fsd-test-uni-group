import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import ProjectList from './components/ProjectList';
import { authService } from './services/authService';

export interface User {
  id: number;
  email: string;
  createdAt: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      authService.getProfile()
        .then(response => {
          setUser(response.user);
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
          <h1>GitHub CRM</h1>
          {user && (
            <div className="user-info">
              <span>Welcome, {user.email}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        {user ? (
          <ProjectList />
        ) : (
          <AuthForm onLogin={handleLogin} />
        )}
      </main>
    </div>
  );
}

export default App;
