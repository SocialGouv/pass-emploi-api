import { ListeDeDiffusion } from '../../src/domain/conseiller/liste-de-diffusion'
import { uneDatetime } from './date.fixture'
import { unJeune } from './jeune.fixture'
import { unConseiller } from './conseiller.fixture'

export const uneListeDeDiffusion = (
  args?: Partial<ListeDeDiffusion>
): ListeDeDiffusion => {
  const defaults: ListeDeDiffusion = {
    id: '921bdc43-692a-4a6d-b32b-8baf0d7b494e',
    titre: 'Liste de diffusion',
    dateDeCreation: uneDatetime(),
    idConseiller: unConseiller().id,
    beneficiaires: [
      {
        id: unJeune().id,
        dateAjout: uneDatetime(),
        estDansLePortefeuille: true
      }
    ]
  }

  return { ...defaults, ...args }
}
