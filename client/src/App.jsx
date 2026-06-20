import { Routes, Route } from 'react-router-dom';
import BookingPage from './pages/BookingPage.jsx';
import TechnicianDashboard from './pages/TechnicianDashboard.jsx';

// Reititys:
//   /          → asiakkaiden varaussivu (AI-chat + varauslomake)
//   /hallinta  → mestarin hallintapaneeli (omat palvelut, kalenteri, varaukset)
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BookingPage />} />
      <Route path="/hallinta" element={<TechnicianDashboard />} />
    </Routes>
  );
}
