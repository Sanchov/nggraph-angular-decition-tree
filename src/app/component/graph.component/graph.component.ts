import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormGroup, FormBuilder, FormsModule } from '@angular/forms';
import { Node, Edge, GraphModule } from '@swimlane/ngx-graph';
import { TreeForm } from '../../services/tree-form';
import { NgForOf, NgIf } from '@angular/common';
import { curveLinear } from 'd3-shape';
interface BandSelection {
  nodeId: string;
  direction: 'yes' | 'no';
  bandId: string | null;
}
@Component({
  selector: 'decision-tree-graph',
  standalone: true,
  imports: [GraphModule, FormsModule, NgForOf, NgIf],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss',
})
export class DecisionTreeGraphComponent implements OnInit {
  treeForm = inject(TreeForm);
  fb = inject(FormBuilder);
  bandSelections: BandSelection[] = [];

  view: [number, number] = [1000, 2000];
  nodes: Node[] = [];
  links: Edge[] = [];
  formArray: FormArray = this.fb.array([]);
  curve = curveLinear;

  layoutSettings = {
    orientation: 'TB',
    nodePadding: 50,
    edgePadding: 100,
    rankPadding: 100,
    edgeLabelPosition: 'c',
    ranker: 'tight-tree',
  };

  bands = [
    { id: 'band-1', name: 'Band A' },
    { id: 'band-2', name: 'Band B' },
    { id: 'band-3', name: 'Band C' },
  ];

  ngOnInit() {
    const rootNode = this.treeForm.createNode(true, null, []);
    this.formArray.push(rootNode);
    this.updateGraphFromForm();
  }

  updateGraphFromForm() {
    const visited = new Set<string>();
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    const allControls = this.formArray.controls as FormGroup[];
    const getNodeById = (id: string): FormGroup | undefined =>
      allControls.find((ctrl) => ctrl.get('id')?.value === id);

    const root = allControls.find((ctrl) => ctrl.get('isRoot')?.value);
    if (!root) return;

    const queue: { id: string; level: number }[] = [
      { id: root.get('id')?.value, level: 0 },
    ];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const formNode = getNodeById(id);
      if (!formNode) continue;

      const label = formNode.get('question')?.value || 'Untitled';
      const yesId = formNode.get('yes.nodeId')?.value;
      const noId = formNode.get('no.nodeId')?.value;

      graphNodes.push({
        id,
        label,
        dimension: { width: 200, height: 110 },
        data: { level },
      });

      if (yesId) {
        graphEdges.push({
          id: `edge-${id}-${yesId}`,
          source: id,
          target: yesId,
          label: 'Yes',
          data: { type: 'yes' },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 50 },
          ], // Default points
        });
        if (!visited.has(yesId)) queue.push({ id: yesId, level: level + 1 });
      }

      if (noId) {
        graphEdges.push({
          id: `edge-${id}-${noId}`,
          source: id,
          target: noId,
          label: 'No',
          data: { type: 'no' },
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 50 },
          ], // Default points
        });
        if (!visited.has(noId)) queue.push({ id: noId, level: level + 1 });
      }
    }

    this.nodes = graphNodes;
    this.links = graphEdges;
  }

  getVerticalPath(link: Edge): string {
    if (!link.points || link.points.length < 2) {
      // Fallback to simple vertical line
      return `M0,0 L0,50`;
    }

    const sourceX = link.points[0].x;
    const sourceY = link.points[0].y;
    const targetY = link.points[link.points.length - 1].y;

    return `M${sourceX},${sourceY} L${sourceX},${targetY}`;
  }
  createYesNode(node: Node) {
    this.addChildFromGraphNode(node.id, 'yes');
  }

  createNoNode(node: Node) {
    this.addChildFromGraphNode(node.id, 'no');
  }

  addChildFromGraphNode(parentId: string, direction: 'yes' | 'no') {
    const parentIndex = this.formArray.controls.findIndex(
      (ctrl) => ctrl.get('id')?.value === parentId
    );
    if (parentIndex === -1) return;

    this.treeForm.addChildNode(this.formArray, parentIndex, direction);
    this.updateGraphFromForm();
  }

  onLabelChange(newLabel: string, node: Node) {
    const formNode = this.formArray.controls.find(
      (ctrl) => ctrl.get('id')?.value === node.id
    );
    if (formNode) {
      formNode.get('question')?.setValue(newLabel);
      this.updateGraphFromForm();
    }
  }

  onBandChange(
    nodeId: string,
    direction: 'yes' | 'no',
    newBandId: string | null
  ) {
    const node = this.getFormNodeById(nodeId);
    if (node) {
      const dirGroup = node.get(direction) as FormGroup;
      dirGroup.get('bandId')?.setValue(newBandId);

      // Update our band selections tracking
      const existingIndex = this.bandSelections.findIndex(
        (sel) => sel.nodeId === nodeId && sel.direction === direction
      );

      if (existingIndex >= 0) {
        this.bandSelections[existingIndex].bandId = newBandId;
      } else {
        this.bandSelections.push({ nodeId, direction, bandId: newBandId });
      }

      this.updateGraphFromForm();
    }
  }

  getFormNodeById(id: string): FormGroup {
    return this.formArray.controls.find(
      (ctrl) => (ctrl as FormGroup).get('id')?.value === id
    ) as FormGroup;
  }

  hasChild(id: string, dir: 'yes' | 'no'): boolean {
    const node = this.getFormNodeById(id);
    return !!node?.get(dir)?.get('nodeId')?.value;
  }

  getBandId(id: string, dir: 'yes' | 'no'): string | null {
    const node = this.getFormNodeById(id);
    return node?.get(dir)?.get('bandId')?.value ?? null;
  }

  // Add this new method to check if band is selected
  hasBandSelected(nodeId: string, direction: 'yes' | 'no'): boolean {
    return !!this.bandSelections.find(
      (sel) =>
        sel.nodeId === nodeId &&
        sel.direction === direction &&
        sel.bandId !== null
    );
  }

  markInvalidNodes() {
    this.nodes = this.nodes.map((node) => {
      const formNode = this.getFormNodeById(node.id);
      const isValid = formNode?.get('question')?.value?.trim() !== '';
      return {
        ...node,
        data: {
          ...node.data,
          isInvalid: !isValid,
        },
      };
    });
  }

  // Add this validation method
  validateTree(): boolean {
    // Check all nodes have a question
    const hasEmptyQuestions = this.formArray.controls.some((ctrl) => {
      const question = ctrl.get('question')?.value;
      return !question || question.trim() === '';
    });

    if (hasEmptyQuestions) {
      alert('All nodes must have a question!');
      return false;
    }

    // Check all leaf nodes have bands selected
    const leafNodes = this.formArray.controls.filter((ctrl) => {
      const yesNode = ctrl.get('yes.nodeId')?.value;
      const noNode = ctrl.get('no.nodeId')?.value;
      return !yesNode && !noNode;
    });

    const hasUnbandedLeaves = leafNodes.some((ctrl) => {
      const yesBand = ctrl.get('yes.bandId')?.value;
      const noBand = ctrl.get('no.bandId')?.value;
      return !yesBand && !noBand;
    });

    if (hasUnbandedLeaves) {
      alert('All leaf nodes must have at least one band selected!');
      return false;
    }

    return true;
  }

  // Update your logTreeStructure to include validation
  logTreeStructure() {
    if (this.validateTree()) {
      console.log(
        'Valid Tree Structure:',
        JSON.stringify(this.formArray.value, null, 2)
      );
    }
  }
}
