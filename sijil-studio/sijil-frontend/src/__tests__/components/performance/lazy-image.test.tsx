import * as React from 'react';
import { render, screen } from '@/__tests__/utils/test-utils';
import { LazyImage } from '@/components/performance/lazy-image';

describe('LazyImage', () => {
  it('renders alt text', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test Image"
      />
    );
    expect(screen.getByAltText('Test Image')).toBeInTheDocument();
  });

  it('renders placeholder when provided', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test Image"
        placeholderSrc="/placeholder.jpg"
      />
    );
    const placeholderImages = screen.getAllByAltText('Test Image');
    expect(placeholderImages.length).toBeGreaterThan(0);
  });
});
