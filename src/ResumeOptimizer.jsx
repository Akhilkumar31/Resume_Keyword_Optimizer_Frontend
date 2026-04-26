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
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid file (.txt, .pdf, .docx)');
        return;
      }
      setResume(file);
      setError(null);
    }
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resume) {
      setError('Please upload a resume file');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('job_description', jobDescription);

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please check if the backend server is running.');
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
                      <span key={index} className="keyword matched">✓ {keyword}</span>
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
                      <span key={index} className="keyword missing">+ {keyword}</span>
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
