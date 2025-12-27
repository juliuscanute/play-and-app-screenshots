export type Vector2 = { x: number; y: number };

export type FillType = 'solid' | 'linear' | 'radial';

export interface GradientFill {
  type: 'linear' | 'radial';
  coords: { x1: number; y1: number; x2: number; y2: number }; // Normalized 0-1
  colorStops: Array<{ offset: number; color: string }>;
}

export type FillStyle = string | GradientFill;

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export type CanvasObject = ShapeObject | TextObject | DeviceFrameObject | ImageObject;

export interface BaseObject {
  id: string;
  type: string;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
}

export interface ShapeObject extends BaseObject {
  type: 'rect' | 'circle' | 'blob' | 'path';
  pathData?: string; // SVG Path 'd' attribute for complex shapes
  fill: FillStyle;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '700' | '900';
  fill: FillStyle;
  textAlign: 'left' | 'center' | 'right';
  shadow?: Shadow;
}

export interface DeviceFrameObject extends BaseObject {
  type: 'device_frame';
  deviceModel: 'iphone_15_pro' | 'pixel_8_pro' | 'generic_tablet';
  frameColor: 'black' | 'titanium' | 'silver';
  screenshotImageId?: string; // ID referencing a blob/url
  tilt: {
    x: number;
    y: number;
    perspective: number;
  };
  shadow?: Shadow;
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain' | 'fill';
}

export interface CanvasState {
  id: string;
  width: number;
  height: number;
  background: FillStyle;
  objects: CanvasObject[];
}
