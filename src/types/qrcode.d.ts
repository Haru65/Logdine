declare module 'qrcode' {
  export interface QRCodeToCanvasOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }

  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options: QRCodeToCanvasOptions,
      callback?: (error?: Error | null) => void,
    ): void;
  };

  export default QRCode;
}
