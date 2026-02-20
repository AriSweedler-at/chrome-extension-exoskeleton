import {useState, useEffect} from 'react';
import {Storage} from '@exo/lib/storage';

export function useTabEnablement(tabId: string) {
    const [enabled, setEnabled] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadEnabled = async () => {
            const value = await Storage.get<boolean>(`exorun-${tabId}`);
            setEnabled(value === undefined ? true : value);
            setLoading(false);
        };
        loadEnabled();
    }, [tabId]);

    const updateEnabled = async (newValue: boolean) => {
        await Storage.set(`exorun-${tabId}`, newValue);
        setEnabled(newValue);
    };

    return {enabled, loading, setEnabled: updateEnabled};
}
