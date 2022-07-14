import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { AppContextProvider } from './AppContext';
import SignIn from './SignIn';
import RegisterMain from './RegisterMain';
import DailyCashReport from './DailyCashReport';
import DailyJournal from './DailyJournal';
import ReceiptList from './ReceiptList';
import RegisterClose from './RegisterClose';
import RegisterOpen from './RegisterOpen';
import ShortcutEdit from './ShortcutEdit';
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

  return (
    <React.StrictMode>
      <AppContextProvider>
        <SignIn>
          <Router>
            <Routes>
              <Route path="/" element={<RegisterMain></RegisterMain>} />
              <Route path="/main_window" element={<RegisterMain></RegisterMain>} />
              <Route path="/register_open" element={<RegisterOpen />} />
              <Route path="/register_close" element={<RegisterClose />} />
              <Route path="/shortcut_edit" element={<ShortcutEdit />} />
              <Route path="/receipt_list" element={<ReceiptList />} />
              <Route path="/daily_cash_report" element={<DailyCashReport />} />
              <Route path="/daily_journal" element={<DailyJournal />} />
            </Routes>
          </Router>
        </SignIn>
      </AppContextProvider>
    </React.StrictMode>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
