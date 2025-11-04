// src/App.jsx

import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';
import VideoMeet from './pages/VideoMeet';

import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';

function App() {
  return (
    // The <Router> wrapper should be removed from here
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<HomePage/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/:url" element={<VideoMeet/>} />
      <Route path="/history" element={<HistoryPage/>} />
      
    </Routes>
  );
}

export default App;