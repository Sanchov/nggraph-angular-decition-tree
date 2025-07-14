import { Component, inject, Input } from '@angular/core';
import {
  FormArray,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { TreeForm } from '../services/tree-form';
import { ControlAsFormControlPipe } from '../pipes/casting-form-control-pipe';
import { BANDS_LIST } from '../models/Bands_List';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    NgIf,
    ControlAsFormControlPipe,
    NgForOf,
  ],
  templateUrl: './node.component.ts.html',
  styleUrl: './node.component.ts.scss',
})
export class NodeComponent {
  @Input() node!: FormGroup;
  @Input() allNodes!: FormArray;
  bandlist = BANDS_LIST;
  treeForm = inject(TreeForm);
  showYesBandDropdown = false;
  showNoBandDropdown = false;

  @Input() validationErrors: Record<string, string[]> = {};

  get nodeErrors(): string[] {
    const nodeId = this.node.get('id')?.value;
    return this.validationErrors[nodeId] || [];
  }

  toggleBandDropdown(direction: 'yes' | 'no') {
    if (direction === 'yes') {
      this.showYesBandDropdown = !this.showYesBandDropdown;

      if (this.showYesBandDropdown) {
        this.clearNodeId('yes');
      }
    } else {
      this.showNoBandDropdown = !this.showNoBandDropdown;

      if (this.showNoBandDropdown) {
        this.clearNodeId('no');
      }
    }
  }

  hasConnection(direction: 'yes' | 'no'): boolean {
    const band = this.getBandControl(direction).value;
    const nodeId = this.node.get(direction)?.get('nodeId')?.value;
    return !!band || !!nodeId;
  }

  deleteNode() {
    const updated = this.treeForm.terminator(
      this.allNodes,
      this.node.get('id')?.value
    );
    this.allNodes.clear();
    updated.controls.forEach((ctrl) => this.allNodes.push(ctrl));
  }
  getYesChild(): FormGroup | null {
    const id = this.node.get('yes')?.get('nodeId')?.value;
    return this.getNodeById(id) as FormGroup | null;
  }

  getNoChild(): FormGroup | null {
    const id = this.node.get('no')?.get('nodeId')?.value;
    return this.getNodeById(id);
  }

  private getNodeById(id: string | null): FormGroup | null {
    return (
      (this.allNodes.controls.find(
        (ctrl) => ctrl.get('id')?.value === id
      ) as FormGroup) || null
    );
  }
  hoveredBranch: 'yes' | 'no' | null = null;

  // Add these methods if you want hover effects
  onBranchHover(direction: 'yes' | 'no') {
    this.hoveredBranch = direction;
  }

  onBranchLeave() {
    this.hoveredBranch = null;
  }

  addChild(direction: 'yes' | 'no') {
    const index = this.allNodes.controls.indexOf(this.node);
    this.treeForm.addChildNode(this.allNodes, index, direction);
  }

  getBandControl(direction: 'yes' | 'no'): FormControl {
    return this.node.get(direction)?.get('bandId') as FormControl;
  }

  clearNodeId(direction: 'yes' | 'no') {
    this.node.get(direction)?.get('nodeId')?.setValue(null);
  }
}
