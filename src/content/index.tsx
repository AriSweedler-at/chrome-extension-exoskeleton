import {initializeActionHandlers} from './action-handlers';
import {initializeGitHubAutoscroll} from './github-autoscroll-integration';

/**
 * Content script entry point
 */

// Initialize action handlers
initializeActionHandlers();

// Initialize GitHub autoscroll integration
initializeGitHubAutoscroll();

console.log('Chrome Extension Starter: Content script loaded');
