import pytest
import os
import io
from app import app, analyze_with_ai, extract_text_from_pdf, check_formatting, extract_skills_and_experience
from reportlab.pdfgen import canvas
import json

@pytest.fixture
def sample_resume_text():
    """Create a sample resume text for testing."""
    return """
    John Doe
    Software Engineer
    
    Skills:
    - Python, JavaScript, React, Node.js
    - AWS, Docker, Kubernetes
    - Machine Learning, TensorFlow
    
    Experience:
    - 5 years at Tech Corp
    - Senior Developer at Startup Inc
    
    Education:
    BS in Computer Science
    University of Technology
    
    Certifications:
    - AWS Certified Solutions Architect
    - Certified Kubernetes Administrator
    """

@pytest.fixture
def sample_job_description():
    """Create a sample job description for testing."""
    return """
    Senior Software Engineer Position
    
    Required Skills:
    - Python
    - JavaScript
    - React
    - AWS
    - 5+ years experience
    
    Education:
    - BS in Computer Science or related field
    
    Certifications:
    - AWS certification preferred
    """

@pytest.fixture
def sample_pdf():
    """Create a sample PDF file for testing."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 750, "John Doe")
    p.drawString(100, 730, "Software Engineer")
    p.drawString(100, 710, "Skills: Python, JavaScript, React, Node.js")
    p.drawString(100, 690, "Experience: 5 years at Tech Corp")
    p.drawString(100, 670, "Education: BS Computer Science")
    p.drawString(100, 650, "Certifications: AWS Certified")
    p.save()
    buffer.seek(0)
    return buffer

def test_ai_analysis_success(sample_resume_text, sample_job_description):
    """Test successful AI analysis of resume."""
    # Extract data locally first
    local_data = extract_skills_and_experience(sample_resume_text)
    formatting_penalty = 0  # No formatting penalty for text input
    
    # Run AI analysis
    result = analyze_with_ai(sample_resume_text, sample_job_description, local_data, formatting_penalty)
    
    # Check result structure
    assert result is not None
    assert "data" in result
    assert "ats_score" in result
    assert "breakdown" in result
    assert "improvement_suggestions" in result
    
    # Check data fields
    data = result["data"]
    assert "skills" in data
    assert "total_experience_years" in data
    assert "relevant_experience" in data
    assert "education" in data
    assert "certifications" in data
    
    # Check specific content
    assert "Python" in data["skills"]
    assert "JavaScript" in data["skills"]
    assert "React" in data["skills"]
    assert "AWS" in data["skills"]
    assert data["total_experience_years"] == 5
    assert any("Computer Science" in edu for edu in data["education"])
    assert any("AWS" in cert for cert in data["certifications"])
    
    # Check breakdown
    breakdown = result["breakdown"]
    assert "skills" in breakdown
    assert "experience" in breakdown
    assert "education_certifications" in breakdown
    assert "formatting" in breakdown
    assert all(isinstance(v, (int, float)) for v in breakdown.values())
    
    # Check suggestions
    assert isinstance(result["improvement_suggestions"], list)
    assert len(result["improvement_suggestions"]) > 0

def test_ai_analysis_with_pdf(sample_pdf, sample_job_description):
    """Test AI analysis with PDF input."""
    # Extract text from PDF
    resume_text = extract_text_from_pdf(sample_pdf)
    assert resume_text is not None
    
    # Get formatting penalty
    formatting_penalty = check_formatting(sample_pdf)
    
    # Extract local data
    local_data = extract_skills_and_experience(resume_text)
    
    # Run AI analysis
    result = analyze_with_ai(resume_text, sample_job_description, local_data, formatting_penalty)
    
    # Check result
    assert result is not None
    assert "data" in result
    assert "ats_score" in result
    
    # Check specific content from PDF
    data = result["data"]
    assert "Python" in data["skills"]
    assert "JavaScript" in data["skills"]
    assert "React" in data["skills"]
    assert data["total_experience_years"] == 5
    assert any("Computer Science" in edu for edu in data["education"])
    assert any("AWS" in cert for cert in data["certifications"])

def test_ai_analysis_error_handling():
    """Test AI analysis error handling."""
    # Test with invalid input
    result = analyze_with_ai("", "", {}, 0)
    assert result is None

def test_ai_response_format(sample_resume_text, sample_job_description):
    """Test that AI response follows expected format."""
    local_data = extract_skills_and_experience(sample_resume_text)
    result = analyze_with_ai(sample_resume_text, sample_job_description, local_data, 0)
    
    # Check score format
    assert isinstance(result["ats_score"], str)
    assert "%" in result["ats_score"]
    score_value = float(result["ats_score"].replace("%", ""))
    assert 0 <= score_value <= 100
    
    # Check breakdown values
    breakdown = result["breakdown"]
    total_score = sum(breakdown.values())
    assert abs(total_score - score_value) < 1  # Allow for small floating point differences

if __name__ == "__main__":
    pytest.main(["-v"]) 