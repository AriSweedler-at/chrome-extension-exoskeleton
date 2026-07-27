import {describe, it, expect, beforeEach, vi} from 'vitest';
import {TabRegistry} from '@exo/lib/popup-exo-tabs/tab-registry';
import {ShowToastAction} from '@exo/lib/actions/show-toast.action';
import {NotificationType} from '@exo/lib/toast-notification';

const TestComponent = () => <div>Test</div>;

describe('TabRegistry', () => {
    beforeEach(() => {
        TabRegistry.clearForTesting();
    });

    describe('register', () => {
        it('should register a tab', () => {
            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test',
                    component: TestComponent,
                    primaryAction: async () => false,
                    getPriority: () => 100,
                });
            }).not.toThrow();
        });

        it('should throw error for duplicate tab IDs', () => {
            TabRegistry.register({
                id: 'test',
                label: 'Test',
                component: TestComponent,
                primaryAction: async () => false,
                getPriority: () => 100,
            });

            expect(() => {
                TabRegistry.register({
                    id: 'test',
                    label: 'Test 2',
                    component: TestComponent,
                    primaryAction: async () => false,
                    getPriority: () => 100,
                });
            }).toThrow("Tab ID 'test' already registered");
        });
    });

    describe('getVisibleTabs', () => {
        it('should return tabs sorted by priority', () => {
            TabRegistry.register({
                id: 'tab1',
                label: 'Tab 1',
                component: TestComponent,
                primaryAction: async () => false,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'tab2',
                label: 'Tab 2',
                component: TestComponent,
                primaryAction: async () => false,
                getPriority: () => 0,
            });

            TabRegistry.register({
                id: 'tab3',
                label: 'Tab 3',
                component: TestComponent,
                primaryAction: async () => false,
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
                primaryAction: async () => false,
                getPriority: () => 100,
            });

            TabRegistry.register({
                id: 'hidden',
                label: 'Hidden',
                component: TestComponent,
                primaryAction: async () => false,
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
                primaryAction: async () => false,
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
                primaryAction: async () => false,
                getPriority: () => 42,
            });

            const visible = TabRegistry.getVisibleTabs('http://example.com');

            expect(visible[0].priority).toBe(42);
        });
    });

    describe('dispatchPrimaryAction', () => {
        const registerTab = (
            label: string,
            priority: number,
            primaryAction: (tabId: number, url: string) => Promise<boolean>,
        ) => {
            TabRegistry.register({
                id: label.toLowerCase(),
                label,
                component: TestComponent,
                primaryAction,
                getPriority: () => priority,
            });
        };

        const mockShowToast = () =>
            vi.spyOn(ShowToastAction, 'sendToTab').mockResolvedValue(undefined);

        it('stops at the first tab (by priority) whose primaryAction handles it', async () => {
            const showToast = mockShowToast();
            const lowPriority = vi.fn().mockResolvedValue(true);
            const highPriority = vi.fn().mockResolvedValue(true);
            registerTab('LowPriority', 100, lowPriority);
            registerTab('HighPriority', 0, highPriority);

            await TabRegistry.dispatchPrimaryAction(7, 'http://example.com');

            expect(highPriority).toHaveBeenCalledWith(7, 'http://example.com');
            expect(lowPriority).not.toHaveBeenCalled();
            expect(showToast).not.toHaveBeenCalled();
        });

        it('falls through to the next tab when primaryAction returns false', async () => {
            const showToast = mockShowToast();
            const first = vi.fn().mockResolvedValue(false);
            const second = vi.fn().mockResolvedValue(true);
            registerTab('First', 0, first);
            registerTab('Second', 50, second);

            await TabRegistry.dispatchPrimaryAction(7, 'http://example.com');

            expect(first).toHaveBeenCalledWith(7, 'http://example.com');
            expect(second).toHaveBeenCalledWith(7, 'http://example.com');
            expect(showToast).not.toHaveBeenCalled();
        });

        it('continues past a throwing primaryAction and logs the error', async () => {
            const showToast = mockShowToast();
            const first = vi.fn().mockRejectedValue(new Error('boom'));
            const second = vi.fn().mockResolvedValue(true);
            registerTab('First', 0, first);
            registerTab('Second', 50, second);

            await TabRegistry.dispatchPrimaryAction(7, 'http://example.com');

            expect(second).toHaveBeenCalledWith(7, 'http://example.com');
            expect(console.error).toHaveBeenCalledWith(
                'Primary action failed for tab "First":',
                expect.any(Error),
            );
            expect(showToast).not.toHaveBeenCalled();
        });

        it('shows an error toast listing tried tabs in priority order when none handle it', async () => {
            const showToast = mockShowToast();
            registerTab('Second', 50, vi.fn().mockResolvedValue(false));
            registerTab('First', 0, vi.fn().mockResolvedValue(false));

            await TabRegistry.dispatchPrimaryAction(7, 'http://example.com');

            expect(showToast).toHaveBeenCalledWith(7, {
                message: 'No primary action available',
                type: NotificationType.Error,
                detail: 'Tried: First, Second',
            });
        });

        it('shows a no-tabs-matched toast when no tabs are visible', async () => {
            const showToast = mockShowToast();
            registerTab('Hidden', Number.MAX_SAFE_INTEGER, vi.fn().mockResolvedValue(true));

            await TabRegistry.dispatchPrimaryAction(7, 'http://example.com');

            expect(showToast).toHaveBeenCalledWith(7, {
                message: 'No primary action available',
                type: NotificationType.Error,
                detail: 'No tabs matched this page',
            });
        });
    });

    describe('enablementToggle', () => {
        it('supports enablementToggle field in registration', () => {
            const TestComponent = () => <div>Test</div>;

            TabRegistry.register({
                id: 'test-with-enablement',
                label: 'Test',
                component: TestComponent,
                primaryAction: async () => false,
                getPriority: () => 0,
                enablementToggle: true,
            });

            const tabs = TabRegistry.getVisibleTabs('http://example.com');
            expect(tabs[0].enablementToggle).toBe(true);
        });
    });
});
