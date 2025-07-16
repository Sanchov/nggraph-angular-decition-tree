import { Component, Input, OnChanges } from '@angular/core';
import { Node, Edge, NgxGraphModule, ClusterNode } from '@swimlane/ngx-graph';
import {
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'decision-tree-graph',
  standalone: true,
  imports: [NgxGraphModule, CommonModule, FormsModule],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss',
})
export class DecisionTreeGraphComponent {
  view: [number, number] = [800, 550];

  nodes: Node[] = [
    {
      id: 'level1-root',
      label: 'Level 1 Root',
      dimension: { width: 180, height: 90 },
      data: { level: 0 },
    },
  ];

  links: Edge[] = [];

  createYesNode(node: Node) {
    const newNode: Node = {
      id: `yes-${node.data?.level + 1}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      label: 'Yes Node',
      dimension: { width: 180, height: 90 },
      data: { level: node.data?.level + 1 },
    };

    const newLink: Edge = {
      id: `link-${node.id}-${newNode.id}`,
      source: node.id,
      target: newNode.id,
      label: 'Yes',
    };

    this.nodes = [...this.nodes, newNode]; // trigger re-render
    this.links = [...this.links, newLink]; // trigger re-render
  }

  createNoNode(node: Node) {
    const newNode: Node = {
      id: `no-${node.data?.level + 1}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      label: 'No Node',
      dimension: { width: 180, height: 90 },
      data: { level: node.data?.level + 1 },
    };

    const newLink: Edge = {
      id: `link-${node.id}-${newNode.id}`,
      source: node.id,
      target: newNode.id,
      label: 'N',
    };

    this.nodes = [...this.nodes, newNode]; // trigger re-render
    this.links = [...this.links, newLink]; // trigger re-render
  }

  onLabelChange(newLabel: string, node: Node) {
    node.label = newLabel;
    this.nodes = [...this.nodes]; // trigger re-render
  }
}
