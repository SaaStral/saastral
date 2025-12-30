export interface JobQueueInterface {
  enqueue(taskName: string, payload: Record<string, unknown>): Promise<void>
  enqueueAt(taskName: string, payload: Record<string, unknown>, runAt: Date): Promise<void>
}
