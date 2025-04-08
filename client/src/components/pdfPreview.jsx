import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import axios from 'axios';
import PDFViewer from './pdfViewer';
import ResumeParser from './resumeParser';
import { tintPdfBackground } from '../libs/pdfUtils';

function PDFPreview({ setFile, initialFile, resumeId, onSaveSuccess }) {
  const [file, setLocalFile] = useState(null); // Tinted PDF
  const [originalFile, setOriginalFile] = useState(initialFile); // Original PDF
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [url, setUrl] = useState('');
  const [scoreData, setScoreData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState(resumeId);

  useEffect(() => {
    setOriginalFile(initialFile);
    setCurrentResumeId(resumeId);
    setScoreData(null);
    setUploadStatus(null);
    setCurrentPage(1);

    if (initialFile) {
      tintPdfBackground(initialFile).then((tintedFile) => {
        setLocalFile(tintedFile);
      });
    } else {
      setLocalFile(null);
    }
  }, [initialFile, resumeId]);

  useEffect(() => {
    const handleSetJobUrl = (event) => {
      setUrl(event.detail.url);
    };
    window.addEventListener('setJobUrl', handleSetJobUrl);
    return () => window.removeEventListener('setJobUrl', handleSetJobUrl);
  }, []);

  const previewPDF = (pdfFile) => {
    setOriginalFile(pdfFile);
    tintPdfBackground(pdfFile).then((tintedFile) => {
      setLocalFile(tintedFile);
      setNumPages(null);
    });
  };

  const handleSave = async () => {
    if (!originalFile) {
      setUploadStatus('No file selected to save.');
      return;
    }

    setSaving(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('resume', originalFile);

    try {
      const response = await axios.post('/api/users/me/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      const resumeId = response.data.resume_id;
      setCurrentResumeId(resumeId);
      setUploadStatus(`Resume saved successfully! (Resume ID: ${resumeId})`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus(`Save failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleParse = async () => {
    if (!currentResumeId) {
      setUploadStatus('Please save the resume before parsing.');
      return;
    }
    if (!jobDesc.trim()) {
      setUploadStatus('Please enter a job description.');
      return;
    }

    setLoading(true);
    setUploadStatus(null);
    setScoreData(null);

    try {
      const response = await axios.post(`/api/users/me/resumes/${currentResumeId}/parse`, { job_desc: jobDesc }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const atsScore = response.data.data.ats_score;
      const scoreBreakdown = response.data.data.breakdown;
      const suggestions = response.data.data.improvement_suggestions;
      const resumeData = response.data.data;

      setUploadStatus(`Parse successful! ATS Score: ${atsScore} (Resume ID: ${currentResumeId})`);
      setScoreData({ breakdown: scoreBreakdown, suggestions, data: resumeData });
    } catch (error) {
      console.error('Parse error:', error);
      setUploadStatus(`Parse failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
      <PDFViewer
        file={file}
        numPages={numPages}
        setNumPages={setNumPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        saving={saving}
        onSave={handleSave}
        setUploadStatus={setUploadStatus}
        originalFile={originalFile}
        currentResumeId={currentResumeId}
      />
      <ResumeParser
        file={file}
        url={url}
        jobDesc={jobDesc}
        setJobDesc={setJobDesc}
        loading={loading}
        currentResumeId={currentResumeId}
        uploadStatus={uploadStatus}
        scoreData={scoreData}
        onParse={handleParse}
      />
    </Container>
  );
}

export default PDFPreview;