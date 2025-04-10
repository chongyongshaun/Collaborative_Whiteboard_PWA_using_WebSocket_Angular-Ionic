import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonLabel, IonItem } from '@ionic/angular/standalone';
import { DrawingService } from 'src/app/services/drawing.service';
import { DrawingAction } from 'src/app/types/DrawingAction';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.page.html',
  styleUrls: ['./canvas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButton, IonButtons, IonLabel, IonItem]
})
export class CanvasPage implements AfterViewInit, OnInit, OnDestroy { //cant use oninit, i need the canvas to be rendered first, dk why exactly, i have no idea what im doing
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>; //static to true so i can get the el before view is init, basically b4 afterviewinit
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private posX = 0;
  private posY = 0;
  currentColor = 'black';
  currentLineWidth = 2;
  sessionId = ""
  private initialCanvasState: ImageData | null = null;

  private drawingServiceSubscription!: Subscription; //the ! means that this variable will be initialized later, to keep angular compiler happy 
  constructor(private drawingService: DrawingService) { }

  ngOnInit(): void {
    this.drawingServiceSubscription = this.drawingService.newDrawingEvent.subscribe((data: DrawingAction) => { //received from the subject in drawing service
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

      this.ctx.strokeStyle = this.currentColor
      this.ctx.lineWidth = this.currentLineWidth
      this.sessionId = this.drawingService.getSocketId();
      this.initialCanvasState = this.ctx.getImageData(0, 0, canvas.width, canvas.height)
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
      this.drawLine(this.posX, this.posY, e.offsetX, e.offsetY, this.currentColor, this.currentLineWidth);
      const imageData = this.ctx.getImageData(0, 0,
        this.canvasRef.nativeElement.width,
        this.canvasRef.nativeElement.height
      );
      this.drawingService.sendDrawingAction(imageData, this.currentColor, this.currentLineWidth);
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
    this.drawLine(this.posX, this.posY, touchOffsetX, touchOffsetY, this.currentColor, this.currentLineWidth);

    const imageData = this.ctx.getImageData(0, 0,
      this.canvasRef.nativeElement.width,
      this.canvasRef.nativeElement.height
    );
    this.drawingService.sendDrawingAction(imageData, this.currentColor, this.currentLineWidth);
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
    // console.log('Drawing line:', initialPosX, initialPosY, finalPosX, finalPosY); // Debug log
  }

  private drawRemote(action: DrawingAction) {
    const img = new Image();
    img.onload = () => {
      const canvas = this.canvasRef.nativeElement;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.strokeStyle = action.color;
      this.ctx.lineWidth = action.lineWidth;
      this.ctx.drawImage(img, 0, 0, action.width, action.height);
    };
    img.src = action.dataUrl;
  }

  updateDrawingStyle() {
    this.ctx.strokeStyle = this.currentColor; //two way binding with the color picker
    this.ctx.lineWidth = this.currentLineWidth; //same for line width
  }

  undo() {
    this.drawingService.sendUndoRequest()
  }

  redo() {
    this.drawingService.sendRedoRequest()
  }
  clearCanvas() {
    this.drawingService.sendClearCanvasRequest();
  }


}
