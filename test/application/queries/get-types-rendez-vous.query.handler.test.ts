import { expect } from 'chai'
import { SinonSandbox } from 'sinon'
import { GetTypesRendezVousQueryHandler } from 'src/application/queries/rendez-vous/get-types-rendez-vous.query.handler'
import {
  CategorieRendezVous,
  CodeTypeRendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { createSandbox } from '../../utils'

describe('GetTypesRendezVousQueryHandler', () => {
  let getTypesRendezVousQueryHandler: GetTypesRendezVousQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    getTypesRendezVousQueryHandler = new GetTypesRendezVousQueryHandler()
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    it('renvoie la liste des types de rendez-vous', async () => {
      // Given - When
      const result = await getTypesRendezVousQueryHandler.handle({})

      // Then
      expect(result).to.deep.equal([
        {
          code: CodeTypeRendezVous.ACTIVITE_EXTERIEURES,
          label: 'Activités extérieures',
          categorie: CategorieRendezVous.CEJ_RDV
        },
        {
          code: CodeTypeRendezVous.ATELIER,
          label: 'Atelier',
          categorie: CategorieRendezVous.CEJ_AC
        },
        {
          code: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
          label: 'Entretien individuel conseiller',
          categorie: CategorieRendezVous.CEJ_RDV
        },
        {
          code: CodeTypeRendezVous.ENTRETIEN_PARTENAIRE,
          label: 'Entretien par un partenaire',
          categorie: CategorieRendezVous.CEJ_RDV
        },
        {
          code: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
          label: 'Information collective',
          categorie: CategorieRendezVous.CEJ_AC
        },
        {
          code: CodeTypeRendezVous.VISITE,
          label: 'Visite',
          categorie: CategorieRendezVous.CEJ_RDV
        },
        {
          code: CodeTypeRendezVous.PRESTATION,
          label: 'Prestation',
          categorie: CategorieRendezVous.CEJ_RDV
        },
        {
          code: CodeTypeRendezVous.AUTRE,
          label: 'Autre',
          categorie: CategorieRendezVous.CEJ_RDV
        }
      ])
    })
  })
})
