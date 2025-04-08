import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ChatService } from 'src/app/services/chat.service';
import { ChatMessage } from 'src/app/types/ChatMessage';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonLabel, IonButton, IonInput],
  providers: [ChatService]
})
export class ChatPage implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];

  private chatServiceSubscription!: Subscription; //subscription to the chat service
  constructor(private chatService: ChatService) {
  }

  ngOnInit() {
    this.chatServiceSubscription = this.chatService.newMessageEvent.subscribe((data: ChatMessage) => { //this will detect the new message event emitted by the chat service and push the message to the messages array
      console.log("Received chat message from", data.sender);
      this.messages.push(data);
    })
  }

  onSubmit(form: NgForm) {
    // this.messages.push("msg: " + form.value.chatInput); //push the message to the messages array
    const newMessage: ChatMessage = {
      sender: this.chatService.getSocketId(), //retrieve the socket id of the sender
      message: form.value.chatInput,
      timestamp: new Date() //replace with actual timestamp
    };
    this.messages.push(newMessage); //push the message to the messages array
    this.chatService.sendChatMessage(newMessage); //send the message to the server
    form.resetForm(); //reset the form after submission
  }

  ngOnDestroy() {
    this.chatServiceSubscription.unsubscribe(); //unsubscribe from the chat service to prevent memory leaks
  }
}
