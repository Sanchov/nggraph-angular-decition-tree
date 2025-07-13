import { ControlAsFormControlPipe } from './casting-form-control-pipe';

describe('CastingFormControlPipePipe', () => {
  it('create an instance', () => {
    const pipe = new ControlAsFormControlPipe();
    expect(pipe).toBeTruthy();
  });
});
