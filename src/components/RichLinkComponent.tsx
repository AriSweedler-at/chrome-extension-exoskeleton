import React, {useState, useEffect} from 'react';
import {HandlerRegistry} from '../library/richlink/handlers';
import {LinkFormat} from '../library/richlink/base';
import {CopyRichLinkAction} from '../actions/copy-rich-link.action';
import {CopyCounter} from '../library/richlink/copy-counter';

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

            await CopyRichLinkAction.sendToTab(tab.id, {
                url: currentUrl,
                formatIndex,
            });

            // Reload copy count
            await loadCopyCount();
        } catch (err) {
            console.error('Failed to copy format:', err);
        }
    }

    if (loading) {
        return <div style={{padding: '16px'}}>Loading formats...</div>;
    }

    if (error) {
        return <div style={{padding: '16px', color: 'red'}}>{error}</div>;
    }

    return (
        <div style={{padding: '16px'}}>
            <div style={{marginBottom: '12px', fontSize: '14px', color: '#666'}}>
                Total copied: {copyCount}
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                {formats.map((format, index) => (
                    <button
                        key={index}
                        onClick={() => handleCopyFormat(index)}
                        style={{
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>{format.label}</div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#666',
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
                ))}
            </div>
        </div>
    );
};
