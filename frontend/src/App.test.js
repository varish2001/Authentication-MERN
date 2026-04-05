import { render, screen } from '@testing-library/react';
import App from './App';

test('renders auth starter heading', () => {
  render(<App />);
  expect(screen.getByText(/clean login and signup experience/i)).toBeInTheDocument();
});
