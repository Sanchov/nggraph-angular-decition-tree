import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { Node, Edge, GraphModule, GraphComponent } from '@swimlane/ngx-graph';
import { TreeForm } from '../../services/tree-form';
import { NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { curveLinear } from 'd3-shape';
import { debounceTime, fromEvent } from 'rxjs';

interface BandSelection {
  nodeId: string;
  direction: 'yes' | 'no';
  bandId: string | null;
}

@Component({
  selector: 'decision-tree-graph',
  standalone: true,
  imports: [GraphModule, FormsModule, NgForOf, NgIf, TitleCasePipe],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.scss',
})
export class DecisionTreeGraphComponent implements OnInit {
  treeForm = inject(TreeForm);
  fb = inject(FormBuilder);
  private cdRef = inject(ChangeDetectorRef);

  @ViewChild(GraphComponent) graphComponent!: GraphComponent;

  isGraphReady = false;
  view: [number, number] = [2200, 800];
  nodes: Node[] = [];
  links: Edge[] = [];
  formArray: FormArray = this.fb.array([]);
  curve = curveLinear;

  private savedTransform: any = null;

  layoutSettings = {
    orientation: 'TB',
    nodePadding: 50,
    edgePadding: 100,
    rankPadding: 100,
  };

  bands = [
    { id: 'band-1', name: 'Band A' },
    { id: 'band-2', name: 'Band B' },
    { id: 'band-3', name: 'Band C' },
  ];

  bandSelections: BandSelection[] = [];
  draftLabels: Record<string, string> = {};
  labelUpdateTimers: Record<string, any> = {};

  ngOnInit() {
    const rootNode = this.treeForm.createNode(true, null, []);
    rootNode.get('question')?.setValue('Untitled');
    this.formArray.push(rootNode);
    this.updateViewDimensions();

    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.updateViewDimensions();
        this.cdRef.detectChanges();
      });

    setTimeout(() => this.updateGraphFromForm(), 0);
  }

  private updateViewDimensions() {
    const width = Math.min(window.innerWidth * 0.9, 2000);
    const height = Math.min(window.innerHeight * 0.8, 1500);
    this.view = [width, height];
  }

  updateGraphFromForm() {
    if (this.graphComponent?.transform) {
      this.savedTransform = Object.assign({}, this.graphComponent.transform);
    }

    const visited = new Set<string>();
    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    const allControls = this.formArray.controls as FormGroup[];
    const getNodeById = (id: string): FormGroup | undefined =>
      allControls.find((ctrl) => ctrl.get('id')?.value === id);

    const root = allControls.find((ctrl) => ctrl.get('isRoot')?.value);
    if (!root) return;

    const queue: { id: string; level: number }[] = [
      { id: root.get('id')?.value || '', level: 0 },
    ];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const formNode = getNodeById(id);
      if (!formNode) continue;

      const rawLabel = (formNode.get('question')?.value || '').toString();
      const label = rawLabel.trim() === '' ? ' ' : rawLabel;

      const yesId = formNode.get('yes.nodeId')?.value;
      const noId = formNode.get('no.nodeId')?.value;

      graphNodes.push({
        id,
        label,
        dimension: { width: 200, height: 199 },
        data: { level, isInvalid: rawLabel.trim() === '' },
      });

      if (yesId) {
        graphEdges.push({
          id: `edge-${id}-${yesId}`,
          source: id,
          target: yesId,
          label: 'Yes',
          data: { type: 'yes' },
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
        });
        if (!visited.has(noId)) queue.push({ id: noId, level: level + 1 });
      }
    }

    this.nodes = [...graphNodes];
    this.links = [...graphEdges];
    this.isGraphReady = true;
    this.cdRef.detectChanges();

    setTimeout(() => {
      this.cdRef.detectChanges();
      if (this.graphComponent && this.savedTransform) {
        this.graphComponent.zoomTo(this.savedTransform);
      }
    }, 50);
  }

  getFormNodeById(id: string): FormGroup {
    return this.formArray.controls.find(
      (ctrl) => ctrl.get('id')?.value === id
    ) as FormGroup;
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

  getVerticalPath(link: Edge): string {
    if (!link.points || link.points.length < 2) return `M0,0 L0,50`;

    const sourceX = link.points[0].x;
    const sourceY = link.points[0].y;
    const targetY = link.points[link.points.length - 1].y;

    return `M${sourceX},${sourceY} L${sourceX},${targetY}`;
  }

  onBandChange(
    nodeId: string,
    direction: 'yes' | 'no',
    newBandId: string | null
  ) {
    const node = this.getFormNodeById(nodeId);
    if (!node) return;

    const dirGroup = node.get(direction) as FormGroup;
    dirGroup.get('bandId')?.setValue(newBandId);

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

  getBandId(id: string, dir: 'yes' | 'no'): string | null {
    const node = this.getFormNodeById(id);
    return node?.get(dir)?.get('bandId')?.value || null;
  }

  hasChild(id: string, dir: 'yes' | 'no'): boolean {
    const node = this.getFormNodeById(id);
    return !!node?.get(dir)?.get('nodeId')?.value;
  }

  hasBandSelected(nodeId: string, direction: 'yes' | 'no'): boolean {
    return !!this.bandSelections.find(
      (sel) =>
        sel.nodeId === nodeId &&
        sel.direction === direction &&
        sel.bandId !== null
    );
  }

  onQuestionDraftChange(newLabel: string, node: Node) {
    this.draftLabels[node.id] = newLabel;

    if (this.labelUpdateTimers[node.id]) {
      clearTimeout(this.labelUpdateTimers[node.id]);
    }

    this.labelUpdateTimers[node.id] = setTimeout(() => {
      this.commitLabelChange(node);
    }, 400);
  }

  deleteNode(node: Node) {
    if (node.data?.level === 0) {
      return;
    }

    if (
      confirm('Are you sure you want to delete this node and all its children?')
    ) {
      this.formArray = this.treeForm.terminator(this.formArray, node.id);
      this.updateGraphFromForm();
    }
  }

  commitLabelChange(node: Node) {
    const formNode = this.getFormNodeById(node.id);
    if (!formNode) return;

    const newLabel = this.draftLabels[node.id] || '';
    formNode.get('question')?.setValue(newLabel);

    const existing = this.nodes.find((n) => n.id === node.id);
    if (existing) existing.label = newLabel.trim() === '' ? ' ' : newLabel;

    this.cdRef.detectChanges();
  }

  markInvalidNodes() {
    this.nodes = this.nodes.map((node) => {
      const formNode = this.getFormNodeById(node.id);
      const isValid = formNode?.get('question')?.value?.trim() !== '';
      return { ...node, data: { ...node.data, isInvalid: !isValid } };
    });
  }

  validateTree(): boolean {
    const hasEmptyQuestions = this.formArray.controls.some(
      (ctrl) => !(ctrl.get('question')?.value || '').trim()
    );
    if (hasEmptyQuestions) {
      alert('All nodes must have a question!');
      return false;
    }

    const leafNodes = this.formArray.controls.filter((ctrl) => {
      return !ctrl.get('yes.nodeId')?.value && !ctrl.get('no.nodeId')?.value;
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
  asDir(dir: string): 'yes' | 'no' {
    return dir === 'yes' ? 'yes' : 'no';
  }
  logTreeStructure() {
    if (this.validateTree()) {
      console.log(
        'Valid Tree Structure:',
        JSON.stringify(this.formArray.value, null, 2)
      );
    }
  }
}
