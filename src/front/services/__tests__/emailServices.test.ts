import { emailServices } from '../emailServices';
import { normalizeUrl } from '../../utils/urlHelper';

// Mock fetch
global.fetch = jest.fn();

const mockUrl = 'http://localhost:3001';

describe('emailServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('sendResetEmail', () => {
    it('should successfully send reset email', async () => {
      const mockResponse = {
        success: true,
        message: 'Email sent successfully',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await emailServices.sendResetEmail('test@example.com');

      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/check_mail'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return false on failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
      });

      const result = await emailServices.sendResetEmail('invalid@example.com');

      expect(result).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should successfully check auth token', async () => {
      const mockToken = 'mock-token';
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await emailServices.checkAuth(mockToken);

      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/token'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return false on invalid token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
      });

      const result = await emailServices.checkAuth('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      const mockToken = 'mock-token';
      const mockResponse = {
        success: true,
        message: 'Password updated',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await emailServices.updatePassword('NewPassword123!', mockToken);

      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/password_update'),
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ password: 'NewPassword123!' }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return false on failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
      });

      const result = await emailServices.updatePassword('weak', 'token');

      expect(result).toBe(false);
    });
  });
});

