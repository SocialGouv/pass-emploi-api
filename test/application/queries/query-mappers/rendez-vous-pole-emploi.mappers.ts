import { unJeune } from '../../../fixtures/jeune.fixture'
import { RendezVousPoleEmploiDto } from '../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { fromRendezVousDtoToRendezVousQueryModel } from '../../../../src/application/queries/query-mappers/rendez-vous-pole-emploi.mappers'
import { IdService } from '../../../../src/utils/id-service'

describe('RendezVousPrestationMappers', () => {
  let idService: StubbedClass<IdService>

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns('random-id')
  })

  describe('fromRendezVousPoleEmploiDtoToRendezVousQueryModel', () => {
    const jeune = unJeune()
    const dateString = '2020-04-06'
    const heure = '12:20'
    const dateUTC = new Date('2020-04-06T12:20:00.000Z')

    const rendezVousPoleEmploiDto: RendezVousPoleEmploiDto = {
      theme: 'theme',
      date: dateString,
      heure,
      duree: 23,
      modaliteContact: 'VISIO',
      agence: 'Agence',
      adresse: {
        bureauDistributeur: 'bureau',
        ligne4: '12 rue Albert Camus',
        ligne5: '75018',
        ligne6: 'Paris'
      },
      commentaire: 'commentaire',
      typeRDV: 'RDVL',
      lienVisio: 'lien'
    }

    it("retourne un RendezVousConseillerQueryModel avec la modalité visio, l'adresse et la date", async () => {
      // When
      const RendezVousConseillerQueryModel =
        fromRendezVousDtoToRendezVousQueryModel(
          rendezVousPoleEmploiDto,
          jeune,
          idService
        )

      // Then
      expect(RendezVousConseillerQueryModel).to.deep.equal({
        agencePE: false,
        date: dateUTC,
        isLocaleDate: true,
        duration: 23,
        id: 'random-id',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: 'par visio',
        theme: 'theme',
        conseiller: undefined,
        presenceConseiller: true,
        comment: 'commentaire',
        adresse: '12 rue Albert Camus 75018 Paris',
        title: '',
        type: {
          code: 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
          label: 'Entretien individuel conseiller'
        },
        visio: true,
        lienVisio: 'lien'
      })
    })
    it('retourne un RendezVousConseillerQueryModel avec la modalité agence, et le conseiller', async () => {
      // Given
      rendezVousPoleEmploiDto.modaliteContact = 'AGENCE'
      rendezVousPoleEmploiDto.nomConseiller = 'Tavernier'
      rendezVousPoleEmploiDto.prenomConseiller = 'Nils'
      // When
      const RendezVousConseillerQueryModel =
        fromRendezVousDtoToRendezVousQueryModel(
          rendezVousPoleEmploiDto,
          jeune,
          idService
        )
      // Then
      expect(RendezVousConseillerQueryModel.agencePE).to.equal(true)
      expect(RendezVousConseillerQueryModel.modality).to.equal(
        'en agence Pôle emploi'
      )
      expect(RendezVousConseillerQueryModel.conseiller).to.deep.equal({
        id: 'random-id',
        nom: 'Tavernier',
        prenom: 'Nils'
      })
    })
  })
})
