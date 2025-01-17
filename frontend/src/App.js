import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/videos" /> : <Login />} />
        <Route path="/upload" element={isAuthenticated ? <VideoUpload /> : <Navigate to="/" />} />
        <Route path="/videos" element={isAuthenticated ? <VideoList /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
