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
            <p>Processing your resume...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="results">
            <div className="score-section">
              <h2>Match Score</h2>
              <div className="score-display">
                <span className="score-value">{result.score}%</span>
              </div>
            </div>

            {result.matched_keywords && result.matched_keywords.length > 0 && (
              <div className="keywords-section">
                <h3>Matched Keywords</h3>
                <div className="keywords-list">
                  {result.matched_keywords.map((keyword, index) => (
                    <span key={index} className="keyword matched">
                      ✓ {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.missing_keywords && result.missing_keywords.length > 0 && (
              <div className="keywords-section">
                <h3>Missing Keywords</h3>
                <p className="missing-keywords-hint">Consider adding these keywords to your resume:</p>
                <div className="keywords-list">
                  {result.missing_keywords.map((keyword, index) => (
                    <span key={index} className="keyword missing">
                      + {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
