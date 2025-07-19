import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appZoomPan]',
})
export class ZoomPanDirective implements AfterViewInit, OnDestroy {
  private scale = 1;
  private panX = 0;
  private panY = 0;
  private startX = 0;
  private startY = 0;
  private isDragging = false;
  private minScale = 0.1;
  private maxScale = 3;
  private scaleStep = 0.1;
  private graphContainer!: HTMLElement;
  private destroy$!: () => void;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit() {
    this.graphContainer =
      this.el.nativeElement.querySelector('ngx-graph > div');
    this.applyTransform();

    // Prevent default touch behaviors
    const preventDefault = (e: Event) => e.preventDefault();
    this.destroy$ = this.renderer.listen(
      this.el.nativeElement,
      'touchmove',
      preventDefault
    );
  }

  ngOnDestroy() {
    if (this.destroy$) {
      this.destroy$();
    }
  }

  private applyTransform() {
    if (!this.graphContainer) return;

    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    this.renderer.setStyle(this.graphContainer, 'transform', transform);
    this.renderer.setStyle(this.graphContainer, 'transform-origin', '0 0');
    this.renderer.setStyle(
      this.graphContainer,
      'transition',
      'transform 0.05s ease-out'
    );
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const rect = this.el.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const zoomIn = event.deltaY < 0;
    const oldScale = this.scale;

    if (zoomIn && this.scale < this.maxScale) {
      this.scale = Math.min(this.maxScale, this.scale + this.scaleStep);
    } else if (!zoomIn && this.scale > this.minScale) {
      this.scale = Math.max(this.minScale, this.scale - this.scaleStep);
    }

    // Adjust pan to zoom toward mouse position
    this.panX = mouseX - (mouseX - this.panX) * (this.scale / oldScale);
    this.panY = mouseY - (mouseY - this.panY) * (this.scale / oldScale);

    this.applyTransform();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // Only start dragging if clicking on background or graph container
    if (
      event.target === this.el.nativeElement ||
      event.target === this.graphContainer ||
      (event.target as HTMLElement).closest('ngx-graph > div')
    ) {
      this.isDragging = true;
      this.startX = event.clientX - this.panX;
      this.startY = event.clientY - this.panY;
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grabbing');
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.startX;
    this.panY = event.clientY - this.startY;
    this.applyTransform();
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.startX = event.touches[0].clientX - this.panX;
      this.startY = event.touches[0].clientY - this.panY;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.panX = event.touches[0].clientX - this.startX;
    this.panY = event.touches[0].clientY - this.startY;
    this.applyTransform();
  }

  @HostListener('touchend')
  onTouchEnd() {
    this.isDragging = false;
  }

  public resetView() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }
}
