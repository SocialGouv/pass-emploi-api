import { unJeune } from '../../../fixtures/jeune.fixture'
import {
  PrestationDto,
  RendezVousPoleEmploiDto
} from '../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { fromPrestationDtoToRendezVousQueryModel } from '../../../../src/application/queries/query-mappers/rendez-vous-prestation.mappers'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { fromRendezVousDtoToRendezVousQueryModel } from '../../../../src/application/queries/query-mappers/rendez-vous-pole-emploi.mappers'
import { IdService } from '../../../../src/utils/id-service'

describe('RendezVousPrestationMappers', () => {
  let idService: StubbedClass<IdService>

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns('random-id')
  })
  describe('fromPrestationDtoToRendezVousQueryModel', () => {
    const jeune = unJeune()
    const dateString = '2014-03-24T09:00:00+01:00'
    const dateUTC = new Date('2014-03-24T09:00:00.000Z')

    const prestation: PrestationDto = {
      annule: false,
      datefin: dateString,
      session: {
        modalitePremierRendezVous: 'WEBCAM',
        dateDebut: dateString,
        dateFinPrevue: dateString,
        dateLimite: dateString,
        duree: {
          unite: 'JOUR',
          valeur: 1.0
        },
        typePrestation: {
          descriptifTypePrestation: 'desc'
        },
        enAgence: true,
        infoCollective: false,
        realiteVirtuelle: false
      }
    }

    it('retourne un RendezVousConseillerQueryModel avec le bon modele, la durée en jour et la date en UTC', async () => {
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, jeune, idService)

      // Then
      expect(RendezVousConseillerQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date: dateUTC,
        isLocaleDate: true,
        duration: 0,
        id: 'random-id',
        jeune: {
          id: 'ABCDE',
          nom: 'Doe',
          prenom: 'John'
        },
        modality: 'par visio',
        theme: undefined,
        telephone: undefined,
        organisme: undefined,
        description: 'desc',
        comment: undefined,
        adresse: undefined,
        title: '',
        type: {
          code: 'PRESTATION',
          label: 'Prestation'
        },
        visio: true,
        lienVisio: undefined
      })
    })
    it('retourne un RendezVousConseillerQueryModel avec la durée en heures', async () => {
      prestation.session.duree = {
        unite: 'HEURE',
        valeur: 1.5
      }
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, jeune, idService)
      // Then
      expect(RendezVousConseillerQueryModel.duration).to.equal(90)
    })
    it('retourne un RendezVousConseillerQueryModel avec la visio', async () => {
      //Given
      const lienVisio = 'visio'
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(
          prestation,
          jeune,
          idService,
          lienVisio
        )
      // Then
      expect(RendezVousConseillerQueryModel.lienVisio).to.equal(lienVisio)
    })
    it("retourne un RendezVousConseillerQueryModel avec l'adresse", async () => {
      // Given
      prestation.session.adresse = {
        adresseLigne1: 'ligne1',
        adresseLigne2: 'ligne2',
        codePostal: 'code postal',
        ville: 'ville'
      }
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, jeune, idService)
      // Then
      expect(RendezVousConseillerQueryModel.adresse).to.equal(
        'ligne1 ligne2 code postal ville'
      )
    })
    it('retourne un RendezVousConseillerQueryModel avec la description theme', async () => {
      prestation.session.themeAtelier = {
        libelle: 'theme',
        descriptif: 'descriptif'
      }
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, jeune, idService)
      // Then
      expect(RendezVousConseillerQueryModel.description).to.equal(
        'theme\ndescriptif'
      )
    })
    it('retourne un RendezVousConseillerQueryModel avec la description sous theme', async () => {
      prestation.session.sousThemeAtelier = {
        libelleSousThemeAtelier: 'sous theme',
        descriptifSousThemeAtelier: 'descriptif'
      }
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, jeune, idService)
      // Then
      expect(RendezVousConseillerQueryModel.description).to.equal(
        'sous theme\ndescriptif'
      )
    })
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
        id: 'id-inconnu',
        nom: 'Tavernier',
        prenom: 'Nils'
      })
    })
  })
})
