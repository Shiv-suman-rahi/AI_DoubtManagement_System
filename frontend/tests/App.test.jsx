import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge, PriorityBadge } from '../src/components/common/Badge.jsx';
import App from '../src/App.jsx';

describe('Frontend Component & Routing Suite', () => {
  it('Renders status badges accurately according to academic workflow states', () => {
    const { rerender } = render(<StatusBadge status="answered" />);
    expect(screen.getByText('Answered')).toBeInTheDocument();

    rerender(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(<StatusBadge status="under_review" />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('Renders priority badges with expected labels', () => {
    const { rerender } = render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText('URGENT')).toBeInTheDocument();

    rerender(<PriorityBadge priority="normal" />);
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
  });

  it('Renders Login Portal by default for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByText(/AIDMS Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/One-Click Demo Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });
});
