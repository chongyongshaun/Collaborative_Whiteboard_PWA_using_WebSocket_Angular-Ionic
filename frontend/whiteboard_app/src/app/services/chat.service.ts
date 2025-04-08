import { EventEmitter, Injectable, Output } from '@angular/core';
import io from 'socket.io-client';
import { ChatMessage } from '../types/ChatMessage';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket = io("http://localhost:3000/");
  @Output() newMessageEvent = new EventEmitter<ChatMessage>(); //create a new event emitter for the new message event use (eventName) for event binding in angular

  constructor() { //everything in angular constructor is executed when the class is instantiated which is when the service is injected into a component
    this.socket.on('connect', () => { //when the socket is connected to the server, the "connect" event is emitted by the socket.io library, and we can listen for it using the "on" method. The callback function will be executed when the event is emitted.
      console.log('Connected to server');
    });
    this.socket.on('chat message', (data: ChatMessage) => { //custom event that is emitted by the server when a chat message is received. The data parameter contains the message data. using our method
      console.log('Received chat message from', data.sender);
      this.newMessageEvent.emit(data); //emit so the @input in component can listen for it and get it
    });
  }

  //help methor for pages to send chat message to server and chat message event to the client
  sendChatMessage(data: ChatMessage) {
    this.socket.emit('chat message', data);
    console.log('Sent chat message (console.log inside service):', data);
  }
  getSocketId(): string {
    return this.socket.id as string;
  }
}
