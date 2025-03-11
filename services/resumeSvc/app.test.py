import unittest
from flask import Flask
from app import app
import io
import logging

# Configure logging for visibility
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestResumeSvc(unittest.TestCase):
    def setUp(self):
        """Set up the Flask test client."""
        self.app = app.test_client()
        self.app.testing = True
        # Sample PDF content (mocked as bytes)
        self.valid_pdf = io.BytesIO(
            b"%PDF-1.4\n"
            b"1 0 obj\n"
            b"<< /Type /Catalog /Pages 2 0 R >>\n"
            b"endobj\n"
            b"2 0 obj\n"
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
            b"endobj\n"
            b"3 0 obj\n"
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\n"
            b"endobj\n"
            b"4 0 obj\n"
            b"<< /Length 44 >>\n"
            b"stream\n"
            b"BT /F1 12 Tf 100 700 Td (Test Resume Content) Tj ET\n"
            b"endstream\n"
            b"endobj\n"
            b"xref\n"
            b"0 5\n"
            b"0000000000 65535 f \n"
            b"0000000010 00000 n \n"
            b"0000000079 00000 n \n"
            b"0000000178 00000 n \n"
            b"0000000277 00000 n \n"
            b"trailer\n"
            b"<< /Size 5 /Root 1 0 R >>\n"
            b"startxref\n"
            b"321\n"
            b"%%EOF\n"
        )
        self.valid_job_desc = "Software Engineer role requiring Python, AWS, and 5+ years experience."

    def test_parse_success_ai_mode(self):
        """Test successful resume parsing in AI mode."""
        # Assuming USE_AI = 1 in app.py
        response = self.app.post(
            '/resume/parse',
            content_type='multipart/form-data',
            data={
                'resume': (self.valid_pdf, 'resume.pdf'),
                'job_desc': self.valid_job_desc
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('ats_score', data)
        self.assertIn('improvement_suggestions', data)
        logger.info(f"AI mode response: {data}")

    def test_missing_resume(self):
        """Test error when resume file is missing."""
        response = self.app.post(
            '/resume/parse',
            content_type='multipart/form-data',
            data={'job_desc': self.valid_job_desc}
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Missing resume PDF or job description')

    def test_missing_job_desc(self):
        """Test error when job description is missing."""
        response = self.app.post(
            '/resume/parse',
            content_type='multipart/form-data',
            data={'resume': (self.valid_pdf, 'resume.pdf')}
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
        self.assertEqual(data['error'], 'Missing resume PDF or job description')

    def test_invalid_pdf(self):
        """Test error with invalid PDF content."""
        invalid_pdf = io.BytesIO(b"Not a PDF")
        response = self.app.post(
            '/resume/parse',
            content_type='multipart/form-data',
            data={
                'resume': (invalid_pdf, 'invalid.pdf'),
                'job_desc': self.valid_job_desc
            }
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
        self.assertTrue('PDF extraction failed' in data['error'])

if __name__ == '__main__':
    unittest.main()