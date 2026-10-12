import type { DocType } from '../api/types';

/** Prava va texpasport — faqat kamera, ramka ichiga tushadi. */
export const FRAMED_DOC_TYPES: readonly DocType[] = [
  'DRIVER_LICENSE',
  'DRIVER_LICENSE_BACK',
  'TECH_PASSPORT',
  'TECH_PASSPORT_BACK',
];

const FRAMED = new Set<DocType>(FRAMED_DOC_TYPES);

/** ISO/IEC 7810 ID-1 (85.6 × 53.98 mm). */
export const ID_CARD_ASPECT = 85.6 / 53.98;

export function isFramedDocType(docType: DocType): boolean {
  return FRAMED.has(docType);
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/** View o‘rtasidagi kartochka ramkasi (pt). */
export function frameRect(viewWidth: number, viewHeight: number): Rect {
  const horizontalPad = Math.max(24, viewWidth * 0.08);
  const width = Math.max(1, viewWidth - horizontalPad * 2);
  const height = width / ID_CARD_ASPECT;
  const y = (viewHeight - height) / 2;
  return { x: horizontalPad, y, width, height };
}

/**
 * CameraView cover-fit qilganda overlay ramkasini rasm pikseliga o‘tkazadi.
 * expo-image-manipulator crop shu origin/size ni kutadi.
 */
export function cropCover(image: Size, view: Size, frame: Rect): CropRect {
  const scale = Math.max(view.width / image.width, view.height / image.height);
  const displayedW = image.width * scale;
  const displayedH = image.height * scale;
  const offsetX = (displayedW - view.width) / 2;
  const offsetY = (displayedH - view.height) / 2;

  let originX = (frame.x + offsetX) / scale;
  let originY = (frame.y + offsetY) / scale;
  let width = frame.width / scale;
  let height = frame.height / scale;

  if (originX < 0) {
    width += originX;
    originX = 0;
  }
  if (originY < 0) {
    height += originY;
    originY = 0;
  }
  if (originX + width > image.width) {
    width = image.width - originX;
  }
  if (originY + height > image.height) {
    height = image.height - originY;
  }

  width = Math.max(1, Math.floor(width));
  height = Math.max(1, Math.floor(height));
  originX = Math.max(0, Math.floor(originX));
  originY = Math.max(0, Math.floor(originY));
  if (originX + width > image.width) originX = image.width - width;
  if (originY + height > image.height) originY = image.height - height;

  return { originX, originY, width, height };
}
