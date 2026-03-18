import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
      const response = await axios.post(`${apiBase}/api/users/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 auth-page">
      <div className="row w-100 justify-content-center">
        <div className="col-11 col-sm-9 col-md-6 col-lg-4">
          <div className="glass-card p-4 p-sm-5 animate-in">
            <div className="text-center mb-5">
              <h1 className="gradient-text mb-2">Welcome Back</h1>
              <p className="text-white-50">Log in to continue your career journey</p>
            </div>
            
            {error && <div className="alert alert-danger border-0 bg-danger-subtle text-danger mb-4 text-center">{error}</div>}
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="form-label text-white-50 ms-1 small fw-bold text-uppercase">Email Address</label>
                <input 
                  type="email" 
                  className="form-control auth-form-input shadow-none" 
                  placeholder="name@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-5">
                <label className="form-label text-white-50 ms-1 small fw-bold text-uppercase">Password</label>
                <input 
                  type="password" 
                  className="form-control auth-form-input shadow-none" 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-3 glow-btn">
                Sign In
              </button>
            </form>
            
            <div className="mt-5 text-center">
              <span className="text-white-50">Don't have an account? </span>
              <Link to="/register" className="text-primary text-decoration-none fw-bold hover-underline">Register Now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
