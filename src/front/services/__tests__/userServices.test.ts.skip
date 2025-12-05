import { userServices } from '../userServices';
import { normalizeUrl } from '../../utils/urlHelper';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

const mockUrl = 'http://localhost:3001';

describe('userServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: 'true',
        token: 'mock-token',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userServices.login({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/login'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'TestPassword123!',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return false on login failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
      });

      const result = await userServices.login({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result).toBe(false);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockResponse = {
        success: true,
        token: 'mock-token',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponse,
      });

      const result = await userServices.register({
        email: 'newuser@example.com',
        password: 'NewPassword123!',
      });

      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'NewPassword123!',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should return false on registration failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
      });

      const result = await userServices.register({
        email: 'existing@example.com',
        password: 'Password123!',
      });

      expect(result).toBe(false);
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info with token from localStorage', async () => {
      const mockToken = 'mock-token';
      const mockUser = { id: 1, email: 'test@example.com' };

      localStorageMock.getItem.mockReturnValue(mockToken);
      (fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => ({ user: mockUser }),
      });

      const result = await userServices.getUserInfo();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(fetch).toHaveBeenCalledWith(
        normalizeUrl(mockUrl, '/api/private'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );

      expect(result).toEqual(mockUser);
    });

    it('should return false when no token is available', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await userServices.getUserInfo();

      expect(result).toBe(false);
    });
  });
});

