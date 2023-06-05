import { ConseillerMilo } from '../../src/domain/milo/conseiller.milo'

export const unConseillerMilo = (
  args: Partial<ConseillerMilo> = {}
): ConseillerMilo => {
  const defaults: ConseillerMilo = {
    idStructure: '1'
  }
  return { ...defaults, ...args }
}
