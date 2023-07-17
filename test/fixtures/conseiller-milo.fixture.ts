import { ConseillerMilo } from '../../src/domain/milo/conseiller.milo'

export const unConseillerMilo = (
  args: Partial<ConseillerMilo> = {}
): ConseillerMilo => {
  const defaults: ConseillerMilo = {
    id: 'test',
    structure: { id: '1', timezone: 'America/Cayenne' }
  }
  return { ...defaults, ...args }
}
