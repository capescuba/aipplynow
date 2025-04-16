import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeList from '../ResumeList';

// Mock the session functions
jest.mock('../../libs/session', () => ({
  getSession: jest.fn(() => ({ user_id: 'test-user' })),
  setSession: jest.fn(),
}));

describe('ResumeList Component', () => {
  const mockResumes = [
    {
      resume_id: '1',
      name: 'Test Resume 1',
      description: 'Test Description 1',
      file: null,
      created_at: '2024-04-16T00:00:00Z'
    },
    {
      resume_id: '2',
      name: 'Test Resume 2',
      description: 'Test Description 2',
      file: null,
      created_at: '2024-04-15T00:00:00Z'
    }
  ];

  const mockOnDelete = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders list of resumes', () => {
    render(
      <ResumeList 
        resumes={mockResumes}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Resume 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('Test Resume 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description 2')).toBeInTheDocument();
  });

  test('handles resume selection', () => {
    render(
      <ResumeList 
        resumes={mockResumes}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const firstResume = screen.getByText('Test Resume 1').closest('.MuiCard-root');
    fireEvent.click(firstResume);

    expect(mockOnSelect).toHaveBeenCalledWith(mockResumes[0]);
  });

  test('handles resume deletion', async () => {
    render(
      <ResumeList 
        resumes={mockResumes}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    await waitFor(() => {
      fireEvent.click(deleteButtons[0]);
    });

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await waitFor(() => {
      fireEvent.click(confirmButton);
    });

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('displays metadata panel for new resume', () => {
    const newResume = {
      resume_id: 'new',
      name: '',
      description: '',
      file: new File([''], 'test.pdf', { type: 'application/pdf' })
    };

    render(
      <ResumeList 
        resumes={[newResume]}
        selectedResume={newResume}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    // Check for form fields
    const nameInput = screen.getByRole('textbox', { name: /name/i });
    const descriptionInput = screen.getByRole('textbox', { name: /description/i });
    
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toBeDisabled();
    expect(descriptionInput).toBeInTheDocument();
    expect(descriptionInput).toBeDisabled();
    expect(screen.getByPlaceholderText('Add a description (optional)')).toBeInTheDocument();
  });
}); 