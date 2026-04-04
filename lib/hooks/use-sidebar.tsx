'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const SIDEBAR_STORAGE_KEY = 'qmath.sidebarExpanded';
const sidebarPreferenceListeners = new Set<() => void>();

function subscribeToSidebarPreference(listener: () => void) {
    sidebarPreferenceListeners.add(listener);

    const handleStorage = (event: StorageEvent) => {
        if (event.key === SIDEBAR_STORAGE_KEY) {
            listener();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        sidebarPreferenceListeners.delete(listener);
        window.removeEventListener('storage', handleStorage);
    };
}

function readSidebarPreference(defaultExpanded: boolean) {
    if (typeof window === 'undefined') {
        return defaultExpanded;
    }

    const savedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (savedValue === 'true' || savedValue === 'false') {
        return savedValue === 'true';
    }

    return defaultExpanded;
}

function writeSidebarPreference(expanded: boolean) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(expanded));
    sidebarPreferenceListeners.forEach((listener) => listener());
}

interface SidebarContextValue {
    isSidebarExpanded: boolean;
    setIsSidebarExpanded: (expanded: boolean) => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    
    // Default expanded if in dashboard or articles, etc.
    const defaultExpanded = pathname === '/dashboard' || 
                           pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/articles') ||
                           pathname.startsWith('/courses');

    const isSidebarExpanded = useSyncExternalStore(
        subscribeToSidebarPreference,
        () => readSidebarPreference(defaultExpanded),
        () => defaultExpanded
    );

    const setIsSidebarExpanded = useCallback((expanded: boolean) => {
        writeSidebarPreference(expanded);
    }, []);

    const toggleSidebar = useCallback(() => {
        writeSidebarPreference(!isSidebarExpanded);
    }, [isSidebarExpanded]);

    const value = useMemo<SidebarContextValue>(() => ({
        isSidebarExpanded,
        setIsSidebarExpanded,
        toggleSidebar,
    }), [isSidebarExpanded, setIsSidebarExpanded, toggleSidebar]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);

    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider.');
    }

    return context;
}
