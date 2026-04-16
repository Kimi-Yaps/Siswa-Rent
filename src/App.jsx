import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

const Home = lazy(() => import('./pages/Home'));

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />

        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes below */}
          </Routes>
        </Suspense>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
