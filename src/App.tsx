import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import History from './pages/History';
import FeatureManagement from './pages/FeatureManagement';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/features" element={<FeatureManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
