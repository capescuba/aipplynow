import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeUpload from '../ResumeUpload';

// Mock the session functions
jest.mock('../../libs/session', () => ({
  getSession: jest.fn(() => ({ user_id: 'test-user' })),
  setSession: jest.fn(),
}));

describe('ResumeUpload Component', () => {
  const mockOnUpload = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload button and input', () => {
    render(
      <ResumeUpload 
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/select resume/i)).toBeInTheDocument();
    expect(screen.getByTestId('resume-file-input')).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    render(
      <ResumeUpload 
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('resume-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  test('handles invalid file type', async () => {
    render(
      <ResumeUpload 
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('resume-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('PDF'));
    });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  test('handles file size limit', async () => {
    render(
      <ResumeUpload 
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('resume-file-input');

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('5MB'));
    });
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  test('shows loading state during upload', async () => {
    render(
      <ResumeUpload 
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('resume-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });
}); 