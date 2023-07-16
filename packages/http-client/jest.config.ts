import { JestConfigWithTsJest } from 'ts-jest';
import config from '../../jest.config';

export default {
  ...config,
  collectCoverageFrom: [`./**/*.{js,ts}`],
} satisfies JestConfigWithTsJest;
