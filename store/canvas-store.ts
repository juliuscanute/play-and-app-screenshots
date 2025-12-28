
import { create } from 'zustand';

import { CanvasObject, CanvasStore, CanvasModel } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';


export const useCanvasStore = create<CanvasStore>((set, get) => ({

    canvases: [
        {
            id: 'default',
            name: 'Canvas 1',
            width: 1080,
            height: 1920,
            background: '#ffffff',
            objects: []
        }
    ],

    activeCanvasId: 'default',
    selectedObjectId: null,
    fabricCanvas: null,
    clipboard: null,


    // Canvas Management
    addCanvas: () => {
        set((state) => {
            const id = uuidv4();
            const newCanvas: CanvasModel = {
                id,
                name: `Canvas ${state.canvases.length + 1}`,
                width: 1080,
                height: 1920,
                background: '#ffffff',
                objects: []
            };
            return {
                canvases: [...state.canvases, newCanvas],
                activeCanvasId: id
            };
        });
    },

    duplicateCanvas: (canvasId) => {
        set((state) => {
            const original = state.canvases.find(c => c.id === canvasId);
            if (!original) return state;

            const id = uuidv4();
            const newCanvas: CanvasModel = {
                ...original,
                id,
                name: `${original.name} (Copy)`,
                objects: original.objects.map(obj => ({ ...obj, id: uuidv4() }))
            };
            return {
                canvases: [...state.canvases, newCanvas],
                activeCanvasId: id
            };
        });
    },

    removeCanvas: (canvasId) => {
        set((state) => {
            const newCanvases = state.canvases.filter(c => c.id !== canvasId);
            // Prevent removing last canvas
            if (newCanvases.length === 0) return state;

            let newActiveId = state.activeCanvasId;
            if (state.activeCanvasId === canvasId) {
                newActiveId = newCanvases[newCanvases.length - 1].id;
            }

            return {
                canvases: newCanvases,
                activeCanvasId: newActiveId
            };
        });
    },

    setActiveCanvas: (id) => {
        set({ activeCanvasId: id });
    },

    // Canvas Properties
    setSize: (width, height) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, width, height } : c
            )
        }));
    },

    setBackground: (background) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, background } : c
            )
        }));
    },

    // Object Management
    addObject: (object: CanvasObject) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, objects: [...c.objects, object] } : c
            )
        }));
    },

    updateObject: (id: string, updates: Partial<CanvasObject>) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? {
                    ...c,
                    objects: c.objects.map(obj =>
                        obj.id === id ? { ...obj, ...updates } as CanvasObject : obj
                    )
                } : c
            )
        }));
    },

    removeObject: (id: string) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? {
                    ...c,
                    objects: c.objects.filter(obj => obj.id !== id)
                } : c
            ),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },

    selectObject: (id: string | null) => {
        set({ selectedObjectId: id });
    },


    setObjects: (objects: CanvasObject[]) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, objects } : c
            )
        }));
    },


    setFabricCanvas: (canvas: any) => {
        set({ fabricCanvas: canvas });
    },

    resetCanvas: () => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? {
                    ...c,
                    objects: [],
                    background: '#ffffff',
                    width: 1080,
                    height: 1920
                } : c
            ),
            selectedObjectId: null
        }));
    },

    loadProject: (canvases, activeCanvasId) => {
        set({
            canvases,
            activeCanvasId,
            selectedObjectId: null
        });
    },

    renameCanvas: (id, name) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === id ? { ...c, name } : c
            )
        }));
    },

    copyObject: () => {
        set((state) => {
            const { selectedObjectId, canvases, activeCanvasId } = state;
            if (!selectedObjectId) return state;

            const activeCanvas = canvases.find(c => c.id === activeCanvasId);
            if (!activeCanvas) return state;

            const objectToCopy = activeCanvas.objects.find(o => o.id === selectedObjectId);
            if (!objectToCopy) return state;

            return { clipboard: JSON.parse(JSON.stringify(objectToCopy)) };
        });
    },

    pasteObject: () => {
        set((state) => {
            const { clipboard, canvases, activeCanvasId } = state;
            if (!clipboard) return state;

            const newId = uuidv4();
            const newObject = {
                ...clipboard,
                id: newId,
                x: clipboard.x + 20,
                y: clipboard.y + 20,
                // Ensure zIndex is top? Or just append to list which usually renders last (top)
                // We'll let zIndex be handled if needed, or just append.
            };

            return {
                canvases: canvases.map(c =>
                    c.id === activeCanvasId ? { ...c, objects: [...c.objects, newObject] } : c
                ),
                selectedObjectId: newId
            };
        });
    }
}));
