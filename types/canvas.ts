export type ShapeType = 'rect' | 'circle' | 'text' | 'image' | 'path' | 'device_frame';

export interface BaseObject {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    fill?: string;
}

export interface ShapeObject extends BaseObject {
    type: 'rect' | 'circle';
    cornerRadius?: number;
}

export interface TextObject extends BaseObject {
    type: 'text';
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle?: string;
    underline?: boolean;
    textAlign: 'left' | 'center' | 'right';
}

export interface ImageObject extends BaseObject {
    type: 'image';
    src: string;
}

export interface PathObject extends BaseObject {
    type: 'path';
    pathData: string;
}

export interface DeviceFrameObject extends BaseObject {
    type: 'device_frame';
    deviceModel: string;
    frameColor: string;
    screenshotImageId?: string | null;
    tilt?: {
        x: number;
        y: number;
        perspective: number;
    };
}

export type CanvasObject = ShapeObject | TextObject | ImageObject | PathObject | DeviceFrameObject;

export interface CanvasStore {
    width: number;
    height: number;
    background: string;
    objects: CanvasObject[];
    selectedObjectId: string | null;
    fabricCanvas: any | null; // using any to avoid direct fabric dependency in types, or could be fabric.Canvas

    setSize: (width: number, height: number) => void;
    setBackground: (color: string) => void;
    addObject: (object: CanvasObject) => void;
    updateObject: (id: string, updates: Partial<CanvasObject>) => void;
    removeObject: (id: string) => void;
    selectObject: (id: string | null) => void;
    setObjects: (objects: CanvasObject[]) => void;
    setFabricCanvas: (canvas: any) => void;
    resetCanvas: () => void;
}
