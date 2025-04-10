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
        this.newDrawingEvent.emit(data); //emit to component
      }
    });

    this.drawingActionSubject.pipe(debounceTime(200)).subscribe(() => {
      //emitting back to server.js
      if (this.latestDrawingAction) {
        this.socket.emit('draw', this.latestDrawingAction);
        this.latestDrawingAction = null; //reset the latest drawing action after emitting
      }
    });

    this.socket.on('undo response', (data: DrawingAction) => {
      console.log("undo response received")
      const undoAction: DrawingAction = {
        sender: "server",
        dataUrl: data.dataUrl,
        width: data.width,
        height: data.height,
        color: data.color,
        lineWidth: data.lineWidth
      }
      this.newDrawingEvent.emit(undoAction); // Pass the undo action to the component to be rendered
      this.socket.emit('draw', undoAction); // Send the undo action to all other clients
    })

    this.socket.on('redo response', (data: DrawingAction) => {
      console.log("redo response received")
      const redoAction: DrawingAction = {
        sender: "server",
        dataUrl: data.dataUrl,
        width: data.width,
        height: data.height,
        color: data.color,
        lineWidth: data.lineWidth
      }
      this.newDrawingEvent.emit(redoAction);
      this.socket.emit('draw', redoAction);
    })

    this.socket.on("clear canvas response", () => {
      console.log("clear canvas response received");
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = "#f3f3f3";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      //fill the whole canvas with white color to clear it
      const clearAction: DrawingAction = {
        sender: "server",
        dataUrl: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
        color: "f3f3f3",
        lineWidth: 0
      };

      this.newDrawingEvent.emit(clearAction); // Pass the clear action to the component to be rendered
      this.socket.emit('draw', clearAction); // Send the clear action to all other clients
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

  sendUndoRequest() {
    this.socket.emit('undo request');
  }
  sendRedoRequest() {
    this.socket.emit('redo request');
  }

  sendClearCanvasRequest() {
    this.socket.emit('clear canvas request');
  }

  getSocketId(): string {
    return this.socket.id as string;
  }
}
