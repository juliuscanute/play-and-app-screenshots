'use client';

import Sidebar from '@/components/editor/Sidebar';
import FabricCanvas from '@/components/editor/FabricCanvas';
import PropertyPanel from '@/components/editor/PropertyPanel';
import { useCanvasStore } from '@/store/canvas-store';


export default function Home() {
    const { canvases, activeCanvasId, selectedObjectId, updateObject, removeObject, selectObject, setSize, setBackground } = useCanvasStore();

    const activeCanvas = canvases.find(c => c.id === activeCanvasId);
    const objects = activeCanvas?.objects || [];

    const selectedObject = objects.find(o => o.id === selectedObjectId);

    console.log("Page Render:", { activeCanvasId, selectedObjectId, foundObject: !!selectedObject });

    return (
        <main className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-black">
            <Sidebar />
            <div className="flex-1 relative flex flex-col h-full">
                <FabricCanvas />
            </div>
            {(selectedObject || activeCanvas) && (
                <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full shadow-xl z-20">
                    <PropertyPanel
                        object={selectedObject}
                        activeCanvas={activeCanvas}
                        updateObject={updateObject}
                        onUpdateCanvas={(updates) => {
                            if (updates.width || updates.height) {
                                setSize(
                                    updates.width || activeCanvas?.width || 1080,
                                    updates.height || activeCanvas?.height || 1920
                                );
                            }
                            if (updates.background) {
                                setBackground(updates.background);
                            }
                        }}
                        onClose={() => selectObject(null)}
                        onDelete={() => {
                            if (selectedObject) {
                                removeObject(selectedObject.id);
                                selectObject(null);
                            }
                        }}
                    />
                </div>
            )}
        </main>
    );
}
