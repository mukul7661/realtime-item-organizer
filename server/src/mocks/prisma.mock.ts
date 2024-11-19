export const mockPrisma = {
  item: {
    findMany: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
  folder: {
    findMany: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};
