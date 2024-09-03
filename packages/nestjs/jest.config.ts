import { JestConfigWithTsJest } from 'ts-jest';
import { createJestConfig } from '../../jest.config';

export default {
  ...createJestConfig({
    rootDir: __dirname,
  }),
  collectCoverageFrom: [`./**/*.{js,ts}`],
} satisfies JestConfigWithTsJest;
