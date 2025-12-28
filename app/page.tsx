'use client';

import Sidebar from '@/components/editor/Sidebar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import PropertyPanel from '@/components/editor/PropertyPanel';
import { useCanvasStore } from '@/store/canvas-store';

export default function Home() {
    const { objects, selectedObjectId, updateObject, removeObject, selectObject } = useCanvasStore();
    const selectedObject = objects.find(o => o.id === selectedObjectId);

    return (
        <main className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-black">
            <Sidebar />
            <div className="flex-1 relative flex flex-col h-full">
                <FabricCanvas />
            </div>
            {selectedObject && (
                <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full shadow-xl z-20">
                    <PropertyPanel
                        object={selectedObject}
                        updateObject={updateObject}
                        onClose={() => selectObject(null)}
                        onDelete={() => {
                            removeObject(selectedObject.id);
                            selectObject(null);
                        }}
                    />
                </div>
            )}
        </main>
    );
}
