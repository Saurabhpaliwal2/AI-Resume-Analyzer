import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
      await axios.post(`${apiBase}/api/users/register`, formData);
      navigate('/login');
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Cannot connect to server at ' + apiBase);
      } else {
        const msg = typeof err.response.data === 'string' 
          ? err.response.data 
          : err.response.data?.message || 'Registration failed';
        setError(msg);
      }
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 auth-page">
      <div className="row w-100 justify-content-center">
        <div className="col-11 col-sm-9 col-md-6 col-lg-4">
          <div className="glass-card p-4 p-sm-5 animate-in">
            <div className="text-center mb-5">
              <h1 className="gradient-text mb-2">Create Account</h1>
              <p className="text-white-50">Start optimizing your career today</p>
            </div>

            {error && <div className="alert alert-danger border-0 bg-danger-subtle text-danger mb-4 text-center">{error}</div>}
            
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="form-label text-white-50 ms-1 small fw-bold text-uppercase">Full Name</label>
                <input 
                  type="text" 
                  className="form-control auth-form-input shadow-none" 
                  placeholder="John Doe"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-white-50 ms-1 small fw-bold text-uppercase">Email Address</label>
                <input 
                  type="email" 
                  className="form-control auth-form-input shadow-none" 
                  placeholder="name@example.com"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  required 
                />
              </div>
              <div className="mb-5">
                <label className="form-label text-white-50 ms-1 small fw-bold text-uppercase">Password</label>
                <input 
                  type="password" 
                  className="form-control auth-form-input shadow-none" 
                  placeholder="••••••••"
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-3 glow-btn">
                Create Account
              </button>
            </form>
            
            <div className="mt-5 text-center">
              <span className="text-white-50">Already have an account? </span>
              <Link to="/login" className="text-primary text-decoration-none fw-bold hover-underline">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
