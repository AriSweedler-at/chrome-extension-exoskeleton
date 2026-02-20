import type {CSSProperties, ReactNode} from 'react';
import {theme} from '../theme/default';

export function Card({
    children,
    style,
}: {
    children: ReactNode;
    style?: CSSProperties;
}) {
    return (
        <div
            style={{
                padding: '10px',
                backgroundColor: theme.bg.card,
                borderRadius: '8px',
                border: `1px solid ${theme.border.subtle}`,
                boxShadow: theme.shadow.xs,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
