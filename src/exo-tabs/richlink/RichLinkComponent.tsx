import React, {useState, useEffect} from 'react';
import {HandlerRegistry} from '@exo/exo-tabs/richlink/handlers';
import {LinkFormat} from '@exo/exo-tabs/richlink/base';
import {CopyRichLinkAction} from '@exo/lib/actions/copy-rich-link.action';
import {CopyCounter} from '@exo/exo-tabs/richlink/copy-counter';
import {theme} from '@exo/theme/default';

export const RichLinkComponent: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formats, setFormats] = useState<LinkFormat[]>([]);
    const [copyCount, setCopyCount] = useState(0);
    const [currentUrl, setCurrentUrl] = useState<string>('');

    useEffect(() => {
        loadFormats();
        loadCopyCount();
    }, []);

    async function loadFormats() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.url) {
                throw new Error('No active tab URL');
            }

            // Check for chrome:// pages
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                throw new Error('Cannot copy links from chrome:// pages');
            }

            setCurrentUrl(tab.url);
            const formats = await HandlerRegistry.getAllFormats(tab.url);
            setFormats(formats);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load formats');
            setLoading(false);
        }
    }

    async function loadCopyCount() {
        const count = await CopyCounter.getCount();
        setCopyCount(count);
    }

    async function handleCopyFormat(formatIndex: number) {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab.id) {
                throw new Error('No active tab');
            }

            // Focus the tab first so the content script can write to clipboard
            await chrome.tabs.update(tab.id, {active: true});

            // Small delay to ensure focus has transferred
            await new Promise((resolve) => setTimeout(resolve, 100));

            await CopyRichLinkAction.sendToTab(tab.id, {
                url: currentUrl,
                formatIndex,
            });

            // Reload copy count
            await loadCopyCount();

            // Close the popup after successful copy
            window.close();
        } catch (err) {
            console.error('Failed to copy format:', err);
            setError(`Failed to copy: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }

    if (loading) {
        return <div style={{padding: '16px'}}>Loading formats...</div>;
    }

    if (error) {
        return <div style={{padding: '16px', color: 'red'}}>{error}</div>;
    }

    return (
        <div style={{padding: '16px', backgroundColor: theme.bg.page, minHeight: '100%'}}>
            <div style={{marginBottom: '12px', fontSize: '14px', color: theme.text.tertiary}}>
                Total copied: {copyCount}
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {formats.map((format, index) => {
                    // Detect fallback handlers (Page Title, Raw URL)
                    const isFallback = format.label === 'Page Title' || format.label === 'Raw URL';
                    const opacity = isFallback ? 0.75 : 1;
                    const backgroundColor = isFallback
                        ? theme.richlink.fallbackBg
                        : theme.richlink.specializedBg;

                    return (
                        <button
                            key={index}
                            onClick={() => handleCopyFormat(index)}
                            style={{
                                padding: '12px',
                                border: `1px solid ${theme.richlink.border}`,
                                borderRadius: '4px',
                                backgroundColor: backgroundColor,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                                opacity: opacity,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isFallback
                                    ? theme.richlink.fallbackHoverBg
                                    : theme.richlink.specializedHoverBg;
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = backgroundColor;
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 'bold',
                                    marginBottom: '4px',
                                    color: theme.text.white,
                                    fontSize: '14px',
                                }}
                            >
                                {format.label}
                            </div>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: theme.text.whiteTranslucent,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {format.text.length > 60
                                    ? format.text.substring(0, 60) + '...'
                                    : format.text}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
