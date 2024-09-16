import { AdvicesSelection } from '../advice/registry/advices-selection.model';

enum CompilationStatus {
  DONE = 'DONE',
  PENDING = 'PENDING',
}
export class _CompilationState {
  static readonly __providerName = '_CompilationState';
  static readonly Status = CompilationStatus;

  advices?: AdvicesSelection;
  status = CompilationStatus.DONE;
}
