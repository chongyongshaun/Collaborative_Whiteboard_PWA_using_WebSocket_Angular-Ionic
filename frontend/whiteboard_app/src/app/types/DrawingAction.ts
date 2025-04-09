export interface DrawingAction {
    sender: string;
    dataUrl: string;  // Base64 encoded image data
    width: number;
    height: number;
    color: string;
    lineWidth: number;
}