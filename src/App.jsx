import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PixelTransition from './components/PixelTransition';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Housing = lazy(() => import('./pages/Housing'));
const MapPage = lazy(() => import('./pages/MapPage'));
const HouseDetails = lazy(() => import('./pages/HouseDetails'));

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PixelTransition><Home /></PixelTransition>} />
        <Route path="/housing" element={<PixelTransition><Housing /></PixelTransition>} />
        <Route path="/map" element={<PixelTransition><MapPage /></PixelTransition>} />
        <Route path="/details" element={<PixelTransition><HouseDetails /></PixelTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />

        <Suspense fallback={<div>Loading...</div>}>
          <AnimatedRoutes />
        </Suspense>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
