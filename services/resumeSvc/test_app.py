import pytest
import os
import io
from app import app
import PyPDF2
from reportlab.pdfgen import canvas

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def create_sample_pdf():
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

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert 'ai_client' in data

def test_parse_resume_no_file(client):
    """Test parsing resume with no file provided."""
    response = client.post('/resume/parse', data={
        'job_description': 'Software Engineer position'
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert data['error'] == 'No resume file provided'

def test_parse_resume_no_job_description(client):
    """Test parsing resume with no job description provided."""
    pdf_file = create_sample_pdf()
    response = client.post('/resume/parse', data={
        'resume': (pdf_file, 'test.pdf')
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert data['error'] == 'No job description provided'

def test_parse_resume_success(client):
    """Test successful resume parsing."""
    pdf_file = create_sample_pdf()
    job_description = """
    Software Engineer Position
    Required Skills: Python, JavaScript, React
    Experience: 3+ years
    Education: BS in Computer Science or related field
    """
    
    response = client.post('/resume/parse', data={
        'resume': (pdf_file, 'test.pdf'),
        'job_description': job_description
    })
    
    assert response.status_code == 200
    data = response.get_json()
    
    # Check response structure
    assert 'data' in data
    assert 'ats_score' in data
    assert 'breakdown' in data
    assert 'improvement_suggestions' in data
    
    # Check data fields
    assert 'skills' in data['data']
    assert 'total_experience_years' in data['data']
    assert 'relevant_experience' in data['data']
    assert 'education' in data['data']
    assert 'certifications' in data['data']
    
    # Check breakdown fields
    assert 'skills' in data['breakdown']
    assert 'experience' in data['breakdown']
    assert 'education_certifications' in data['breakdown']
    assert 'formatting' in data['breakdown']
    
    # Check that skills are extracted correctly
    assert 'Python' in data['data']['skills']
    assert 'JavaScript' in data['data']['skills']
    assert 'React' in data['data']['skills']
    
    # Check experience
    assert data['data']['total_experience_years'] == 5
    
    # Check education
    assert any('Computer Science' in edu for edu in data['data']['education'])
    
    # Check certifications
    assert any('AWS' in cert for cert in data['data']['certifications'])

def test_parse_resume_invalid_pdf(client):
    """Test parsing resume with an invalid PDF file."""
    # Create an invalid PDF file (just text)
    invalid_pdf = io.BytesIO(b"This is not a PDF file")
    
    response = client.post('/resume/parse', data={
        'resume': (invalid_pdf, 'invalid.pdf'),
        'job_description': 'Software Engineer position'
    })
    
    assert response.status_code == 500
    data = response.get_json()
    assert 'error' in data
    assert 'PDF extraction failed' in data['error']

if __name__ == '__main__':
    pytest.main(['-v']) 