import {
  DemarcheDto,
  DemarcheDtoEtat
} from '../../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { fromDemarcheDtoToDemarche } from '../../../../src/application/queries/query-mappers/actions-pole-emploi.mappers'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { Demarche } from '../../../../src/domain/demarche'
import { DateTime } from 'luxon'
import { DateService } from '../../../../src/utils/date-service'

describe('mappers', () => {
  describe('fromDemarcheDtoToDemarcheQueryModel', () => {
    let demarcheDto: DemarcheDto
    let dateService: StubbedClass<DateService>
    const stringUTC = '2020-04-06T10:20:00.000Z'
    const maintenant = new Date('2022-05-09T10:11:00+02:00')

    beforeEach(() => {
      dateService = stubClass(DateService)
      dateService.nowJs.returns(maintenant)
      dateService.now.returns(DateTime.fromJSDate(maintenant))
      dateService.fromISOStringToJSDate.returns(new Date(stringUTC))

      demarcheDto = {
        idDemarche: '198916488',
        etat: DemarcheDtoEtat.RE,
        dateDebut: '2022-05-09T08:11:00+02:00',
        dateFin: '2022-05-10T10:00:00+02:00',
        dateCreation: '2022-05-11T11:04:00+02:00',
        dateModification: '2021-11-29T11:04:00+01:00',
        origineCreateur: 'CONSEILLER',
        origineDemarche: 'PASS_EMPLOI',
        pourquoi: 'P01',
        libellePourquoi: 'Mon (nouveau) métier',
        quoi: 'Q01',
        libelleQuoi: 'Identification de ses points forts et de ses compétences',
        comment: 'C01.05',
        libelleComment: 'Par un autre moyen',
        libelleCourt: 'Identification de ses compétences avec pole-emploi.fr',
        libelleLong:
          'Identification de ses points forts et de ses compétences par un autre moyen',
        description: 'Candidature chez diffÃ©rents employeurs',
        nombre: 5,
        ou: 'pole-emploi.fr',
        metier: 'Agriculture',
        droitsDemarche: {}
      }
    })

    it('retourne un ActionPoleEmploiQueryModel avec contenu, statut realisée et date annulation', async () => {
      // When
      const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
      // Then
      expect(queryModel).to.deep.equal({
        attributs: [
          {
            cle: 'metier',
            label: 'Nom du métier',
            valeur: 'Agriculture'
          },
          {
            cle: 'description',
            label: 'Description',
            valeur: 'Candidature chez diffÃ©rents employeurs'
          },
          {
            cle: 'nombre',
            label: 'Nombre',
            valeur: 5
          },
          {
            cle: 'ou',
            label: 'Ou',
            valeur: 'pole-emploi.fr'
          }
        ],
        codeDemarche:
          'eyJxdW9pIjoiUTAxIiwicG91cnF1b2kiOiJQMDEiLCJjb21tZW50IjoiQzAxLjA1In0=',
        contenu: 'Identification de ses compétences avec pole-emploi.fr',
        creeeParConseiller: true,
        dateAnnulation: undefined,
        dateCreation: new Date('2020-04-06T10:20:00.000Z'),
        dateFin: new Date('2020-04-06T10:20:00.000Z'),
        dateModification: new Date('2020-04-06T10:20:00.000Z'),
        dateDebut: new Date('2020-04-06T10:20:00.000Z'),
        id: '198916488',
        label: 'Mon (nouveau) métier',
        modifieParConseiller: false,
        sousTitre: 'Par un autre moyen',
        statut: 'REALISEE',
        statutsPossibles: [],
        titre: 'Identification de ses points forts et de ses compétences'
      })
    })
    it('retourne statut annulée', async () => {
      // Given
      demarcheDto.etat = DemarcheDtoEtat.AN
      // When
      const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
      // Then
      expect(queryModel.statut).to.equal(Demarche.Statut.ANNULEE)
    })
    it('retourne statut en cours quand la date de début est avant maintenant à midi', async () => {
      // Given
      demarcheDto.etat = DemarcheDtoEtat.EC
      demarcheDto.dateFin = '2022-06-09T10:11:00+02:00'
      demarcheDto.dateDebut = '2022-05-09T08:11:00+02:00'
      // When
      const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
      // Then
      expect(queryModel.statut).to.equal(Demarche.Statut.EN_COURS)
    })
    it('retourne statut à faire', async () => {
      // Given
      demarcheDto.etat = DemarcheDtoEtat.AF
      demarcheDto.dateDebut = '2222-04-06T10:20:00+02:00'
      // When
      const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
      // Then
      expect(queryModel.statut).to.equal(Demarche.Statut.A_FAIRE)
    })
    it('retourne les attributs', async () => {
      // Given
      demarcheDto.organisme = 'pole emploi'
      demarcheDto.metier = 'Boulanger'
      demarcheDto.description = 'Le pain'
      demarcheDto.nombre = 4
      demarcheDto.contact = 'contact@contact.contact'
      // When
      const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
      // Then
      expect(queryModel.attributs).to.deep.equal([
        {
          cle: 'organisme',
          label: 'Nom de l’organisme',
          valeur: 'pole emploi'
        },
        {
          cle: 'metier',
          label: 'Nom du métier',
          valeur: 'Boulanger'
        },
        {
          cle: 'description',
          label: 'Description',
          valeur: 'Le pain'
        },
        {
          cle: 'nombre',
          label: 'Nombre',
          valeur: 4
        },
        {
          cle: 'contact',
          label: 'Contact',
          valeur: 'contact@contact.contact'
        },
        {
          cle: 'ou',
          label: 'Ou',
          valeur: 'pole-emploi.fr'
        }
      ])
    })
    describe('droits de modification', () => {
      it("autorise l'annulation", async () => {
        // Given
        demarcheDto.droitsDemarche!.annulation = true
        // When
        const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
        // Then
        expect(queryModel.statutsPossibles).to.deep.equal([
          Demarche.Statut.ANNULEE
        ])
      })
      it('autorise la réalisation', async () => {
        // Given
        demarcheDto.droitsDemarche!.realisation = true
        // When
        const queryModel = fromDemarcheDtoToDemarche(demarcheDto, dateService)
        // Then
        expect(queryModel.statutsPossibles).to.deep.equal([
          Demarche.Statut.REALISEE
        ])
      })
      describe('quand la modification est possible', () => {
        describe('quand la date de fin est dans le futur', () => {
          it('autorise a faire et en cours', async () => {
            // Given
            demarcheDto.etat = DemarcheDtoEtat.AC
            demarcheDto.droitsDemarche!.modificationDate = true
            // When
            const queryModel = fromDemarcheDtoToDemarche(
              demarcheDto,
              dateService
            )
            // Then
            expect(queryModel.statutsPossibles).to.deep.equal([
              Demarche.Statut.A_FAIRE,
              Demarche.Statut.EN_COURS
            ])
          })
        })

        describe('quand la date de fin est dans le passé', () => {
          it('autorise seulement à faire', async () => {
            // Given
            demarcheDto.etat = DemarcheDtoEtat.AC
            demarcheDto.droitsDemarche!.modificationDate = true
            demarcheDto.dateFin = DateTime.fromJSDate(maintenant)
              .minus({ day: 1 })
              .toString()
            // When
            const queryModel = fromDemarcheDtoToDemarche(
              demarcheDto,
              dateService
            )
            // Then
            expect(queryModel.statutsPossibles).to.deep.equal([
              Demarche.Statut.A_FAIRE
            ])
          })
        })
      })
    })
  })
})
