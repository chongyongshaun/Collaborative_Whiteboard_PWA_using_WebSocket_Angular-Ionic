import { EventEmitter, Injectable, Output } from '@angular/core';
import io from 'socket.io-client';
import { DrawingAction } from '../types/DrawingAction';
import { debounceTime, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private socket = io("http://localhost:3000/");
  private drawingActionSubject = new Subject<void>(); //subject to notify when a new drawing action is received
  @Output() newDrawingEvent = new EventEmitter<DrawingAction>();
  private latestDrawingAction: DrawingAction | null = null; //to keep track of the latest drawing action
  //data flow of the app: canvas -> drawing service -> socket.io -> server -> socket.io -> drawing service -> canvas
  //the corresponding function are sendDrawingAction (updates latest action) -> calls .next() on the subject -> subject waits for 200ms, if no new action is received, emit latest action to server
  constructor() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('draw', (data: DrawingAction) => {
      if (data.sender !== this.socket.id) {
        this.newDrawingEvent.emit(data);
      }
    });

    this.drawingActionSubject.pipe(debounceTime(200)).subscribe(() => {
      //emitting the drawing action to the server
      if (this.latestDrawingAction) {
        this.socket.emit('draw', this.latestDrawingAction);
        this.latestDrawingAction = null; //reset the latest drawing action after emitting
      }
    });
  }

  sendDrawingAction(imageData: ImageData, color: string, lineWidth: number) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const drawingAction: DrawingAction = {
      sender: this.socket.id as string,
      dataUrl: canvas.toDataURL(),
      width: imageData.width,
      height: imageData.height,
      color: color,
      lineWidth: lineWidth
    };

    this.latestDrawingAction = drawingAction;
    this.drawingActionSubject.next(); //notify that a new drawing action is available 
  }

  getSocketId(): string {
    return this.socket.id as string;
  }
}
