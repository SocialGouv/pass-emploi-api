import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import {
  CodeTypeRendezVous,
  InfosRendezVousACreer,
  RendezVous
} from 'src/domain/rendez-vous/rendez-vous'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { DateService } from '../../src/utils/date-service'
import {
  uneAnimationCollective,
  unJeuneDuRendezVous,
  unRendezVous
} from '../fixtures/rendez-vous.fixture'
import { createSandbox, expect, stubClass } from '../utils'
import { failure, success } from '../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../src/building-blocks/types/domain-error'

describe('Rendez-vous', () => {
  const id = '26279b34-318a-45e4-a8ad-514a1090462c'
  const idService = stubClass(IdService)
  idService.uuid.returns(id)

  describe('createRendezVousConseiller', () => {
    describe('quand le type est autre que animation collective', () => {
      // Given
      const infosRdv: InfosRendezVousACreer = {
        idsJeunes: ['1'],
        idConseiller: '41',
        commentaire: '',
        date: uneDatetime().toJSDate().toISOString(),
        duree: 10
      }
      const conseiller = unConseiller()

      // When
      const rendezVous = RendezVous.createRendezVousConseiller(
        infosRdv,
        [unJeune()],
        conseiller,
        idService
      )

      it('renvoie un rdv avec titre et sousTitre', async () => {
        expect(rendezVous.sousTitre).to.equal('avec Nils')
        expect(rendezVous.titre).to.equal('Rendez-vous conseiller')
      })
      it('renvoie un rdv avec type par défaut', async () => {
        expect(rendezVous.type).to.equal(
          CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
        )
      })
      it('renvoie un rdv avec presenceConseiller par défaut', async () => {
        expect(rendezVous.presenceConseiller).to.equal(true)
      })
      it('renvoie un rdv avec le bon créateur', async () => {
        expect(rendezVous.createur).to.deep.equal({
          id: conseiller.id,
          nom: conseiller.lastName,
          prenom: conseiller.firstName
        })
      })
    })
    describe('quand le type est animation collective', () => {
      // Given
      const infosRdv: InfosRendezVousACreer = {
        idsJeunes: ['1'],
        idConseiller: '41',
        commentaire: '',
        date: uneDatetime().toJSDate().toISOString(),
        duree: 10,
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
      }
      const conseiller = unConseiller({ agence: { id: 'test' } })

      // When
      const rendezVous = RendezVous.createRendezVousConseiller(
        infosRdv,
        [unJeune()],
        conseiller,
        idService
      )

      it('renvoie un rdv avec agence', async () => {
        expect(rendezVous.idAgence).to.equal('test')
      })
    })
  })

  describe('AnimationCollective.Service', () => {
    const maintenant = uneDatetime()
    let service: RendezVous.AnimationCollective.Service
    let repository: StubbedType<RendezVous.AnimationCollective.Repository>
    let rdvRepository: StubbedType<RendezVous.Repository>
    let dateService: StubbedType<DateService>

    beforeEach(() => {
      const sandbox = createSandbox()
      repository = stubInterface(sandbox)
      rdvRepository = stubInterface(sandbox)
      dateService = stubClass(DateService)
      dateService.now.returns(maintenant)
      service = new RendezVous.AnimationCollective.Service(
        repository,
        dateService
      )
    })

    describe('desinscrire', () => {
      it('récupère les animations collectives à venir et désinscrit les jeunes concernés', async () => {
        // Given
        const idsJeunes = ['1']
        const uneAnimationCollectiveInitiale = unRendezVous({
          type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
          jeunes: [unJeune({ id: '1' }), unJeune({ id: '2' })]
        })
        repository.getAllAVenir
          .withArgs('nantes')
          .resolves([uneAnimationCollectiveInitiale])

        // When
        await service.desinscrire(idsJeunes, 'nantes')

        // Then
        const uneAnimationCollectiveMiseAJour = unRendezVous({
          type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
          jeunes: [unJeune({ id: '2' })]
        })
        expect(rdvRepository.save).to.have.been.calledWithExactly(
          uneAnimationCollectiveMiseAJour
        )
      })
    })

    describe('cloturer', () => {
      describe("quand l'animation collective est dans le futur", () => {
        it('renvoie une erreur', () => {
          // Given
          const animationCollective = uneAnimationCollective({
            date: maintenant.plus({ days: 1 }).toJSDate()
          })

          // When
          const result = service.cloturer(animationCollective, ['jeune-id'])

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError(
                "L'animation collective n'est pas encore passée."
              )
            )
          )
        })
      })
      describe("quand l'animation collective est déjà cloturée", () => {
        it('renvoie une erreur', () => {
          // Given
          const animationCollective = uneAnimationCollective({
            date: maintenant.minus({ days: 5 }).toJSDate(),
            dateCloture: maintenant.minus({ days: 1 })
          })

          // When
          const result = service.cloturer(animationCollective, ['jeune-id'])

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError('Animation Collective déjà cloturée.')
            )
          )
        })
      })

      describe('quand la cloture est possible', () => {
        describe('quand tout le monde est présent', () => {
          it('retourne une animation collective cloturée avec tous les jeunes inscrits', async () => {
            // Given

            const jeunePresent = unJeuneDuRendezVous({ id: '1' })
            const jeune2Present = unJeuneDuRendezVous({ id: '2' })
            const animationCollective = uneAnimationCollective({
              date: maintenant.minus({ days: 1 }).toJSDate(),
              jeunes: [jeune2Present, jeunePresent],
              dateCloture: undefined
            })

            // When
            const animationCollectiveCloturee = service.cloturer(
              animationCollective,
              [jeunePresent.id, jeune2Present.id]
            )

            // Then
            expect(animationCollectiveCloturee).to.deep.equal(
              success({
                ...animationCollective,
                dateCloture: maintenant,
                jeunes: [
                  { ...jeune2Present, present: true },
                  { ...jeunePresent, present: true }
                ]
              })
            )
          })
        })
        describe('quand un des jeunes est absent', () => {
          it('retourne une animation collective cloturée avec seulement le jeune inscrit', async () => {
            // Given

            const jeunePresent = unJeuneDuRendezVous({ id: '1' })
            const jeuneAbsent = unJeuneDuRendezVous({ id: '2' })
            const animationCollective = uneAnimationCollective({
              date: maintenant.minus({ days: 1 }).toJSDate(),
              jeunes: [jeuneAbsent, jeunePresent],
              dateCloture: undefined
            })

            // When
            const animationCollectiveCloturee = service.cloturer(
              animationCollective,
              [jeunePresent.id]
            )

            // Then
            expect(animationCollectiveCloturee).to.deep.equal(
              success({
                ...animationCollective,
                dateCloture: maintenant,
                jeunes: [
                  { ...jeuneAbsent, present: false },
                  { ...jeunePresent, present: true }
                ]
              })
            )
          })
        })
      })
    })
  })
})
