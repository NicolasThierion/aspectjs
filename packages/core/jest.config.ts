import { join } from 'path';
import { JestConfigWithTsJest } from 'ts-jest';
import config from '../../jest.config';

export default {
  ...config,
  coverageDirectory: join(__dirname, 'dist', 'coverage'),
  collectCoverageFrom: ['./**/*.{js,ts}'],
} satisfies JestConfigWithTsJest;
