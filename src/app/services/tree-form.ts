import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class TreeForm {
  constructor(private fb: FormBuilder) {}

  createNode(
    isRoot = false,
    direction: 'yes' | 'no' | null = null,
    existingIds: string[] = []
  ): FormGroup {
    let newId = uuid();
    while (existingIds.includes(newId)) {
      newId = uuid();
    }

    return this.fb.group({
      id: newId,
      question: this.fb.control('', Validators.required),
      isRoot: this.fb.control(isRoot),
      yes: this.fb.group({
        nodeId: this.fb.control(null),
        bandId: this.fb.control(null),
      }),
      no: this.fb.group({
        nodeId: this.fb.control(null),
        bandId: this.fb.control(null),
      }),
    });
  }

  getFormNodeById(nodes: FormArray, id: string): FormGroup | null {
    return (nodes.controls.find((ctrl) => ctrl.get('id')?.value === id) ||
      null) as FormGroup | null;
  }

  hasChild(nodes: FormArray, id: string, dir: 'yes' | 'no'): boolean {
    const node = this.getFormNodeById(nodes, id);
    return !!node?.get(dir)?.get('nodeId')?.value;
  }

  getBandId(nodes: FormArray, id: string, dir: 'yes' | 'no'): string | null {
    const node = this.getFormNodeById(nodes, id);
    return node?.get(dir)?.get('bandId')?.value || null;
  }

  hasBandSelected(
    nodes: FormArray,
    bandSelections: {
      nodeId: string;
      direction: 'yes' | 'no';
      bandId: string | null;
    }[],
    nodeId: string,
    direction: 'yes' | 'no'
  ): boolean {
    const node = this.getFormNodeById(nodes, nodeId);
    if (!node) return false;

    const formValue = node.get(direction)?.get('bandId')?.value;
    const selectionValue = bandSelections.find(
      (sel) => sel.nodeId === nodeId && sel.direction === direction
    )?.bandId;

    return !!formValue || !!selectionValue;
  }

  getLeafNodes(nodes: FormArray): FormGroup[] {
    return nodes.controls.filter((ctrl) => {
      return !ctrl.get('yes.nodeId')?.value && !ctrl.get('no.nodeId')?.value;
    }) as FormGroup[];
  }

  validateTreeNodes(nodes: FormArray) {
    for (const node of nodes.controls as FormGroup[]) {
      const yesChildId = node.get('yes')?.get('nodeId')?.value;
      const noChildId = node.get('no')?.get('nodeId')?.value;
      const yesBand = node.get('yes')?.get('bandId')?.value;
      const noBand = node.get('no')?.get('bandId')?.value;

      let hasError = false;
      if (!yesChildId && !yesBand) hasError = true;
      if (!noChildId && !noBand) hasError = true;

      if (hasError) {
        node.setErrors({ missingBand: true });
      } else {
        node.setErrors(null);
      }
    }
  }

  getQuestionText(nodes: FormArray, nodeId: string): string {
    const match = nodes.controls.find((i) => i.get('id')?.value === nodeId);
    return match?.get('question')?.value || '(Not Found)';
  }

  addChildNode(nodes: FormArray, parentIndex: number, direction: 'yes' | 'no') {
    const parent = nodes.at(parentIndex);
    const existingIds = nodes.controls.map((ctrl) => ctrl.get('id')?.value);
    const newChild = this.createNode(false, null, existingIds);

    nodes.push(newChild);

    const dirGroup = parent.get(direction) as FormGroup;
    dirGroup.get('nodeId')?.setValue(newChild.get('id')?.value);
    dirGroup.get('bandId')?.setValue(null);
  }

  terminator(nodes: FormArray, startNodeId: string): FormArray {
    const toDelete = [startNodeId];

    for (let i = 0; i < toDelete.length; i++) {
      const currentId = toDelete[i];
      const node = nodes.controls.find((n) => n.get('id')?.value === currentId);

      const yesId = node?.get('yes')?.get('nodeId')?.value;
      const noId = node?.get('no')?.get('nodeId')?.value;

      if (yesId && !toDelete.includes(yesId)) toDelete.push(yesId);
      if (noId && !toDelete.includes(noId)) toDelete.push(noId);
    }

    const remaining = nodes.controls
      .filter((ctrl) => !toDelete.includes(ctrl.get('id')?.value))
      .map((ctrl) => ctrl as FormGroup);

    for (const ctrl of remaining) {
      const yesNodeId = ctrl.get('yes')?.get('nodeId');
      const noNodeId = ctrl.get('no')?.get('nodeId');

      if (yesNodeId && toDelete.includes(yesNodeId.value)) {
        yesNodeId.setValue(null);
      }

      if (noNodeId && toDelete.includes(noNodeId.value)) {
        noNodeId.setValue(null);
      }
    }

    return new FormArray(remaining);
  }
}
