// Fire-and-forget async task queue. Runs tasks sequentially in the background
// without blocking the API response. Survives per server instance.
// For distributed / durable queues: swap this for Inngest or Supabase pg_cron.

import { logger } from './logger'

type Task = { name: string; fn: () => Promise<void> }

class BackgroundQueue {
  private queue: Task[] = []
  private busy = false

  enqueue(name: string, fn: () => Promise<void>): void {
    this.queue.push({ name, fn })
    if (!this.busy) void this.drain()
  }

  private async drain(): Promise<void> {
    this.busy = true
    while (this.queue.length > 0) {
      const task = this.queue.shift()!
      try {
        await task.fn()
        logger.info('[queue] task done', { task: task.name })
      } catch (err) {
        logger.error('[queue] task failed', { task: task.name, err: String(err) })
      }
    }
    this.busy = false
  }
}

export const queue = new BackgroundQueue()
