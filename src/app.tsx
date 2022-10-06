import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { AppContextProvider } from './AppContext';
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
import ReceiptPrint from './ReceiptPrint';
import SignIn from './SignIn';
import AppSetting from './AppSetting';

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <AppContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RegisterMain />} />
            <Route path="/main_window" element={<RegisterMain />} />
            <Route path="/app_setting" element={<AppSetting />} />
            <Route path="/sign_in" element={<SignIn moveTo="" />} />
            <Route path="/register_open" element={<RegisterOpen />} />
            <Route path="/register_close" element={<RegisterClose />} />
            <Route path="/shortcut_edit" element={<ShortcutEdit />} />
            <Route path="/receipt_list" element={<ReceiptList />} />
            <Route path="/receipt_print" element={<ReceiptPrint />} />
            <Route path="/daily_cash_report" element={<DailyCashReport />} />
            <Route path="/daily_journal" element={<DailyJournal />} />
          </Routes>
        </Router>
      </AppContextProvider>
    </React.StrictMode>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
