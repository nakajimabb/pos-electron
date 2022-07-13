import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { AppContextProvider } from './AppContext';
import SignIn from './SignIn';
import RegisterMain from './RegisterMain';
import './index.css';
import './App.css';
import './firebase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
  }, []);

  // return <SignIn />;
  if (!currentUser) return <SignIn />;

  return (
    <React.StrictMode>
      <AppContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<div>OK</div>} />
            <Route path="/main_window" element={<RegisterMain></RegisterMain>} />
          </Routes>
        </Router>
      </AppContextProvider>
    </React.StrictMode>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
