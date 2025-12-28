import { create } from 'zustand';
import { CanvasState, CanvasObject, FillStyle } from '@/types/canvas';
import { v4 as uuidv4 } from 'uuid';

export interface CanvasStore extends CanvasState {
    // Fabric Instance Ref (Non-reactive)
    fabricCanvas: any | null; // Using any to avoid circular type issues with 'fabric' import
    setFabricCanvas: (canvas: any) => void;
    selectedObjectId: string | null;

    // Actions
    setId: (id: string) => void;
    setSize: (width: number, height: number) => void;
    setBackground: (background: FillStyle) => void;
    selectObject: (id: string | null) => void;
    addObject: (object: CanvasObject) => void;
    updateObject: (id: string, updates: Partial<CanvasObject>) => void;
    removeObject: (id: string) => void;
    setObjects: (objects: CanvasObject[]) => void;
    resetCanvas: () => void;
}

const DEFAULT_WIDTH = 1290;
const DEFAULT_HEIGHT = 2796;

export const useCanvasStore = create<CanvasStore>((set) => ({
    id: uuidv4(),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    background: '#ffffff',
    objects: [],
    fabricCanvas: null,
    selectedObjectId: null,

    setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),

    setId: (id) => set({ id }),
    setSize: (width, height) => set({ width, height }),
    setBackground: (background) => set({ background }),

    selectObject: (id) => set({ selectedObjectId: id }),

    addObject: (object) => set((state) => ({
        objects: [...state.objects, object]
    })),

    updateObject: (id, updates) => set((state) => ({
        objects: state.objects.map((obj) =>
            obj.id === id ? { ...obj, ...updates } as CanvasObject : obj
        ),
    })),

    removeObject: (id) => set((state) => ({
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
    })),

    setObjects: (objects) => set({ objects }),

    resetCanvas: () => set({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        background: '#ffffff',
        objects: [],
        selectedObjectId: null,
    }),
}));
