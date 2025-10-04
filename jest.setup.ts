import '@testing-library/jest-dom';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('./src/infrastructure/logger.ts', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));
