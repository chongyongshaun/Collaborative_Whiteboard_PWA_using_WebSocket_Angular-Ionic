import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { CanvasPage } from '../pages/canvas/canvas.page';
import { ChatPage } from '../pages/chat/chat.page';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, CanvasPage, ChatPage],
})
export class HomePage {
  constructor() { }
}
