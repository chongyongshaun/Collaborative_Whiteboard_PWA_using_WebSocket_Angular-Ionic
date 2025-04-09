import { EventEmitter, Injectable, Output } from '@angular/core';
import io from 'socket.io-client';
import { DrawingAction } from '../types/DrawingAction';
import { debounceTime, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private socket = io("http://localhost:3000/");
  private drawBuffer: DrawingAction[] = [];
  private readonly MAX_BUFFER_SIZE = 50; //send the batch when reach 50 actions or 50ms
  private drawSubject = new Subject<void>(); //subject to notify when a new drawing action is received
  @Output() newDrawingEvent = new EventEmitter<DrawingAction>(); //obj used to emit events to client and server

  constructor() {
    // //listen for "draw" events from the server
    // this.socket.on('draw', (data: DrawingAction) => {
    //   console.log('Received drawing action from:', data.sender);
    //   this.newDrawingEvent.emit(data); //emit to client so my canvas page/component can use it
    // });
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    // Batch drawing events with 200ms debounce 
    this.drawSubject.pipe( //.pipe is used to chain multiple operators together, like map, filter, etc.
      debounceTime(50) //basically, this will wait for 50ms after the last event that happened before emitting the event, so if a user pauses for more than 200ms it will send it all in one batch, reduce server call
    ).subscribe(() => {
      if (this.drawBuffer.length > 0) {
        this.socket.emit('draw', this.drawBuffer);
        this.drawBuffer = []; //clear the buffer after sending
      }
    });

    // Handle incoming batches
    this.socket.on('draw', (batch: DrawingAction[]) => {
      console.log('Received batch of', batch.length, 'actions');
      batch.forEach(action => {
        if (action.sender !== this.socket.id) {
          this.newDrawingEvent.emit(action); //send to component
        }
      });
    });
  }
  //method to send drawing action to the server, the server will the broadcast it to all clients using socket.broadcast.emit
  sendDrawingAction(data: DrawingAction) {
    this.drawBuffer.push(data);
    //send immediately if batch is full, or debounce with shorter timeout
    if (this.drawBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.socket.emit('draw', this.drawBuffer);
      this.drawBuffer = [];
    } else {
      this.drawSubject.next(); //send the event to the subject to trigger the debounce
    }
  }
  getSocketId(): string {
    return this.socket.id as string;
  }
}
