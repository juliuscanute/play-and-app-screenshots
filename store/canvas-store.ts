import { create } from 'zustand';
import { CanvasObject, CanvasStore } from '@/types/canvas';

export const useCanvasStore = create<CanvasStore>((set, get) => ({
    width: 1080,
    height: 1920,
    background: '#ffffff',
    objects: [],
    selectedObjectId: null,
    fabricCanvas: null,

    setSize: (width: number, height: number) => {
        set({ width, height });
    },

    setBackground: (background: string) => {
        set({ background });
    },

    addObject: (object: CanvasObject) => {
        set((state) => ({
            objects: [...state.objects, object]
        }));
    },

    updateObject: (id: string, updates: Partial<CanvasObject>) => {
        set((state) => ({
            objects: state.objects.map((obj) =>
                obj.id === id ? { ...obj, ...updates } as CanvasObject : obj
            )
        }));
    },

    removeObject: (id: string) => {
        set((state) => ({
            objects: state.objects.filter((obj) => obj.id !== id),
            selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }));
    },

    selectObject: (id: string | null) => {
        set({ selectedObjectId: id });
    },

    setObjects: (objects: CanvasObject[]) => {
        set({ objects });
    },

    setFabricCanvas: (canvas: any) => {
        set({ fabricCanvas: canvas });
    },

    resetCanvas: () => {
        set({
            objects: [],
            selectedObjectId: null,
            background: '#ffffff',
            width: 1080,
            height: 1920
        });
    }
}));
