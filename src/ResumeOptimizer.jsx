import { useState } from 'react';
import './ResumeOptimizer.css';

// Helper function to determine score label and background gradient
function getScoreDisplay(score) {
  if (score >= 80) {
    return {
      label: 'Excellent Match',
      background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
    };
  }
  if (score >= 60) {
    return {
      label: 'Good Match',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    };
  }
  if (score >= 40) {
    return {
      label: 'Fair Match',
      background: 'linear-gradient(135deg, #fb8c00 0%, #e65100 100%)',
    };
  }
  return {
    label: 'Needs Improvement',
    background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
  };
}

// Helper function to validate API response structure
function validateAnalysisResponse(data) {
  const requiredFields = ['score', 'matched_keywords', 'missing_keywords'];
  const missingFields = requiredFields.filter(field => !(field in data));

  if (missingFields.length > 0) {
    throw new Error(
      `Invalid server response. Missing fields: ${missingFields.join(', ')}`
    );
  }

  // Ensure arrays are arrays
  if (!Array.isArray(data.matched_keywords)) {
    data.matched_keywords = [];
  }
  if (!Array.isArray(data.missing_keywords)) {
    data.missing_keywords = [];
  }
  if (!Array.isArray(data.suggestions)) {
    data.suggestions = [];
  }

  return data;
}

export default function ResumeOptimizer() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', // Some browsers report .docx as application/zip
    ];
    const validExtensions = ['.txt', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    // Check file type by MIME type OR extension (handles cross-browser MIME inconsistencies)
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setErrorMessage('Invalid file type. Please upload a .txt, .pdf, or .docx file.');
      setResume(null);
      return;
    }

    // Block application/zip files that are NOT .docx by extension
    if (file.type === 'application/zip' && fileExtension !== '.docx') {
      setErrorMessage('Invalid file type. Please upload a .txt, .pdf, or .docx file.');
      setResume(null);
      return;
    }

    // Check file size (max 5MB)
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File is too large. Maximum file size is ${maxSizeMB}MB.`);
      setResume(null);
      return;
    }

    setResume(file);
    setErrorMessage(null);
    setAnalysisResult(null);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
    // Clear error message when user starts typing
    if (errorMessage?.includes('Job description')) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!resume) {
      setErrorMessage('Resume file is required. Please upload a file to continue.');
      return;
    }

    const trimmedDescription = jobDescription.trim();
    if (!trimmedDescription) {
      setErrorMessage('Job description is required. Please paste or type the job description.');
      return;
    }

    if (trimmedDescription.length < 20) {
      setErrorMessage('Job description is too short. Please provide at least 20 characters.');
      return;
    }

    // Clear previous results and errors when starting new analysis
    setAnalysisResult(null);
    setErrorMessage(null);
    setIsLoading(true);

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
        }
        if (response.status === 500) {
          throw new Error('Server error. The backend encountered an issue. Please try again later.');
        }
        if (response.status === 503) {
          throw new Error('Service unavailable. The backend server is currently down.');
        }
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      const data = await response.json();
      const validatedData = validateAnalysisResponse(data);
      setAnalysisResult(validatedData);
    } catch (err) {
      if (err.name === 'AbortError') {
        setErrorMessage('Request timeout. The server took too long to respond. Please try again.');
      } else if (err instanceof TypeError) {
        setErrorMessage(
          'Network error. Unable to connect to the server. Please check if the backend is running at http://127.0.0.1:8000'
        );
      } else {
        setErrorMessage(err.message || 'Failed to analyze resume. Please try again.');
      }
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="button"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p className="loading-text">Analyzing your resume...</p>
            <p className="loading-subtext">Matching keywords against the job description</p>
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {errorMessage}
          </div>
        )}

        {analysisResult && !isLoading && (
          <AnalysisResultsDisplay result={analysisResult} />
        )}
      </div>
    </div>
  );
}

// Separate component for displaying analysis results
function AnalysisResultsDisplay({ result }) {
  const score = result.score ?? 0;
  const scoreDisplay = getScoreDisplay(score);

  return (
    <div className="results">
      <div className="score-card" style={{ background: scoreDisplay.background }}>
        <p className="score-label">{scoreDisplay.label}</p>
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
              <span key={index} className="keyword matched">
                <span>✓</span>
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
              <span key={index} className="keyword missing">
                <span>+</span>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.suggestions && result.suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3 className="section-title suggestions-title">
            <span className="section-icon">💡</span>
            Suggestions for Improvement
          </h3>
          {result.suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
