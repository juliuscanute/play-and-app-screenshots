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
