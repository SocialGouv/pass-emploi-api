import { RedisClientType } from 'redis'
import {
  createStubInstance,
  SinonSandbox,
  SinonStubbedInstance,
  SinonStubbedMember,
  StubbableType
} from 'sinon'

export function stubClass<T>(
  constructor: StubbableType<T>,
  overrides?: { [K in keyof T]?: SinonStubbedMember<T[K]> }
): StubbedClass<T> {
  const stub = createStubInstance<T>(constructor, overrides)
  return stub as unknown as StubbedClass<T>
}

export function stubClassSandbox<T>(
  constructor: StubbableType<T>,
  sandbox: SinonSandbox,
  overrides?: { [K in keyof T]?: SinonStubbedMember<T[K]> }
): StubbedClass<T> {
  const stub = sandbox.createStubInstance<T>(constructor, overrides)
  return stub as unknown as StubbedClass<T>
}

export type StubbedClass<T> = SinonStubbedInstance<T> & T

export type RedisClient = RedisClientType
