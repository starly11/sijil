import * as React from 'react';
import { render, screen } from '@/__tests__/utils/test-utils';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toHaveClass('custom-class');
  });
});
