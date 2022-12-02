import { ListeDeDiffusion } from '../../../src/domain/conseiller/liste-de-diffusion'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneDatetime } from '../../fixtures/date.fixture'

describe(' ListeDeDiffusion', () => {
  let factory: ListeDeDiffusion.Factory
  const maintenant = uneDatetime()

  beforeEach(() => {
    const idService: StubbedClass<IdService> = stubClass(IdService)
    idService.uuid.returns('un-uuid')
    const dateService: StubbedClass<DateService> = stubClass(DateService)
    dateService.now.returns(maintenant)
    factory = new ListeDeDiffusion.Factory(idService, dateService)
  })

  describe('creer', () => {
    it('crée une list de diffusion', () => {
      // Given
      const infosCreation: ListeDeDiffusion.InfosCreation = {
        titre: 'une liste de diffusion',
        idConseiller: 'un-id-conseiller',
        idsBeneficiaires: ['un-id-beneficiaire']
      }

      // When
      const listeDeDiffusion = factory.creer(infosCreation)

      // Then
      expect(listeDeDiffusion).to.deep.equal({
        id: 'un-uuid',
        titre: 'une liste de diffusion',
        idConseiller: 'un-id-conseiller',
        beneficiaires: [
          {
            id: 'un-id-beneficiaire',
            dateAjout: maintenant
          }
        ],
        dateDeCreation: maintenant
      })
    })
  })
})
