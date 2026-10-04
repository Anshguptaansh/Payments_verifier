// App.jsx — Standalone separate routes for Customer and Admin views

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerPage from './pages/CustomerPage';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer" element={<CustomerPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
