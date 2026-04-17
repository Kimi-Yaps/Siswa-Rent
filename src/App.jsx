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
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const AuthSuccess = lazy(() => import('./pages/AuthSuccess'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/signin', '/signup', '/forgot-password', '/auth-success'].includes(location.pathname);

  return (
    <div className="app-container">
      {!isAuthPage && <Navbar />}

      <Suspense fallback={<div>Loading...</div>}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PixelTransition><Home /></PixelTransition>} />
            <Route path="/housing" element={<PixelTransition><Housing /></PixelTransition>} />
            <Route path="/map" element={<PixelTransition><MapPage /></PixelTransition>} />
            <Route path="/details" element={<PixelTransition><HouseDetails /></PixelTransition>} />
            <Route path="/signin" element={<PixelTransition><SignIn /></PixelTransition>} />
            <Route path="/signup" element={<PixelTransition><SignUp /></PixelTransition>} />
            <Route path="/forgot-password" element={<PixelTransition><ForgotPassword /></PixelTransition>} />
            <Route path="/auth-success" element={<PixelTransition><AuthSuccess /></PixelTransition>} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {!isAuthPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
