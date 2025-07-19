import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TreeForm } from './services/tree-form';

import { NgxGraphModule } from '@swimlane/ngx-graph';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { NodeComponent } from './node.component.ts/node.component.ts';
import { DecisionTreeGraphComponent } from './component/graph.component/graph.component';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, NgxGraphModule, DecisionTreeGraphComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  fb = inject(FormBuilder);
  treeService = inject(TreeForm);
  validationErrors: Record<string, string[]> = {};

  treeForm = this.fb.group({
    nodes: this.fb.array<FormGroup>([]),
  });

  get nodeGroups(): FormGroup[] {
    return this.nodes.controls as FormGroup[];
  }

  get nodes(): FormArray {
    return this.treeForm.get('nodes') as FormArray;
  }

  ngOnInit(): void {
    this.nodes.push(this.treeService.createNode(true));
  }

  logTreeStructure() {
    const treeData = this.nodes.value;
    console.log('🔍 Full Tree Structure:', JSON.stringify(treeData, null, 2));
  }

  validateTree() {
    this.treeService.validateTreeNodes(this.nodes);
  }
}
