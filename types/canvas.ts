export enum CanvasObjectType {
    Rect = 'rect',
    Circle = 'circle',
    Triangle = 'triangle',
    Polygon = 'polygon',
    Line = 'line',
    Arrow = 'arrow',
    Text = 'text',
    Image = 'image',
    Path = 'path',
    DeviceFrame = 'device_frame'
}

export type ShapeType = CanvasObjectType; // Backward compat alias if needed, or just replace usages.

export interface BaseObject {
    id: string;
    type: CanvasObjectType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    zIndex: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface ShapeObject extends BaseObject {
    type: CanvasObjectType.Rect | CanvasObjectType.Circle | CanvasObjectType.Triangle | CanvasObjectType.Polygon;
    cornerRadius?: number; // Only for Rect
    sides?: number; // For Polygon
}

export interface LineObject extends BaseObject {
    type: CanvasObjectType.Line | CanvasObjectType.Arrow;
    x2: number; // End point relative to x
    y2: number; // End point relative to y
}

export interface TextObject extends BaseObject {
    type: CanvasObjectType.Text;
    text: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontStyle?: string;
    underline?: boolean;
    textAlign: 'left' | 'center' | 'right';
}

export interface ImageObject extends BaseObject {
    type: CanvasObjectType.Image;
    src: string;
}

export interface PathObject extends BaseObject {
    type: CanvasObjectType.Path;
    pathData: string;
}

export enum DeviceModel {
    iPhone16Pro = 'iphone_16_pro',
    Pixel9 = 'pixel_9',
    SamsungS24 = 'samsung_s24',
    iPadPro13 = 'ipad_pro_13',
    AndroidTablet = 'android_tablet'
}

export interface DeviceFrameObject extends BaseObject {
    type: CanvasObjectType.DeviceFrame;
    deviceModel: DeviceModel;
    frameColor: string;
    screenshotImageId?: string | null;
    tilt?: {
        x: number;
        y: number;
        perspective: number;
    };
}

export type CanvasObject = ShapeObject | LineObject | TextObject | ImageObject | PathObject | DeviceFrameObject;


export interface CanvasModel {
    id: string;
    name: string;
    width: number;
    height: number;
    background: string;
    objects: CanvasObject[];
}

export interface CanvasStore {
    canvases: CanvasModel[];
    activeCanvasId: string | null;
    selectedObjectId: string | null;
    fabricCanvas: any | null;
    clipboard: CanvasObject | null;
    past: CanvasModel[][];
    future: CanvasModel[][];
    fileHandle: any | null; // FileSystemFileHandle

    // Canvas Actions
    addCanvas: () => void;
    duplicateCanvas: (id: string) => void;
    removeCanvas: (id: string) => void;
    setActiveCanvas: (id: string) => void;
    setFileHandle: (handle: any | null) => void;

    // Active Canvas Modifiers
    setSize: (width: number, height: number) => void;
    setBackground: (color: string) => void;
    addObject: (object: CanvasObject) => void;
    updateObject: (id: string, updates: Partial<CanvasObject>) => void;
    removeObject: (id: string) => void;
    selectObject: (id: string | null) => void;
    setObjects: (objects: CanvasObject[]) => void;
    setFabricCanvas: (canvas: any) => void;
    resetCanvas: () => void;
    loadProject: (canvases: CanvasModel[], activeCanvasId: string) => void;
    renameCanvas: (id: string, name: string) => void;

    // Clipboard Actions
    copyObject: () => void;
    pasteObject: () => void;

    // History Actions
    undo: () => void;
    redo: () => void;
}
