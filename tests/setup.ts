import {afterEach} from 'vitest';
import chrome from 'sinon-chrome';
import '@testing-library/jest-dom';

// Mock Chrome APIs globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.chrome = chrome as any;

// Reset mocks between tests
afterEach(() => {
    chrome.reset();
});
