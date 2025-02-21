import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'

export type ContextData = Map<ContextKey, unknown>

export enum ContextKey {
  UTILISATEUR = 'UTILISATEUR'
}

@Injectable()
export class Context {
  private asyncLocalStorage: AsyncLocalStorage<ContextData>

  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage()
  }

  start(): void {
    this.asyncLocalStorage.enterWith(new Map<ContextKey, unknown>())
  }

  get<T>(key: ContextKey): T | undefined {
    return this.asyncLocalStorage.getStore()?.get(key) as T
  }

  set(key: ContextKey, value: unknown): void {
    this.asyncLocalStorage.getStore()?.set(key, value)
  }
}
