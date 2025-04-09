import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { DrawingService } from 'src/app/services/drawing.service';
import { DrawingAction } from 'src/app/types/DrawingAction';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.page.html',
  styleUrls: ['./canvas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton]
})
export class CanvasPage implements AfterViewInit, OnInit, OnDestroy { //cant use oninit, i need the canvas to be rendered first, dk why exactly, i have no idea what im doing
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>; //static to true so i can get the el before view is init, basically b4 afterviewinit
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private posX = 0;
  private posY = 0;
  sessionId = ""

  private drawingServiceSubscription!: Subscription; //the ! means that this variable will be initialized later, to keep angular compiler happy 
  constructor(private drawingService: DrawingService) { }

  ngOnInit(): void {
    this.drawingServiceSubscription = this.drawingService.newDrawingEvent.subscribe((data: DrawingAction) => {
      // console.log("Received drawing action from", data.sender);

      if (data.sender !== this.sessionId) { //if the sender is not me, draw the line on the canvas
        console.log('Drawing line:', data); // Debug log
        this.drawRemote(data);
      } else {
        console.log('Drawing action is from this client, ignoring...');
      }
    });
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement; //native element is the actual DOM element so i can use canvas api
    const parent = canvas.parentElement!;
    setTimeout(() => { //adding a timeout works for some fucking reason, absolute dogshite code, i'm sure there must be a better way but i reckon it's cuz ionic/angular takes some time to render canvas but getBoundingClientRect is a dom function so it gets called independantly before angular renders the canvas
      const rect = parent.getBoundingClientRect();

      canvas.style.width = rect.width + 'px'; //set the canvas style width to match parent size
      canvas.style.height = rect.height + 'px';
      canvas.width = rect.width * window.devicePixelRatio; //set canvase to match parent size
      canvas.height = rect.height * window.devicePixelRatio;
      this.ctx = canvas.getContext('2d')!;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio); //scale the canvas to match the device pixel ratio

      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;
      this.sessionId = this.drawingService.getSocketId();
    }, 50);
  }
  ngOnDestroy(): void {
    this.drawingServiceSubscription.unsubscribe();
  }

  onMouseDown(e: MouseEvent) {
    console.log('Mouse Down:', e.offsetX, e.offsetY); //debug
    this.posX = e.offsetX;
    this.posY = e.offsetY;
    this.isDrawing = true;
  }
  onMouseUp() {
    this.isDrawing = false;
  }
  onMouseMove(e: MouseEvent) {
    if (this.isDrawing) {
      this.drawLine(this.posX, this.posY, e.offsetX, e.offsetY, this.ctx.strokeStyle as string, this.ctx.lineWidth);

      const canvas = this.canvasRef.nativeElement;
      const rect = canvas.getBoundingClientRect();
      const currClientDrawingAction: DrawingAction = {
        sender: this.sessionId,
        x1: this.posX,
        y1: this.posY,
        x2: e.offsetX,
        y2: e.offsetY,
        color: this.ctx.strokeStyle as string,
        lineWidth: this.ctx.lineWidth
      };
      this.drawingService.sendDrawingAction(currClientDrawingAction);
    }
  }
  onTouchStart(e: TouchEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.posX = e.touches[0].clientX - rect.left;
    this.posY = e.touches[0].clientY - rect.top;
    this.isDrawing = true;
  }
  onTouchMove(e: TouchEvent) {
    if (!this.isDrawing) return;
    e.preventDefault();
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const touchOffsetX = e.touches[0].clientX - rect.left;
    const touchOffsetY = e.touches[0].clientY - rect.top;
    this.drawLine(this.posX, this.posY, touchOffsetX, touchOffsetY, this.ctx.strokeStyle as string, this.ctx.lineWidth);
    const currClientDrawingAction: DrawingAction = {
      sender: this.sessionId,
      x1: this.posX,
      y1: this.posY,
      x2: touchOffsetX,
      y2: touchOffsetY,
      color: this.ctx.strokeStyle as string,
      lineWidth: this.ctx.lineWidth
    };
    this.drawingService.sendDrawingAction(currClientDrawingAction);
  }
  onTouchEnd() {
    this.isDrawing = false;
  }

  private drawLine(initialPosX: number, initialPosY: number, finalPosX: number, finalPosY: number, strokeColor: string, lineWidth: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(initialPosX, initialPosY);
    this.ctx.lineTo(finalPosX, finalPosY);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = lineWidth
    this.ctx.stroke();
    this.ctx.closePath();
    this.posX = finalPosX;
    this.posY = finalPosY;
    console.log('Drawing line:', initialPosX, initialPosY, finalPosX, finalPosY); // Debug log
  }

  private drawRemote(action: DrawingAction) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    this.ctx.beginPath();
    this.ctx.moveTo(action.x1 - 1, action.y1 - 1);
    this.ctx.lineTo(action.x2, action.y2);
    this.ctx.strokeStyle = action.color;
    this.ctx.lineWidth = action.lineWidth;
    this.ctx.stroke();
    this.ctx.closePath();

    console.log("drawing remote being called!!!")
  }

}
