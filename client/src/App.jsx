import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import Capsules from './pages/Capsules';
import Vault from './pages/Vault';
import AI from './pages/AI';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
<Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
<Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vault" 
          element={
            <ProtectedRoute>
              <Vault />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/beneficiaries" 
          element={
            <ProtectedRoute>
              <Beneficiaries />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/capsules" 
          element={
            <ProtectedRoute>
              <Capsules />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai" 
          element={
            <ProtectedRoute>
              <AI />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
