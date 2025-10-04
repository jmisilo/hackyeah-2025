/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';

import { Button } from './';

jest.mock('next/link', () => ({
  __esModule: true,
  default: jest.fn(({ children, ...props }) => <a {...props}>{children}</a>),
}));

describe('Button component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders a <button> when no href is provided', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByTestId('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveTextContent('Click me');
  });

  it('renders an <a> when href is provided and as is not "link"', () => {
    render(<Button href="https://example.com">Go to Example</Button>);
    const anchor = screen.getByTestId('a');
    expect(anchor.tagName).toBe('A');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveTextContent('Go to Example');
  });

  it('renders a <Link> (mocked as <a>) when href is provided and as is "link"', () => {
    render(
      <Button href="/internal" as="link">
        Internal Link
      </Button>,
    );
    const link = screen.getByTestId('link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/internal');
    expect(link).toHaveTextContent('Internal Link');
  });

  it('throws an error if href is not a string or undefined', () => {
    // @ts-expect-error Testing invalid prop type
    expect(() => render(<Button href={123}>Invalid</Button>)).toThrow(
      'Invalid href attribute. It should be a string or undefined.',
    );
  });
});
