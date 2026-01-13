import {afterEach} from 'vitest';
import chrome from 'sinon-chrome';
import '@testing-library/jest-dom';

// Mock Chrome APIs globally
global.chrome = chrome as any;

// Reset mocks between tests
afterEach(() => {
    chrome.reset();
});
