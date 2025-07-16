import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[appZoomPan]'
})
export class ZoomPanDirective {
  private scale = 1;
  private lastScale = 1;
  private minScale = 0.5;
  private maxScale = 3;
  private scaleStep = 0.1;

  private panX = 0;
  private panY = 0;
  private startX = 0;
  private startY = 0;
  private isDragging = false;

  private lastTouchDistance = 0;
  private isTouching = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.setTransform();
  }

  private setTransform() {
    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.renderer.setStyle(this.el.nativeElement, 'transform', transform);
    this.renderer.setStyle(this.el.nativeElement, 'transform-origin', 'center');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.05s');
    this.renderer.setStyle(this.el.nativeElement, 'touch-action', 'none'); // disables default gestures
    this.renderer.setStyle(this.el.nativeElement, 'cursor', this.isDragging ? 'grabbing' : 'grab');
  }

  // Mouse wheel for zoom
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomIn = event.deltaY < 0;

    if (zoomIn && this.scale < this.maxScale) {
      this.scale += this.scaleStep;
    } else if (!zoomIn && this.scale > this.minScale) {
      this.scale -= this.scaleStep;
    }

    this.setTransform();
  }

  // Mouse drag
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX - this.panX;
    this.startY = event.clientY - this.panY;
    this.setTransform();
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.setTransform();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
    this.setTransform();
  }

  // Touch drag + pinch
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.isTouching = true;

    if (event.touches.length === 1) {
      this.startX = event.touches[0].clientX - this.panX;
      this.startY = event.touches[0].clientY - this.panY;
    } else if (event.touches.length === 2) {
      this.lastTouchDistance = this.getDistance(event.touches);
      this.lastScale = this.scale;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 1) {
      this.panX = event.touches[0].clientX - this.startX;
      this.panY = event.touches[0].clientY - this.startY;
    } else if (event.touches.length === 2) {
      const newDistance = this.getDistance(event.touches);
      const scaleChange = newDistance / this.lastTouchDistance;
      this.scale = this.lastScale * scaleChange;

      // Clamp zoom scale
      this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale));
    }

    this.setTransform();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.isTouching = false;
  }

  private getDistance(touches: TouchList): number {
    const [a, b] = [touches[0], touches[1]];
    const dx = b.clientX - a.clientX;
    const dy = b.clientY - a.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
