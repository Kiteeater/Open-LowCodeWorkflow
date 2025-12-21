export type WorkerMessageType = 'ping' | 'pong';

export interface WorkerMessage<T = unknown> {
  type: WorkerMessageType;
  payload?: T;
}
