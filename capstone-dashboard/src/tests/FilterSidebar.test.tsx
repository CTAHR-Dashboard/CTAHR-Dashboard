import { render, screen } from '@testing-library/react';
import FilterSidebar from '../components/dashboard/FilterSidebar';

describe('FilterSidebar', () => {
  it('renders the logo', () => {
    render(<FilterSidebar />);
    expect(screen.getByAltText(/oleson lab/i)).toBeInTheDocument();
  });

  it('renders the main title', () => {
    render(<FilterSidebar />);
    expect(screen.getByText(/hawaiʻi/i)).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<FilterSidebar />);
    expect(screen.getByText(/ecosystem accounts/i)).toBeInTheDocument();
  });

  it('renders the fisheries navigation item', () => {
    render(<FilterSidebar />);
    expect(screen.getByText(/fisheries/i)).toBeInTheDocument();
  });
});