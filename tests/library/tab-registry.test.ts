import {describe, it, expect, beforeEach} from 'vitest';
import React from 'react';
import {TabRegistry} from '../../src/library/tabs/tab-registry';
import {Component} from '../../src/library/components/base-component';

describe('TabRegistry', () => {
    beforeEach(() => {
        // Clear registry before each test
        TabRegistry['tabs'] = [];
    });

    describe('register', () => {
        it('should register a tab', () => {
            class TestComponent extends Component {
                render() {
                    return React.createElement('div', null, 'Test');
                }
            }

            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test',
                    component: TestComponent,
                    getPriority: () => 100,
                });
            }).not.toThrow();
        });

        it('should throw error for duplicate tab IDs', () => {
            class TestComponent extends Component {
                render() {
                    return React.createElement('div', null, 'Test');
                }
            }

            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: () => 100,
            });

            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test 2',
                    component: TestComponent,
                    getPriority: () => 100,
                });
            }).toThrow("Tab ID 'test' already registered");
        });
    });

    describe('getVisibleTabs', () => {
        class TestComponent extends Component {
            render() {
                return React.createElement('div', null, 'Test');
            }
        }

        it('should return tabs sorted by priority', () => {
            TabRegistry.register({
                id: 'tab1',
                label: 'Tab 1',
                component: TestComponent,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'tab2',
                label: 'Tab 2',
                component: TestComponent,
                getPriority: () => 0,
            });

            TabRegistry.register({
                id: 'tab3',
                label: 'Tab 3',
                component: TestComponent,
                getPriority: () => 50,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible).toHaveLength(3);
            expect(visible[0].id).toBe('tab2'); // Priority 0
            expect(visible[1].id).toBe('tab3'); // Priority 50
            expect(visible[2].id).toBe('tab1'); // Priority 100
        });

        it('should filter out tabs with MAX_SAFE_INTEGER priority', () => {
            TabRegistry.register({
                id: 'visible',
                label: 'Visible',
                component: TestComponent,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'hidden',
                label: 'Hidden',
                component: TestComponent,
                getPriority: () => Number.MAX_SAFE_INTEGER,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible).toHaveLength(1);
            expect(visible[0].id).toBe('visible');
        });

        it('should pass URL to getPriority function', () => {
            const testUrl = 'https://airtable.com/test';
            let receivedUrl = '';

            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: (url: string) => {
                    receivedUrl = url;
                    return 100;
                },
            });

            TabRegistry.getVisibleTabs(testUrl);

            expect(receivedUrl).toBe(testUrl);
        });

        it('should include priority in returned tabs', () => {
            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                getPriority: () => 42,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible[0].priority).toBe(42);
        });
    });
});
