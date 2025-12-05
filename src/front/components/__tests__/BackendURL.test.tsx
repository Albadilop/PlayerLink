import { render, screen } from '../../test-utils';
import { BackendURL } from '../BackendURL';

describe('BackendURL', () => {
  it('should render the component', () => {
    render(<BackendURL />);
    expect(screen.getByText(/Missing BACKEND_URL env variable/i)).toBeInTheDocument();
  });

  it('should display instructions', () => {
    render(<BackendURL />);
    expect(screen.getByText(/Make sure you backend is running on port 3001/i)).toBeInTheDocument();
  });
});


