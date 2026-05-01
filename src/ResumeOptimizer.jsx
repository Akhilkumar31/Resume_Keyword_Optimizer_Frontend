import { useState } from 'react';
import './ResumeOptimizer.css';

export default function ResumeOptimizer() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      // Check file type
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a .txt, .pdf, or .docx file.');
        setResume(null);
        return;
      }

      // Check file size (max 5MB)
      const maxSizeMB = 5;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File is too large. Maximum file size is ${maxSizeMB}MB.`);
        setResume(null);
        return;
      }

      setResume(file);
      setError(null);
    }
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
    // Clear error message when user starts typing
    if (error?.includes('Job description')) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!resume) {
      setError('Resume file is required. Please upload a file to continue.');
      return;
    }

    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription) {
      setError('Job description is required. Please paste or type the job description.');
      return;
    }

    if (trimmedDescription.length < 20) {
      setError('Job description is too short. Please provide at least 20 characters.');
      return;
    }

    // Clear previous results and errors when starting new analysis
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('job_description', trimmedDescription);

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid input. Please check your resume and job description format.');
        } else if (response.status === 500) {
          throw new Error('Server error. The backend encountered an issue. Please try again later.');
        } else if (response.status === 503) {
          throw new Error('Service unavailable. The backend server is currently down.');
        } else {
          throw new Error(`Server error (${response.status}). Please try again.`);
        }
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout. The server took too long to respond. Please try again.');
      } else if (err instanceof TypeError) {
        setError('Network error. Unable to connect to the server. Please check if the backend is running at http://127.0.0.1:8000');
      } else {
        setError(err.message || 'Failed to analyze resume. Please try again.');
      }
      setResult(null); // Clear any previous results on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-optimizer">
      <div className="container">
        <h1>Resume Keyword Optimizer</h1>
        <p className="subtitle">Optimize your resume to match job descriptions</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="resume" className="label">Upload Resume</label>
            <input
              id="resume"
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleResumeChange}
              className="file-input"
              disabled={loading}
            />
            {resume && (
              <p className="file-name">✓ {resume.name}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription" className="label">Job Description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              placeholder="Paste the job description here..."
              className="textarea"
              rows="8"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="button"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p className="loading-text">Analyzing your resume...</p>
            <p className="loading-subtext">Matching keywords against the job description</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {result && !loading && (() => {
          const score = result.score ?? 0;
          const scoreLabel =
            score >= 80 ? 'Excellent Match' :
            score >= 60 ? 'Good Match' :
            score >= 40 ? 'Fair Match' : 'Needs Improvement';
          const scoreColor =
            score >= 80 ? '#2e7d32' :
            score >= 60 ? '#1565c0' :
            score >= 40 ? '#e65100' : '#c62828';
          const scoreBg =
            score >= 80 ? 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)' :
            score >= 60 ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' :
            score >= 40 ? 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)' :
                          'linear-gradient(135deg, #e53935 0%, #c62828 100%)';
          return (
            <div className="results">
              <div className="score-card" style={{ background: scoreBg }}>
                <p className="score-label">{scoreLabel}</p>
                <div className="score-circle">
                  <span className="score-value">{score}%</span>
                </div>
                <p className="score-sublabel">keyword match rate</p>
              </div>

              {result.matched_keywords && result.matched_keywords.length > 0 && (
                <div className="keywords-section">
                  <h3 className="section-title matched-title">
                    <span className="section-icon">✓</span>
                    Matched Keywords
                    <span className="keyword-count">{result.matched_keywords.length}</span>
                  </h3>
                  <div className="keywords-list">
                    {result.matched_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="keyword matched"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#c8e6c9',
                          color: '#1b5e20',
                          border: '1px solid #81c784',
                          borderRadius: '20px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(76, 175, 80, 0.15)',
                          transition: 'all 0.2s ease',
                          cursor: 'default',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>✓</span>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missing_keywords && result.missing_keywords.length > 0 && (
                <div className="keywords-section">
                  <h3 className="section-title missing-title">
                    <span className="section-icon">✗</span>
                    Missing Keywords
                    <span className="keyword-count missing-count">{result.missing_keywords.length}</span>
                  </h3>
                  <p className="missing-keywords-hint">Add these keywords to improve your match score:</p>
                  <div className="keywords-list">
                    {result.missing_keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="keyword missing"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#ffcdd2',
                          color: '#b71c1c',
                          border: '1px solid #ef5350',
                          borderRadius: '20px',
                          padding: '8px 14px',
                          fontSize: '13px',
                          fontWeight: '600',
                          boxShadow: '0 2px 4px rgba(244, 67, 54, 0.15)',
                          transition: 'all 0.2s ease',
                          cursor: 'default',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>+</span>
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
