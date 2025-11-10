// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BingoApp from './App';
import AdminPage from './AdminPage';
import RankingPage from './Rank';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<RankingPage />} />
      <Route path="/play" element={<BingoApp />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  </Router>
);
