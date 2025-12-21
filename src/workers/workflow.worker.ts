import * as Comlink from 'comlink';

export class WorkflowEngine {
  public testConnection(name: string): string {
    return `Hello ${name} from Worker`;
  }
}

Comlink.expose(new WorkflowEngine());
