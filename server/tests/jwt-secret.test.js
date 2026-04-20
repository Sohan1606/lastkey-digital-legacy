/**
 * JWT Secret Validation Tests
 * 
 * Ensures server fails cleanly when JWT_SECRET is missing
 */

describe('JWT Secret Validation', () => {
  const originalEnv = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalEnv;
    jest.resetModules();
  });

  it('should throw error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => {
      jest.isolateModules(() => {
        require('../middleware/auth');
      });
    }).toThrow('JWT_SECRET environment variable is required');
  });

  it('should load successfully when JWT_SECRET is present', () => {
    process.env.JWT_SECRET = 'test-secret-minimum-32-characters-long';

    expect(() => {
      jest.isolateModules(() => {
        require('../middleware/auth');
      });
    }).not.toThrow();
  });
});
