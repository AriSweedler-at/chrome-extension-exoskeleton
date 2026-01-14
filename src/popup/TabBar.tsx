import {useState, useEffect} from 'react';
import {TabRegistry} from '../library/tabs/tab-registry';
import {Component} from '../library/components/base-component';
import {Storage} from '../library/storage';
import './TabBar.css';

export function TabBar() {
    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const [currentTabId, setCurrentTabId] = useState<number | null>(null);

    useEffect(() => {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            setCurrentUrl(tab.url || '');
            setCurrentTabId(tab.id || null);

            // Load last selected popup tab for this browser tab
            const storageKey = `selectedTab:${tab.id}`;
            const stored = await Storage.get<string>(storageKey);

            // Get visible tabs for this URL
            const visible = TabRegistry.getVisibleTabs(tab.url || '');

            // Use stored selection if valid, otherwise default to first visible
            const validStored = stored && visible.some((t) => t.id === stored);
            setSelectedTabId(validStored ? stored : visible[0]?.id || null);
        });
    }, []);

    const handleTabSelect = async (tabId: string) => {
        setSelectedTabId(tabId);
        if (currentTabId) {
            await Storage.set(`selectedTab:${currentTabId}`, tabId);
        }
    };

    const visibleTabs = TabRegistry.getVisibleTabs(currentUrl);
    const selectedTab = visibleTabs.find((t) => t.id === selectedTabId);

    return (
        <>
            <div className="tab-navigation">
                {visibleTabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={tab.id === selectedTabId ? 'active' : ''}
                        onClick={() => handleTabSelect(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="tab-content">
                {selectedTab && Component.renderInstance(selectedTab.component)}
            </div>
        </>
    );
}
