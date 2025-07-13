// control-as-form-control.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';

@Pipe({
  name: 'controlAsFormControl',
  standalone: true,
})
export class ControlAsFormControlPipe implements PipeTransform {
  transform(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }
}
