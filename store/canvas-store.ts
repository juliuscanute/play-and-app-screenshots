
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
    past: [],
    future: [],
    fileHandle: null,


    // Canvas Management
    setFileHandle: (handle) => {
        set({ fileHandle: handle });
    },

    addCanvas: () => {
        set((state) => {
            const historyUpdate = { past: [...state.past, state.canvases], future: [] };
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
            const historyUpdate = { past: [...state.past, state.canvases], future: [] };
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
            const historyUpdate = { past: [...state.past, state.canvases], future: [] };
            const newCanvases = state.canvases.filter(c => c.id !== canvasId);
            // Prevent removing last canvas
            if (newCanvases.length === 0) return state;

            let newActiveId = state.activeCanvasId;
            if (state.activeCanvasId === canvasId) {
                newActiveId = newCanvases[newCanvases.length - 1].id;
            }

            return {
                canvases: newCanvases,
                activeCanvasId: newActiveId,
                ...historyUpdate
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
            ),
            past: [...state.past, state.canvases],
            future: []
        }));
    },

    setBackground: (background) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, background } : c
            ),
            past: [...state.past, state.canvases],
            future: []
        }));
    },

    // Object Management
    addObject: (object: CanvasObject) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, objects: [...c.objects, object] } : c
            ),
            past: [...state.past, state.canvases],
            future: []
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
            ),
            past: [...state.past, state.canvases],
            future: []
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
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
            past: [...state.past, state.canvases],
            future: []
        }));
    },

    selectObject: (id: string | null) => {
        set({ selectedObjectId: id });
    },


    setObjects: (objects: CanvasObject[]) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === state.activeCanvasId ? { ...c, objects } : c
            ),
            past: [...state.past, state.canvases],
            future: []
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
            selectedObjectId: null,
            past: [...state.past, state.canvases],
            future: []
        }));
    },

    loadProject: (canvases, activeCanvasId) => {
        set({
            canvases,
            activeCanvasId,
            selectedObjectId: null,
            past: [], // Reset history on new project load
            future: []
        });
    },

    renameCanvas: (id, name) => {
        set((state) => ({
            canvases: state.canvases.map(c =>
                c.id === id ? { ...c, name } : c
            ),
            past: [...state.past, state.canvases],
            future: []
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
                selectedObjectId: newId,
                past: [...state.past, state.canvases], // Save history
                future: []
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.past.length === 0) return state;

            const previousCanvases = state.past[state.past.length - 1];
            const newPast = state.past.slice(0, -1);

            return {
                canvases: previousCanvases,
                past: newPast,
                future: [state.canvases, ...state.future],
                // We might want to clear selection or keep it safe
                selectedObjectId: null
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.future.length === 0) return state;

            const nextCanvases = state.future[0];
            const newFuture = state.future.slice(1);

            return {
                canvases: nextCanvases,
                past: [...state.past, state.canvases],
                future: newFuture,
                selectedObjectId: null
            };
        });
    }
}));
