import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'

export type ContextData = Map<ContextKey, unknown>

export enum ContextKey {
  UTILISATEUR = 'UTILISATEUR',
  RESULTAT_APPEL_PARTENAIRE = 'RESULTAT_APPEL_PARTENAIRE'
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

  get(): ContextData {
    return this.asyncLocalStorage.getStore() as ContextData
  }

  set(key: ContextKey, value: unknown): void {
    this.asyncLocalStorage.getStore()?.set(key, value)
  }
}
