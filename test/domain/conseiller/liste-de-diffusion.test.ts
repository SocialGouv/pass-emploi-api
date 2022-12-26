import { ListeDeDiffusion } from '../../../src/domain/conseiller/liste-de-diffusion'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneListeDeDiffusion } from '../../fixtures/liste-de-diffusion.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'

describe(' ListeDeDiffusion', () => {
  let factory: ListeDeDiffusion.Factory
  let service: ListeDeDiffusion.Service
  let repository: StubbedType<ListeDeDiffusion.Repository>
  const maintenant = uneDatetime()

  beforeEach(() => {
    const idService: StubbedClass<IdService> = stubClass(IdService)
    idService.uuid.returns('un-uuid')
    const dateService: StubbedClass<DateService> = stubClass(DateService)
    dateService.now.returns(maintenant)
    factory = new ListeDeDiffusion.Factory(idService, dateService)
    repository = stubInterface(createSandbox())
    service = new ListeDeDiffusion.Service(dateService, repository)
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
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }
        ],
        dateDeCreation: maintenant
      })
    })
  })

  describe('mettreAJour', () => {
    it('met à jour le titre', () => {
      // Given
      const listeDeDiffusionInitiale = uneListeDeDiffusion()

      // When
      const listeDeDiffusionMiseAJour = service.mettreAJour(
        listeDeDiffusionInitiale,
        {
          titre: 'un nouveau titre',
          idsBeneficiaires: listeDeDiffusionInitiale.beneficiaires.map(
            beneficiaire => beneficiaire.id
          )
        }
      )

      // Then
      expect(listeDeDiffusionMiseAJour).to.deep.equal({
        ...listeDeDiffusionInitiale,
        titre: 'un nouveau titre'
      })
    })
    it('enlève un bénéficiaire', () => {
      // Given
      const listeDeDiffusionInitiale = uneListeDeDiffusion()

      // When
      const listeDeDiffusionMiseAJour = service.mettreAJour(
        listeDeDiffusionInitiale,
        {
          titre: listeDeDiffusionInitiale.titre,
          idsBeneficiaires: []
        }
      )

      // Then
      expect(listeDeDiffusionMiseAJour).to.deep.equal({
        ...listeDeDiffusionInitiale,
        beneficiaires: []
      })
    })
    it('ajoute un bénéficiaire', () => {
      // Given
      const listeDeDiffusionInitiale = uneListeDeDiffusion()

      // When
      const listeDeDiffusionMiseAJour = service.mettreAJour(
        listeDeDiffusionInitiale,
        {
          titre: listeDeDiffusionInitiale.titre,
          idsBeneficiaires: [unJeune().id, 'un-autre-id']
        }
      )

      // Then
      const expected: ListeDeDiffusion = {
        ...listeDeDiffusionInitiale,
        beneficiaires: [
          {
            id: unJeune().id,
            dateAjout: maintenant,
            estDansLePortefeuille: true
          },
          {
            id: 'un-autre-id',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }
        ]
      }
      expect(listeDeDiffusionMiseAJour).to.deep.equal(expected)
    })
  })

  describe('enleverLesJeunesDuConseiller', () => {
    it("enlève les jeunes des listes de diffusion d'un conseiller", async () => {
      // Given
      const listeDeDiffusion = uneListeDeDiffusion({
        id: 'une-liste-de-diffusion-1',
        beneficiaires: [
          {
            id: 'un-id-beneficiaire-1',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          },
          {
            id: 'un-id-beneficiaire-2',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }
        ]
      })
      repository.findAllByConseiller
        .withArgs('un-id-conseiller')
        .resolves([listeDeDiffusion])

      // When
      await service.enleverLesJeunesDuConseiller('un-id-conseiller', [
        'un-id-beneficiaire-1'
      ])

      // Then
      const listeDeDiffusionSansLeBeneficiaire1 = uneListeDeDiffusion({
        id: 'une-liste-de-diffusion-1',
        beneficiaires: [
          {
            id: 'un-id-beneficiaire-2',
            dateAjout: maintenant,
            estDansLePortefeuille: true
          }
        ]
      })
      expect(repository.save).to.have.been.calledWith(
        listeDeDiffusionSansLeBeneficiaire1
      )
    })
  })
})
