import { JestChromeNamespace } from 'jest-chrome';

declare module 'jest-chrome' {
  interface JestChromeNamespace {
    scripting: {
      executeScript: jest.Mock;
    };
  }
} 