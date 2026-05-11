import React, { useEffect, useState } from 'react';
import '../styles/TestResultStyle.css';
import { Check, X, Eye, Clock, BarChart2, Code, AlertTriangle, Home } from 'lucide-react';
import DashboardHeader from '../components/StudentDashboard/dash';
import { useNavigate, useLocation } from 'react-router-dom';

const TestResultPage = () => {
  const [resultData,    setResultData]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [showDialog,    setShowDialog]    = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Prevent browser back navigation ──────────────────────
  useEffect(() => {
    for (let i = 0; i < 50; i++) window.history.pushState(null, '', window.location.href);
    window.history.replaceState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      navigate('/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // ── Load result ───────────────────────────────────────────
  // Primary source: navigation state (passed from CodingPage navigate call).
  // Fallback: localStorage (legacy / direct URL access).
  useEffect(() => {
    try {
      setLoading(true);

      // 1. Try location.state first (the correct path)
      let parsed = location.state?.resultData || null;

      // 2. Fallback to localStorage
      if (!parsed) {
        const saved = localStorage.getItem('test_result');
        if (saved) parsed = JSON.parse(saved);
      }

      if (!parsed) {
        setError('No test result found. Please take a test first.');
        setDialogMessage('No test result found. Please take a test first.');
        setShowDialog(true);
        return;
      }

      if (!parsed.testName || !parsed.studentName) {
        setError('Invalid test result data.');
        setDialogMessage('Invalid test result data.');
        setShowDialog(true);
        return;
      }

      setResultData(parsed);
    } catch (err) {
      console.error('Error loading test result:', err);
      setError('Failed to load test result.');
      setDialogMessage('Failed to load test result.');
      setShowDialog(true);
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  // ── Helpers ───────────────────────────────────────────────
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // ── Navigation ────────────────────────────────────────────
  const handleBackToDashboard = () => {
    localStorage.removeItem('test_result');
    localStorage.removeItem('test_progress');
    localStorage.removeItem('test_timer');
    navigate('/dashboard');
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    handleBackToDashboard();
  };

  // ── Score colour / label helpers ──────────────────────────
  const getScoreColor = (pct) => {
    if (pct >= 80) return 'success';
    if (pct >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceText = (pct) => {
    if (pct >= 80) return 'Excellent';
    if (pct >= 60) return 'Good';
    return 'Needs Improvement';
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content loading-container">
            <div className="circular-progress" />
            <p className="loading-text">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (error || !resultData) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content error-content">
            <AlertTriangle className="warning-icon" size={48} />
            <h3 className="error-title">Error</h3>
            <p className="error-message">{error}</p>
            <button className="btn btn-primary" onClick={handleBackToDashboard}>
              <Home size={16} className="btn-icon" /> Dashboard
            </button>
          </div>
        </div>

        {showDialog && (
          <div className="dialog-overlay" onClick={handleDialogClose}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header"><h3>Error</h3></div>
              <div className="dialog-content">
                <AlertTriangle className="dialog-icon" size={48} />
                <p>{dialogMessage}</p>
              </div>
              <div className="dialog-actions">
                <button className="btn btn-primary" onClick={handleDialogClose}>OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────
  const safeScore      = resultData.result_score       ?? 0;
  const safeTotal      = resultData.result_total_score ?? 0;
  const percentage     = safeTotal > 0 ? Math.round((safeScore / safeTotal) * 100) : 0;

  const totalMcqs =
    (resultData.mcqAnswered    || 0) +
    (resultData.mcqNotAnswered || 0) +
    (resultData.mcqNotVisited  || 0);
  const totalCoding    = resultData.codingIds?.length || 0;

  // Coding breakdown
  const codingResults  = resultData.codingResults || [];
  const totalTcPassed  = codingResults.reduce((s, r) => s + (r.testcasesPassed || 0), 0);
  const totalTcAll     = codingResults.reduce((s, r) => s + (r.totalTestcases   || 0), 0);

  // ── Main render ───────────────────────────────────────────
  return (
    <div>
      <DashboardHeader />
      <div className="container">
        <div className="card">
          <div className="card-content">

            {/* ── Test info header ──────────────────────────── */}
            <div className="test-info">
              <div className="test-info-main">
                <h2 className="test-name">{resultData.testName}</h2>
                <p className="student-name">Student: {resultData.studentName}</p>
              </div>
              <button className="btn btn-primary dashboard-btn" onClick={handleBackToDashboard}>
                <Home size={16} className="btn-icon" /> Dashboard
              </button>
            </div>

            {/* ── Score overview ────────────────────────────── */}
            <div className="score-overview">

              {/* Score card */}
              <div className="score-card">
                <div className={`score-percentage ${getScoreColor(percentage)}`}>
                  {percentage}%
                </div>
                <p className="score-details">
                  {safeScore} / {safeTotal} points
                </p>
                <div className={`performance-badge ${getScoreColor(percentage)}`}>
                  {getPerformanceText(percentage)}
                </div>
              </div>

              {/* Overall statistics */}
              <div className="stats-card">
                <div className="card-header">
                  <BarChart2 size={20} className="icon" />
                  <h3>Overall Statistics</h3>
                </div>
                <div className="stats-list">
                  <div className="stat-item">
                    <span>Total Questions</span>
                    <span className="stat-value">{totalMcqs + totalCoding}</span>
                  </div>
                  <div className="stat-item">
                    <span>Attempted</span>
                    <span className="stat-value">
                      {(resultData.mcqAnswered || 0) + (resultData.codingAnswered || 0)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span>Correct</span>
                    <span className="stat-value success">
                      {(resultData.mcqCorrect || 0) + (resultData.codingCorrect || 0)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span>MCQ Score</span>
                    <span className="stat-value">{resultData.mcqCorrect || 0} / {totalMcqs}</span>
                  </div>
                  <div className="stat-item">
                    <span>Coding Score</span>
                    <span className="stat-value">
                      {typeof resultData.result_coding_score === 'object'
                        ? resultData.result_coding_score.score
                        : (resultData.result_coding_score || 0)}{' '}
                      / {totalCoding * 10}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Detailed breakdown ────────────────────────── */}
            <div className="detailed-breakdown">

              {/* MCQ section */}
              {totalMcqs > 0 && (
                <div className="section-card">
                  <div className="section-header">
                    <BarChart2 size={24} className="icon" />
                    <h3>Multiple Choice Questions</h3>
                  </div>
                  <div className="grid-container">
                    <div className="grid-item success-light">
                      <Check size={32} className="grid-icon success" />
                      <div className="grid-value success">{resultData.mcqCorrect || 0}</div>
                      <div className="grid-label">Correct</div>
                    </div>
                    <div className="grid-item error-light">
                      <X size={32} className="grid-icon error" />
                      <div className="grid-value error">{resultData.mcqWrong || 0}</div>
                      <div className="grid-label">Wrong</div>
                    </div>
                    <div className="grid-item warning-light">
                      <Eye size={32} className="grid-icon warning" />
                      <div className="grid-value warning">{resultData.marked || 0}</div>
                      <div className="grid-label">Marked</div>
                    </div>
                    <div className="grid-item grey-light">
                      <Eye size={32} className="grid-icon grey" />
                      <div className="grid-value grey">{resultData.mcqNotVisited || 0}</div>
                      <div className="grid-label">Not Visited</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Coding section */}
              {totalCoding > 0 && (
                <div className="section-card">
                  <div className="section-header">
                    <Code size={24} className="icon" />
                    <h3>Coding Problems</h3>
                  </div>
                  <div className="grid-container">
                    <div className="grid-item success-light">
                      <Check size={32} className="grid-icon success" />
                      <div className="grid-value success">{resultData.codingCorrect || 0}</div>
                      <div className="grid-label">Solved</div>
                    </div>
                    <div className="grid-item error-light">
                      <X size={32} className="grid-icon error" />
                      <div className="grid-value error">{resultData.codingWrong || 0}</div>
                      <div className="grid-label">Failed</div>
                    </div>
                    <div className="grid-item warning-light">
                      <Eye size={32} className="grid-icon warning" />
                      <div className="grid-value warning">{resultData.codingAnswered || 0}</div>
                      <div className="grid-label">Attempted</div>
                    </div>
                    <div className="grid-item grey-light">
                      <Eye size={32} className="grid-icon grey" />
                      <div className="grid-value grey">{resultData.codingNotAnswered || 0}</div>
                      <div className="grid-label">Not Attempted</div>
                    </div>
                  </div>

                  {/* Per-problem breakdown */}
                  {codingResults.length > 0 && (
                    <div className="coding-breakdown" style={{ marginTop: '1rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                        Per-Problem Scores
                      </h4>
                      {codingResults.map((r, idx) => (
                        <div
                          key={r.codeId || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.4rem 0.75rem',
                            marginBottom: '0.35rem',
                            borderRadius: '8px',
                            background: r.score > 0 ? '#f0fdf4' : '#fff1f2',
                            border: `1px solid ${r.score > 0 ? '#bbf7d0' : '#fecdd3'}`,
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '0.875rem',
                          }}
                        >
                          <span style={{ color: '#374151' }}>Problem {idx + 1}</span>
                          <span style={{ color: '#6b7280' }}>
                            {r.testcasesPassed ?? 0}/{r.totalTestcases ?? 0} test cases
                          </span>
                          <span style={{ fontWeight: 600, color: r.score > 0 ? '#16a34a' : '#dc2626' }}>
                            {r.score} / {r.total ?? 10} pts
                          </span>
                        </div>
                      ))}
                      {totalTcAll > 0 && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.875rem',
                          color: '#1d4ed8',
                          fontWeight: 600,
                        }}>
                          Total test cases passed: {totalTcPassed} / {totalTcAll}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Error dialog ──────────────────────────────────── */}
        {showDialog && (
          <div className="dialog-overlay" onClick={handleDialogClose}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-header"><h3>Error</h3></div>
              <div className="dialog-content">
                <AlertTriangle className="dialog-icon" size={48} />
                <p>{dialogMessage}</p>
              </div>
              <div className="dialog-actions">
                <button className="btn btn-primary" onClick={handleDialogClose}>OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultPage;