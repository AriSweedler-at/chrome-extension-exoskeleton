import React, {useState, useEffect, useRef, useLayoutEffect} from 'react';
import {LinkFormat} from '@exo/exo-tabs/richlink/base';
import {CopyRichLinkAction, GetFormatsAction} from '@exo/exo-tabs/richlink/action';
import {CopyCounter} from '@exo/exo-tabs/richlink/copy-counter';
import {theme} from '@exo/theme/default';

// Inject scroll keyframes once, matching the toast notification pattern
let scrollKeyframesInjected = false;
function injectScrollKeyframes() {
    if (scrollKeyframesInjected) return;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes exo-scroll-text {
            0%, 15% { transform: translateX(0); }
            85%, 100% { transform: translateX(var(--scroll-dist)); }
        }
    `;
    document.head.appendChild(style);
    scrollKeyframesInjected = true;
}

function FormatButton({
    format,
    index,
    onCopy,
}: {
    format: LinkFormat;
    index: number;
    onCopy: (i: number) => void;
}) {
    const textContainerRef = useRef<HTMLDivElement>(null); // eslint-disable-line no-undef
    const [hovering, setHovering] = useState(false);
    const [paused, setPaused] = useState(false);
    const [overflow, setOverflow] = useState(0);

    const isFallback = format.label === 'Page Title' || format.label === 'Raw URL';
    const opacity = isFallback ? 0.75 : 1;
    const backgroundColor = isFallback ? theme.richlink.fallbackBg : theme.richlink.specializedBg;
    const hoverBg = isFallback ? theme.richlink.fallbackHoverBg : theme.richlink.specializedHoverBg;

    const needsScroll = overflow > 0;
    // ~30px/sec scroll speed, min 2s so short overflows don't feel jarring
    const scrollDuration = Math.max(2, overflow / 30);

    useEffect(() => {
        injectScrollKeyframes();
    }, []);

    useLayoutEffect(() => {
        if (textContainerRef.current) {
            setOverflow(
                Math.max(
                    0,
                    textContainerRef.current.scrollWidth - textContainerRef.current.clientWidth,
                ),
            );
        }
    }, [format.text]);

    return (
        <button
            onClick={() => onCopy(index)}
            onMouseEnter={(e) => {
                setHovering(true);
                setPaused(false);
                e.currentTarget.style.backgroundColor = hoverBg;
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                setHovering(false);
                setPaused(false);
                e.currentTarget.style.backgroundColor = backgroundColor;
                e.currentTarget.style.transform = 'translateY(0)';
            }}
            onContextMenu={(e) => {
                if (!needsScroll || !hovering) return;
                e.preventDefault();
                setPaused((p) => !p);
            }}
            style={{
                padding: '12px',
                border: `1px solid ${theme.richlink.border}`,
                borderRadius: '4px',
                backgroundColor,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                opacity,
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
                ref={textContainerRef}
                style={{
                    fontSize: '11px',
                    color: theme.text.whiteTranslucent,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: hovering ? 'clip' : 'ellipsis',
                }}
            >
                <span
                    style={
                        hovering && needsScroll
                            ? ({
                                  display: 'inline-block',
                                  '--scroll-dist': `-${overflow}px`,
                                  animation: `exo-scroll-text ${scrollDuration}s linear infinite alternate`,
                                  animationPlayState: paused ? 'paused' : 'running',
                              } as React.CSSProperties)
                            : {display: 'inline'}
                    }
                >
                    {format.text}
                </span>
            </div>
        </button>
    );
}

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
            const formats = await GetFormatsAction.sendToTab<{url: string}, LinkFormat[]>(tab.id!, {
                url: tab.url,
            });
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
                {formats.map((format, index) => (
                    <FormatButton
                        key={index}
                        format={format}
                        index={index}
                        onCopy={handleCopyFormat}
                    />
                ))}
            </div>
        </div>
    );
};
