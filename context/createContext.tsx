import React, { createContext, useState, ReactNode } from 'react';

// Define the type for your context value
interface ContextType {
    isAuthEnabled: boolean;
    setIsAuthEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    handleSaveNote: (noteId: string | number | null, title: string, content: string, reminder: Date | null, router: any) => Promise<void>;
    notes: any;
    fetchNotes: any;
    setRefreshing: any;
    refreshing: boolean;
}

// Provide a default value with the correct type
const Context = createContext<ContextType | undefined>(undefined);

export default Context;
