import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Button } from '@/components/ui/button';

// Mock @/components/ui/button cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with label and children', () => {
    render(<Button label="Test">Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container.firstChild).toHaveClass('bg-blue-600');
  });

  it('renders with icon', () => {
    render(<Button icon={<span data-testid="test-icon">Icon</span>}>With Icon</Button>);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
