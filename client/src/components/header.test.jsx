import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Header from './header';

test('renders My App title', () => {
    const { getByText } = render(<Header />);
    expect(getByText('My App')).toBeInTheDocument();
});

test('renders home icon button', () => {
    const { getByLabelText } = render(<Header />);
    expect(getByLabelText('home')).toBeInTheDocument();
});

test('renders notifications icon button', () => {
    const { getByLabelText } = render(<Header />);
    expect(getByLabelText('notifications')).toBeInTheDocument();
});

test('renders settings icon button', () => {
    const { getByLabelText } = render(<Header />);
    expect(getByLabelText('settings')).toBeInTheDocument();
});

test('renders profile avatar', () => {
    const { getByAltText } = render(<Header />);
    expect(getByAltText('Profile Picture')).toBeInTheDocument();
});