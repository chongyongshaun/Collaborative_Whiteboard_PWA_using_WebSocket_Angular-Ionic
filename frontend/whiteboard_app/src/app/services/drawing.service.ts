import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import io from 'socket.io-client';

//inteerface for the drawing action
interface DrawingAction {
  x: number;
  y: number;
  color: string;
  lineWidth: number;
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private socket = io("http://localhost:3000/");
  constructor() {
    // Listen for "draw" events from the server
    this.socket.on('draw', (data: DrawingAction) => {
      console.log('Received drawing action:', data);

    });
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
  }
  //method to send drawing action to the server, the server will the broadcast it to all clients using socket.broadcast.emit
  sendDrawingAction(data: DrawingAction) {
    this.socket.emit('draw', data);
    console.log('Sent drawing action:', data);
  }
  getSocketId(): string {
    return this.socket.id as string;
  }
}
