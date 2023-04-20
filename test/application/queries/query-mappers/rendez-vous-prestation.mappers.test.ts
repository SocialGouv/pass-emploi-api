import { PrestationDto } from '../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { fromPrestationDtoToRendezVousQueryModel } from '../../../../src/application/queries/query-mappers/rendez-vous-prestation.mappers'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { IdService } from '../../../../src/utils/id-service'
import { Core } from '../../../../src/domain/core'

describe('RendezVousPrestationMappers', () => {
  let idService: StubbedClass<IdService>

  beforeEach(() => {
    idService = stubClass(IdService)
    idService.uuid.returns('random-id')
  })
  describe('fromPrestationDtoToRendezVousQueryModel', () => {
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
        fromPrestationDtoToRendezVousQueryModel(prestation, idService)

      // Then
      expect(RendezVousConseillerQueryModel).to.deep.equal({
        agencePE: true,
        annule: false,
        idStable: undefined,
        date: dateUTC,
        isLocaleDate: true,
        duration: 0,
        id: 'random-id',
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
        lienVisio: undefined,
        source: Core.Structure.POLE_EMPLOI
      })
    })
    it('retourne un RendezVousConseillerQueryModel avec la durée en heures', async () => {
      prestation.session.duree = {
        unite: 'HEURE',
        valeur: 1.5
      }
      // When
      const RendezVousConseillerQueryModel =
        fromPrestationDtoToRendezVousQueryModel(prestation, idService)
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
        fromPrestationDtoToRendezVousQueryModel(prestation, idService)
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
        fromPrestationDtoToRendezVousQueryModel(prestation, idService)
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
        fromPrestationDtoToRendezVousQueryModel(prestation, idService)
      // Then
      expect(RendezVousConseillerQueryModel.description).to.equal(
        'sous theme\ndescriptif'
      )
    })
  })
})
