const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { parse } = require('path');

// Flask server URL (replace with your actual URL if different)
const FLASK_URL = 'http://localhost:5000/resume/parse';

// Path to your resume PDF file
//const RESUME_PATH = './resume.pdf';
// Job description text
//const JOB_DESCRIPTION = 'Looking for a skilled developer with Python and Node.js experience.';

async function parseResume(resumeBuffer, jobDescription) {
  try {
    // Create a FormData instance
    const formData = new FormData();

    // Read the PDF file as a buffer and append it to the form
    //const resumeBuffer = fs.readFileSync(RESUME_PATH);
    formData.append('resume', resumeBuffer, {
      filename: 'resume.pdf',
      contentType: 'application/pdf'
    });

    // Append the job description as a text field
    formData.append('job_description', jobDescription);

    // Send the POST request to the Flask endpoint
    const response = await axios.post(FLASK_URL, formData, {
      headers: {
        ...formData.getHeaders() // Automatically sets Content-Type: multipart/form-data
      }
    });

    // Log the response structure
    console.log('Python service response:', JSON.stringify(response.data, null, 2));

    // Handle the response
    return response.data;

  } catch (error) {
    console.error('Error in parseResume:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
}

module.exports = {
    parseResume,       
  };