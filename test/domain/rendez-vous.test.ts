import {
  CodeTypeRendezVous,
  InfosRendezVousACreer,
  RendezVous
} from 'src/domain/rendez-vous'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { createSandbox, expect, stubClass } from '../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { unRendezVous } from '../fixtures/rendez-vous.fixture'

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
    let service: RendezVous.AnimationCollective.Service
    let repository: StubbedType<RendezVous.AnimationCollective.Repository>

    beforeEach(() => {
      const sandbox = createSandbox()
      repository = stubInterface(sandbox)
      service = new RendezVous.AnimationCollective.Service(repository)
    })

    describe('desinscrire', () => {
      it('récupère les animations collectives à venir et désinscrit les jeunes', async () => {
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
        expect(repository.save).to.have.been.calledWithExactly(
          uneAnimationCollectiveMiseAJour
        )
      })
    })
  })
})
