import { Component, Input, OnChanges } from '@angular/core';
import { Node, Edge, NgxGraphModule } from '@swimlane/ngx-graph';
import { FormArray, FormGroup } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'decision-tree-graph',
  standalone: true,
  imports: [NgxGraphModule, CommonModule],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss',
})
export class DecisionTreeGraphComponent {}
