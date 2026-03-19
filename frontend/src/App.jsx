import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import axios from 'axios';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler
);

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuth(false);
  };

  const handleAnalyze = async () => {
    if (!resume) return;
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobDescription', jobDescription);

    const token = localStorage.getItem('token');

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
      const response = await axios.post(`${apiBase}/api/resumes/analyze`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResults(response.data);
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Your session has expired. Please log in again.');
        handleLogout();
      } else if (err.response) {
        setError(`Server error (${err.response.status}): ${err.response.data || 'Unknown error'}`);
      } else if (err.request) {
        setError('No response from server. Ensure high-performance backend is running at port 9090.');
      } else {
        setError('Request setup failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const Dashboard = () => (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-5 animate-in">
        <div>
          <h1 className="display-5 gradient-text mb-0">AI Resume Analyzer</h1>
          <p className="text-white-50 mb-0">Unlock your potential with AI insights</p>
        </div>
        <button className="btn glow-btn btn-sm px-4" onClick={handleLogout}>Logout</button>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="glass-card p-4 h-100 animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="d-flex align-items-center mb-4">
              <span className="fs-4 me-3">📄</span>
              <h3 className="mb-0 fs-4">Upload Resume</h3>
            </div>
            <div 
              className="drop-zone p-5 text-center d-flex flex-column align-items-center justify-content-center" 
              style={{ minHeight: '250px' }}
              onClick={() => document.getElementById('file-input').click()}
            >
              {resume ? (
                <div className="text-success text-center">
                  <div className="display-4 mb-2">✅</div>
                  <h5 className="mb-1 text-truncate" style={{ maxWidth: '280px' }}>{resume.name}</h5>
                  <small className="text-white-50">Click to change file</small>
                </div>
              ) : (
                <div className="text-muted">
                  <div className="display-4 d-block mb-3 opacity-50">📁</div>
                  <p className="mb-1 fw-bold text-white">Select PDF Resume</p>
                  <p className="small text-white-50">Drag and drop or click to browse</p>
                </div>
              )}
              <input 
                id="file-input" type="file" accept=".pdf" hidden 
                onChange={(e) => setResume(e.target.files[0])} 
              />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="glass-card p-4 h-100 animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center">
                <span className="fs-4 me-3">💼</span>
                <h3 className="mb-0 fs-4">Job Description</h3>
              </div>
              <button 
                className="btn btn-sm text-primary p-0 border-0 fw-bold" 
                style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}
                onClick={() => setJobDescription("We are looking for a Full Stack Developer with 3+ years of experience in React.js, Java Spring Boot, and Python. The ideal candidate should have experience with MySQL, RESTful APIs, and AI integrations (like Gemini or OpenAI). Strong problem-solving skills and teamwork are essential. Knowledge of HTML, CSS, JavaScript, and React Bootstrap is also required.")}
              >
                LOAD EXAMPLE
              </button>
            </div>
              <textarea 
                className="form-control auth-form-input shadow-none" 
                rows="8" 
                placeholder="Paste target job description to match, or leave empty for a general resume analysis..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                style={{ resize: 'none' }}
              />
          </div>
        </div>

          <button 
            className="btn btn-primary btn-lg w-100 py-4 fw-bold glow-btn fs-5"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !resume}
          >
            {isAnalyzing ? (
              <span className="d-flex align-items-center justify-content-center">
                <span className="spinner-border spinner-border-sm me-3" role="status" aria-hidden="true"></span>
                Processing with Gemini AI...
              </span>
            ) : (jobDescription ? 'Generate AI Match Report' : 'Run General Resume Analysis')}
          </button>
      </div>

      {error && (
        <div className="alert alert-danger mt-5 border-0 bg-danger-subtle text-danger animate-in">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (() => {
        const score = results.skillMatchPercentage || 0;
        const matchedCount = results.matchedSkills?.filter(s => s !== "No direct skill matches found").length || 0;
        const missingCount = results.missingSkills?.filter(s => s !== "All required skills present!").length || 0;
        const totalSkills = matchedCount + missingCount;
        const skillScores = results.skillScores || {};
        const skillLabels = Object.keys(skillScores);
        const skillValues = Object.values(skillScores);

        // Doughnut chart data
        const doughnutData = {
          labels: ['Matched', 'Missing'],
          datasets: [{
            data: [matchedCount || 0, missingCount || 0],
            backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.6)'],
            borderColor: ['#22c55e', '#ef4444'],
            borderWidth: 2,
            hoverOffset: 8
          }]
        };
        const doughnutOptions = {
          responsive: true, cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 }, padding: 15 } },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleColor: '#e2e8f0', bodyColor: '#94a3b8' }
          }
        };

        // Bar chart data for individual skill percentages
        const barData = {
          labels: skillLabels.length > 0 ? skillLabels : ['No skills detected'],
          datasets: [{
            label: 'Skill Confidence %',
            data: skillValues.length > 0 ? skillValues : [0],
            backgroundColor: skillValues.map(v => v >= 60 ? 'rgba(34,197,94,0.7)' : v > 0 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.5)'),
            borderColor: skillValues.map(v => v >= 60 ? '#22c55e' : v > 0 ? '#f59e0b' : '#ef4444'),
            borderWidth: 1, borderRadius: 6, barPercentage: 0.7
          }]
        };
        const barOptions = {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          scales: {
            x: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } },
            y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 12, weight: 'bold' } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', callbacks: { label: ctx => ctx.raw + '%' } }
          }
        };

        // Radar chart data (top 8 skills)
        const topSkills = skillLabels.slice(0, 8);
        const topValues = skillValues.slice(0, 8);
        const radarData = {
          labels: topSkills.length > 0 ? topSkills : ['N/A'],
          datasets: [{
            label: 'Your Profile',
            data: topValues.length > 0 ? topValues : [0],
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: '#8b5cf6',
            borderWidth: 2, pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff', pointRadius: 4
          }]
        };
        const radarOptions = {
          responsive: true, maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true, max: 100,
              grid: { color: 'rgba(255,255,255,0.08)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: { color: '#e2e8f0', font: { size: 11, weight: 'bold' } },
              ticks: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', callbacks: { label: ctx => ctx.raw + '%' } }
          }
        };

        return (
        <div className="results-section mt-5 animate-in">
          <h3 className="gradient-text text-center mb-4 fs-4">📊 AI Analysis Report</h3>
          
          {/* Resume Profile Card */}
          {results.profileData && (
            <div className="glass-card p-4 mb-4 animate-in" style={{ animationDelay: '0.1s' }}>
              <div className="row align-items-center">
                <div className="col-md-7 border-end border-white-10">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fs-3 me-3">👤</span>
                    <h4 className="mb-0 text-white">{results.profileData.participant_name || results.profileData.name || 'Candidate Profile'}</h4>
                  </div>
                  <p className="text-primary small mb-3">
                    <span className="me-3">📧 {results.profileData.email || 'Email not found'}</span>
                    <span>⏳ {results.profileData.experience || 'Experience not specified'}</span>
                  </p>
                  <div className="p-3 bg-white-5 rounded-3">
                    <p className="small mb-0 text-white-50" style={{ lineHeight: '1.6' }}>
                      <strong className="text-white d-block mb-1 small text-uppercase ls-wide">Professional Summary</strong>
                      {results.profileData.summary || 'No summary extracted from resume.'}
                    </p>
                  </div>
                </div>
                <div className="col-md-5 ps-md-4 mt-3 mt-md-0">
                  <div className="text-center">
                    <div className="display-4 fw-bold gradient-text mb-0">{score}%</div>
                    <div className="text-white-50 small text-uppercase ls-wide">Analyze Confidence</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4">

            {/* Doughnut - Overall Match */}
            <div className="col-md-4">
              <div className="glass-card p-4 text-center h-100">
                <h5 className="text-white-50 small text-uppercase ls-wide mb-3">Overall Match</h5>
                <div style={{ maxWidth: '220px', margin: '0 auto' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div className="mt-3">
                  <span className="display-5 fw-bold" style={{ color: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444' }}>{score}%</span>
                  <p className="text-white-50 small mb-0 mt-1">
                    {score >= 70 ? '🟢 Strong Match' : score >= 40 ? '🟡 Partial Match' : '🔴 Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>

            {/* Radar - Skill Distribution */}
            <div className="col-md-4">
              <div className="glass-card p-4 h-100">
                <h5 className="text-white-50 small text-uppercase ls-wide mb-3">Skill Radar</h5>
                <div style={{ height: '280px' }}>
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>
            </div>

            {/* Matched vs Missing Badges */}
            <div className="col-md-4">
              <div className="glass-card p-4 h-100">
                <h5 className="text-success small text-uppercase ls-wide mb-2">✓ Matched ({matchedCount})</h5>
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {results.matchedSkills?.filter(s => s !== "No direct skill matches found").map((s, i) => (
                    <span key={i} className="badge bg-success-subtle text-success border border-success-subtle" style={{fontSize:'0.7rem'}}>{s}</span>
                  ))}
                  {matchedCount === 0 && <span className="text-white-50 small">None found</span>}
                </div>
                <h5 className="text-danger small text-uppercase ls-wide mb-2 mt-3">⚠ Missing ({missingCount})</h5>
                <div className="d-flex flex-wrap gap-1">
                  {results.missingSkills?.filter(s => s !== "All required skills present!").map((s, i) => (
                    <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{fontSize:'0.7rem'}}>{s}</span>
                  ))}
                  {missingCount === 0 && <span className="text-white-50 small">All present! ✨</span>}
                </div>
              </div>
            </div>

            {/* Bar Chart - Per-Skill Percentages */}
            {skillLabels.length > 0 && (
            <div className="col-12">
              <div className="glass-card p-4">
                <h5 className="text-white-50 small text-uppercase ls-wide mb-3">📈 Skill Percentage Breakdown</h5>
                <div style={{ height: Math.max(250, skillLabels.length * 38) + 'px' }}>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
            )}

            {/* Suggestions & Recommendations */}
            <div className="col-12">
              <div className="glass-card p-4 mt-2">
                <h5 className="text-info small text-uppercase ls-wide mb-4">💡 Improvement Suggestions</h5>
                <div className="row">
                  <div className="col-md-7">
                    <ul className="list-group list-group-flush bg-transparent">
                      {results.improvementSuggestions?.map((s, i) => (
                        <li key={i} className="list-group-item bg-transparent text-white-50 border-0 ps-0 pb-3">
                          <span className="text-info me-2">✨</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="col-md-5 border-start border-secondary border-opacity-25 ps-md-4">
                    <h5 className="text-secondary small text-uppercase ls-wide mb-3">Recommended Roles</h5>
                    <div className="d-flex flex-column gap-2">
                      {results.jobRecommendations?.map((r, i) => (
                        <div key={i} className="bg-white bg-opacity-5 p-2 px-3 rounded text-white-50 small">
                          🎯 {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

    </div>
  );

  return (
    <Router>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <Routes>
        <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login setAuth={setIsAuth} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={isAuth ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
