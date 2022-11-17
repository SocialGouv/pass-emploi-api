import {
  CodeTypeRendezVous,
  InfosRendezVousACreer,
  RendezVous
} from 'src/domain/rendez-vous/rendez-vous'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, stubClass } from '../../utils'

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
})
