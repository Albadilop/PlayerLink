import { normalizeUrl } from '../urlHelper';

describe('normalizeUrl', () => {
  it('should combine base URL and path correctly', () => {
    expect(normalizeUrl('http://localhost:3001', '/api/users')).toBe(
      'http://localhost:3001/api/users'
    );
  });

  it('should handle base URL with trailing slash', () => {
    expect(normalizeUrl('http://localhost:3001/', '/api/users')).toBe(
      'http://localhost:3001/api/users'
    );
  });

  it('should handle path without leading slash', () => {
    expect(normalizeUrl('http://localhost:3001', 'api/users')).toBe(
      'http://localhost:3001/api/users'
    );
  });

  it('should handle both base and path with slashes', () => {
    expect(normalizeUrl('http://localhost:3001/', '/api/users')).toBe(
      'http://localhost:3001/api/users'
    );
  });

  it('should handle empty path', () => {
    expect(normalizeUrl('http://localhost:3001', '')).toBe(
      'http://localhost:3001'
    );
  });

  it('should handle path with query parameters', () => {
    expect(normalizeUrl('http://localhost:3001', '/api/users?page=1')).toBe(
      'http://localhost:3001/api/users?page=1'
    );
  });
});
