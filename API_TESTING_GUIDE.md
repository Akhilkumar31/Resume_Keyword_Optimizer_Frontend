# API Testing Guide

## Quick Reference for Testing Backend Integration

### Prerequisites
1. Backend running: `http://127.0.0.1:8000`
2. Frontend running: `http://localhost:5173`
3. Test files ready (sample resume and job description)

---

## 1. Testing Analyze Endpoint

### Using cURL

```bash
# Create a sample test resume
echo "Python Developer
Skills: Python, JavaScript, React, SQL, Git
Experience: 5 years in web development" > resume.txt

# Test the analyze endpoint
curl -X POST http://127.0.0.1:8000/analyze \
  -F "resume=@resume.txt" \
  -F "job_description=Senior Python Developer with React experience required. Must know JavaScript, SQL, Docker, and Git."
```

### Expected Response (200 OK)
```json
{
  "score": 85,
  "matched_keywords": ["Python", "JavaScript", "React", "SQL", "Git"],
  "missing_keywords": ["Docker"],
  "suggestions": [
    "Consider adding Docker skills to your resume",
    "Highlight your web development experience"
  ]
}
```

### Expected Status Codes

| Status | Meaning | Example Message |
|--------|---------|-----------------|
| 200 | Success | Analysis completed |
| 400 | Bad Request | Missing resume or job_description |
| 500 | Server Error | Backend processing error |
| 503 | Unavailable | Backend down or restarting |

---

## 2. Testing Fetch Job Description Endpoint

### Using cURL

```bash
curl -X POST http://127.0.0.1:8000/fetch-job-description \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job/123"}'
```

### Expected Response (200 OK)
```json
{
  "job_description": "Senior Software Engineer - Python...\n\nRequirements:\n- 5+ years experience\n- Python\n- React\n- SQL"
}
```

### Expected Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Successfully fetched |
| 400 | Invalid URL format |
| 404 | URL not found |
| 500 | Server error |

---

## 3. Testing with Frontend

### Test Case 1: Happy Path

1. **Open Frontend**: `http://localhost:5173`
2. **Upload Resume**: Select a `.txt`, `.pdf`, or `.docx` file
3. **Enter Job Description**: Paste a job description (min 20 chars)
4. **Click Analyze**: Should see loading spinner
5. **Verify Results**: 
   - Score displayed (0-100%)
   - Matched keywords shown (green badges)
   - Missing keywords shown (red badges)
   - Suggestions displayed
   - Download button visible

### Test Case 2: File Upload Validation

```
Test 1: Upload .txt file
Expected: ✓ File name shown, ready to submit

Test 2: Upload .pdf file
Expected: ✓ File name shown, ready to submit

Test 3: Upload .docx file
Expected: ✓ File name shown, ready to submit

Test 4: Upload .jpg file
Expected: ❌ Error: "Invalid file type. Please upload a .txt, .pdf, or .docx file."

Test 5: Upload 10MB file
Expected: ❌ Error: "File is too large. Maximum file size is 5MB."

Test 6: Upload with <20 char description
Expected: ❌ Error: "Job description is too short. Please provide at least 20 characters."
```

### Test Case 3: API Error Handling

```
Test 1: Stop backend, try to submit
Expected: ❌ Error: "Network error. Unable to connect to the server. Please check if the backend is running at http://127.0.0.1:8000"

Test 2: Backend slow (>30s response), try to submit
Expected: ⏱️ Error: "Request timeout. The server took too long to respond. Please try again."

Test 3: Invalid job description format, try to submit
Expected: ❌ Error: "Invalid input. Please check your resume and job description format."
```

### Test Case 4: Job Description Fetch

```
Test 1: Enter valid job URL with content
Expected: ✓ Job description populated in textarea, URL field cleared

Test 2: Enter invalid URL (e.g., "not-a-url")
Expected: ❌ Error: "Invalid URL. Please enter a valid URL starting with http:// or https://"

Test 3: Enter URL that returns 404
Expected: ❌ Error: "Job description not found at the provided URL."
```

### Test Case 5: Results Display

```
Score: 85%
Expected: 
- Large circular display showing "85%"
- Green gradient background
- Label: "Excellent Match"

Matched Keywords: ["Python", "React", "SQL"]
Expected:
- Green badges with ✓ icon
- Count badge showing [3]
- Hover effect with slight lift

Missing Keywords: ["Docker", "Kubernetes"]
Expected:
- Red badges with + icon
- Count badge showing [2] in red
- Helper text: "Add these keywords to improve your match score:"

Suggestions: 2 items
Expected:
- Numbered list (1. 2.)
- Blue left border
- Readable, actionable text
```

### Test Case 6: Report Download

```
Step 1: Complete analysis
Step 2: Click "Download Report" button
Expected:
- File downloads: Resume_Analysis_Report_[DATE].txt
- File contains formatted report with:
  - Timestamp
  - Score and status
  - Matched keywords list
  - Missing keywords list
  - Suggestions
```

---

## 4. Performance Testing

### Load Testing

Test with large files and complex job descriptions:

```bash
# Create large test resume (1MB+)
yes "Python Developer with extensive experience in web development" | head -10000 > large_resume.txt

# Test with large resume and job description
curl -X POST http://127.0.0.1:8000/analyze \
  -F "resume=@large_resume.txt" \
  -F "job_description=$(cat large_job.txt)" \
  -w "\nTime: %{time_total}s\n"
```

**Expected Metrics**:
- Response time: < 5 seconds for typical files
- Timeout: 30 seconds max
- Error handling: Graceful failure on oversized content

---

## 5. Browser Compatibility Testing

### Test on Different Browsers

| Browser | Version | Test | Result |
|---------|---------|------|--------|
| Chrome | Latest | Full test suite | ✅ Should pass |
| Firefox | Latest | Full test suite | ✅ Should pass |
| Safari | 14+ | Full test suite | ✅ Should pass |
| Edge | Latest | Full test suite | ✅ Should pass |
| Mobile Safari | iOS 14+ | Responsive design | ✅ Should work |

### Specific Compatibility Tests

```javascript
// Test: AbortController with timeout fallback
// Browser Support:
// - Chrome 60+: ✅
// - Firefox 55+: ✅
// - Safari 11.1+: ✅
// - Edge 16+: ✅
```

---

## 6. Debugging Tips

### Browser DevTools Checklist

1. **Network Tab**:
   - Open DevTools (F12)
   - Go to Network tab
   - Perform analysis
   - Verify request:
     - URL: `http://127.0.0.1:8000/analyze`
     - Method: POST
     - Headers: Content-Type should be multipart/form-data
     - Body: FormData with resume and job_description keys
     - Status: 200 on success

2. **Console Tab**:
   - Check for JavaScript errors
   - Look for error logs: `console.error('...')`
   - Verify no unhandled Promise rejections

3. **Application Tab** (Storage):
   - Check localStorage for any stored data
   - Verify no CORS blocking messages

### Common Issues & Debug Steps

**Issue**: "Failed to analyze resume. Please try again."
```
1. Check Network tab - what's the actual error?
2. Check backend logs - any errors?
3. Check file size - is resume too large?
4. Check job description - is it valid text?
5. Check if backend is running on 127.0.0.1:8000
```

**Issue**: File upload fails silently
```
1. Check file type - is it .txt, .pdf, or .docx?
2. Check MIME type - browser may report differently
3. Check file size - under 5MB?
4. Check console for JavaScript errors
5. Try different file format
```

**Issue**: Timeout error appears frequently
```
1. Check backend response time
2. Check network latency
3. Check if backend is overloaded
4. Check if file size is very large
5. Increase API_TIMEOUT if needed (change in code)
```

---

## 7. FormData Verification

### What the Frontend Sends

```javascript
const formData = new FormData();
formData.append('resume', fileObject);           // Key: "resume"
formData.append('job_description', "text...");  // Key: "job_description"
```

### How to Verify in Browser

```javascript
// In browser console
// 1. Open page and upload file
// 2. Before clicking Analyze, open DevTools
// 3. Go to Network tab
// 4. Click Analyze
// 5. Click on the POST request to /analyze
// 6. Go to Request tab
// 7. Look for FormData section with:
//    - resume: [File object]
//    - job_description: "text content..."
```

### How to Verify in Backend

```python
# In FastAPI/Flask backend
@app.post("/analyze")
async def analyze(resume: UploadFile, job_description: str):
    # resume.filename - original filename
    # job_description - the text content
    print(f"Resume field name received: {resume.filename}")
    print(f"Job description length: {len(job_description)}")
```

---

## 8. Network Simulation (Testing Error Cases)

### Using Chrome DevTools

1. **Simulate Slow 3G**:
   - Open DevTools → Network tab
   - Click dropdown that says "No throttling"
   - Select "Slow 3G"
   - Perform analysis
   - Verify timeout handling works

2. **Simulate Offline**:
   - DevTools → Network tab
   - Check "Offline" checkbox
   - Try to submit
   - Should show network error

3. **Simulate Server Errors**:
   - DevTools → Network tab
   - Right-click any request
   - Select "Block request URL"
   - Try to submit
   - Should show timeout or network error

---

## 9. Success Metrics

### All Tests Should Pass

- ✅ File upload validation works
- ✅ Job description input validates correctly
- ✅ Analyze request sends correct FormData
- ✅ API response is parsed correctly
- ✅ Results display properly formatted
- ✅ Error messages are user-friendly
- ✅ Loading states show correctly
- ✅ Download report generates valid file
- ✅ Timeout errors are handled
- ✅ Network errors are handled
- ✅ Works on all supported browsers

---

## 10. Test Data Examples

### Sample Resume
```
Senior Python Developer
Python, JavaScript, React, Node.js
FastAPI, Django, PostgreSQL, Redis
Docker, Kubernetes, AWS
Git, CI/CD, Agile

Experience:
- 7 years in backend development
- 3 years with full-stack projects
- Led team of 4 developers
```

### Sample Job Description
```
Senior Software Engineer - Python

Requirements:
- 5+ years Python development
- React or Vue.js
- PostgreSQL or MongoDB
- Docker experience
- AWS or GCP
- Leadership experience preferred

Nice to have:
- Kubernetes
- Machine Learning
- Technical writing
```

### Expected Analysis
```
Score: 78% (Good Match)

Matched: Python, React, PostgreSQL, Docker, AWS, Git
Missing: Kubernetes, Machine Learning, MongoDB
Suggestions:
1. Add Kubernetes certification to strengthen DevOps skills
2. Consider learning and showcasing ML projects
```

---

**Ready to Test?** Start with Test Case 1 (Happy Path) to verify everything works end-to-end! ✅
