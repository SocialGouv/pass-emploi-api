import { ConseillerMilo } from '../../src/domain/milo/conseiller.milo.db'
import { unConseiller } from './conseiller.fixture'

export const unConseillerMilo = (
  args: Partial<ConseillerMilo> = {}
): ConseillerMilo => {
  const defaults: ConseillerMilo = {
    ...unConseiller(),
    id: 'test',
    structureMilo: { id: '1', timezone: 'America/Cayenne' }
  }
  return { ...defaults, ...args }
}
