import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuctionDetail } from './pages/AuctionDetail';
import { PublishAuction } from './pages/PublishAuction';
import { UserCenter } from './pages/UserCenter';
import { Navbar } from './shared/components/Navbar';
import { ToastContainer } from './modules/message/components/Toast';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/publish" element={<PublishAuction />} />
          <Route path="/user" element={<UserCenter />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}
