import {
  createStubInstance,
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

export type StubbedClass<T> = SinonStubbedInstance<T> & T
