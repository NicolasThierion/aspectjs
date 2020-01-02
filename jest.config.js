module.exports = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
    setupFiles: ['core-js'],
    setupFilesAfterEnv: ['jest-extended'],
};
