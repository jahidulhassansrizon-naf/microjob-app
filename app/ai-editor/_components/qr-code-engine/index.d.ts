declare class QRCode {
  constructor(typeNumber: number, errorCorrectLevel: number);
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, column: number): boolean;
}
export default QRCode;
