import { ConseillerMilo } from '../../src/domain/milo/conseiller.milo'

export const unConseillerMilo = (
  args: Partial<ConseillerMilo> = {}
): ConseillerMilo => {
  const defaults: ConseillerMilo = {
    id: 'test',
    idStructure: '1'
  }
  return { ...defaults, ...args }
}
