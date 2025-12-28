'use client';

import React from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import PropertyPanel from './PropertyPanel';

export default function RightSidebar() {
    const { selectedObjectId, objects, updateObject, selectObject, removeObject, fabricCanvas } = useCanvasStore();
    const selectedObject = objects.find(o => o.id === selectedObjectId);

    if (!selectedObject) {
        return null;
    }

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-xl z-20 font-sans transition-colors duration-200 p-4 animate-in slide-in-from-right-10 duration-200">
            <PropertyPanel
                object={selectedObject}
                updateObject={updateObject}
                onClose={() => {
                    selectObject(null);
                    fabricCanvas?.discardActiveObject();
                    fabricCanvas?.requestRenderAll();
                }}
                onDelete={() => {
                    removeObject(selectedObject.id);
                    fabricCanvas?.discardActiveObject();
                    fabricCanvas?.requestRenderAll();
                }}
            />
        </div>
    );
}
