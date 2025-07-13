import { TestBed } from '@angular/core/testing';

import { TreeForm } from './tree-form';

describe('TreeForm', () => {
  let service: TreeForm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TreeForm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
