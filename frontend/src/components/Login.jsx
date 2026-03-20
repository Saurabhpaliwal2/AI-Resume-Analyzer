import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setAuth, apiBase, setApiBase }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showBridge, setShowBridge] = useState(false);
  const [newIp, setNewIp] = useState(apiBase.replace('http://', '').split(':')[0]);
  const navigate = useNavigate();

  const handleUpdateIp = () => {
    const formattedIp = newIp.startsWith('http') ? newIp : `http://${newIp}:9090`;
    setApiBase(formattedIp);
    localStorage.setItem('customApiBase', formattedIp);
    setShowBridge(false);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiBase}/api/users/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      setAuth(true);
      window.location.href = '/';
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Cannot connect to server at ' + apiBase);
        setShowBridge(true);
      } else if (err.response.status === 401) {
        setError('Invalid email or password');
      } else {
        const msg = typeof err.response.data === 'string'
          ? err.response.data
          : err.response.data?.message || 'An unexpected error occurred';
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
              <h1 className="gradient-text mb-2">Welcome Back</h1>
              <p className="text-white-50">Log in to continue your career journey</p>
            </div>

            {error && (
              <div className="alert alert-danger border-0 bg-danger-subtle text-danger mb-4 text-center small p-3">
                {error}
                {showBridge && (
                  <div className="mt-3 p-2 bg-dark bg-opacity-25 rounded text-start">
                    <p className="mb-2 fw-bold small text-white">🔧 Mobile Bridge Solution:</p>
                    <p className="small text-white-50 mb-2">Your computer's IP seems to be: <strong>192.168.0.238</strong></p>
                    <div className="input-group input-group-sm mb-2">
                      <span className="input-group-text bg-dark border-secondary text-white-50 small">IP</span>
                      <input
                        type="text"
                        className="form-control bg-dark border-secondary text-white shadow-none small"
                        placeholder="e.g. 192.168.0.238"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                      />
                      <button className="btn btn-primary" onClick={handleUpdateIp}>Connect</button>
                    </div>
                    <small className="text-info d-block">This lets your phone talk to your local backend.</small>
                  </div>
                )}
              </div>
            )}

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
