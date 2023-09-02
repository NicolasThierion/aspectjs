import { JestConfigWithTsJest } from 'ts-jest';
import config from '../../jest.config';
import { join } from 'path';

export default {
  ...config,
  coverageDirectory: join(__dirname, 'dist', 'coverage'),
  collectCoverageFrom: [`./**/*.{js,ts}`],
} satisfies JestConfigWithTsJest;
