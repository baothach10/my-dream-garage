export type TSpecification = {
  name: string;
  year: number;
  price: string;
  engine: string;
  horsepower: number;
  fuelType: string;
  transmission: string;
  topSpeed: string;
  acceleration: string;
  features: string[];
  image?: string;
  video?: string;
};

export type TImageResults = {
  type: string;
  buffer: ArrayBuffer;
};

export type THdriResults = {
  type: string;
  buffer: ArrayBuffer;
};

export interface ICarCoordinates {
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface ILerpCoordinates {
  x: number;
  y: number;
  z: number;
  index: number;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
}

export interface ILabelPosition {
  x: number;
  y: number;
  z: number;
  content?: string | string[];
  lerpIndex?: number;
}
