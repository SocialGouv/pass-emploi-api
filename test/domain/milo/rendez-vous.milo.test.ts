import { Jeune } from '../../../src/domain/jeune/jeune'
import { RendezVousMilo } from '../../../src/domain/milo/rendez-vous.milo'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { IdService } from '../../../src/utils/id-service'
import { uneConfiguration, unJeune } from '../../fixtures/jeune.fixture'
import { unRendezVousMilo } from '../../fixtures/milo.fixture'
import {
  unJeuneDuRendezVous,
  unRendezVous
} from '../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('MiloRendezVous', () => {
  describe('Factory', () => {
    let idService: StubbedClass<IdService>
    let rendezVousFactory: RendezVousMilo.Factory

    let rdvMilo: RendezVousMilo
    let rendezVousPassEmploi: RendezVous
    let jeune: Jeune
    let uuid: string
    let dateStringRendezVousDebut: string
    let dateStringRendezVousFin: string
    let rendezVousObtenu: RendezVous

    const idJeune = 'id-jeune'
    const configuration = uneConfiguration({
      fuseauHoraire: 'America/Guadeloupe'
    })

    describe('creerRendezVousPassEmploi', () => {
      beforeEach(() => {
        // Given
        idService = stubClass(IdService)
        rendezVousFactory = new RendezVousMilo.Factory(idService)

        dateStringRendezVousDebut = '2022-10-06 10:07:00'
        dateStringRendezVousFin = '2022-10-06 11:43:00'
        jeune = unJeune({
          id: idJeune,
          configuration
        })
        uuid = 'de82d1fe-875c-11ed-a1eb-0242ac120002'
        idService.uuid.returns(uuid)
      })

      describe('les règles complexes', () => {
        beforeEach(() => {
          // Given
          rdvMilo = unRendezVousMilo({
            dateHeureDebut: dateStringRendezVousDebut,
            dateHeureFin: dateStringRendezVousFin
          })

          // When
          rendezVousObtenu = rendezVousFactory.createRendezVousCEJ(
            rdvMilo,
            jeune
          )
        })
        it('retourne un rendez-vous avec une date timezonée avec le fuseau du jeune', async () => {
          // Then
          expect(rendezVousObtenu.date).to.deep.equal(
            new Date('2022-10-06T14:07:00Z')
          )
        })
        it('retourne un rendez-vous avec une date timezonée Europe/Paris quand le jeune n’a pas de fuseau horaire', async () => {
          // Given
          jeune = unJeune({
            id: idJeune,
            configuration: uneConfiguration({ fuseauHoraire: undefined })
          })

          // When
          rendezVousObtenu = rendezVousFactory.createRendezVousCEJ(
            rdvMilo,
            jeune
          )
          // Then
          expect(rendezVousObtenu.date).to.deep.equal(
            new Date('2022-10-06T08:07:00Z')
          )
        })
        describe('durée', () => {
          it('retourne la durée en minutes quand la date de fin est renseignée', async () => {
            // Then
            expect(rendezVousObtenu.duree).to.deep.equal(96)
          })
          it("retourne 0 quand la date de fin n'est pas renseignée", async () => {
            // Given
            rdvMilo = unRendezVousMilo({
              dateHeureFin: undefined
            })
            // When
            rendezVousObtenu = rendezVousFactory.createRendezVousCEJ(
              rdvMilo,
              jeune
            )
            // Then
            expect(rendezVousObtenu.duree).to.deep.equal(0)
          })
        })
      })
      describe("quand c'est un rendez vous individuel", () => {
        beforeEach(() => {
          // Given
          rdvMilo = unRendezVousMilo({
            dateHeureDebut: dateStringRendezVousDebut,
            dateHeureFin: dateStringRendezVousFin
          })

          // When
          rendezVousObtenu = rendezVousFactory.createRendezVousCEJ(
            rdvMilo,
            jeune
          )
        })
        it('retourne un rendez-vous avec le type ENTRETIEN INDIVIDUEL ', async () => {
          // Then
          const expected: RendezVous = {
            id: uuid,
            source: RendezVous.Source.MILO,
            titre: rdvMilo.titre,
            sousTitre: '',
            date: new Date('2022-10-06T14:07:00Z'),
            duree: 96,
            jeunes: [
              unJeuneDuRendezVous({
                id: idJeune,
                configuration
              })
            ],
            type: CodeTypeRendezVous.RENDEZ_VOUS_MILO,
            presenceConseiller: true,
            modalite: rdvMilo.modalite,
            commentaire: rdvMilo.commentaire,
            informationsPartenaire: {
              type: 'RENDEZ_VOUS',
              id: rdvMilo.id
            },
            createur: { id: '', nom: '', prenom: '' },
            adresse: undefined
          }
          expect(rendezVousObtenu).to.deep.equal(expected)
        })
      })
      describe("quand c'est une session", () => {
        beforeEach(() => {
          // Given
          rdvMilo = unRendezVousMilo({
            dateHeureDebut: dateStringRendezVousDebut,
            dateHeureFin: dateStringRendezVousFin,
            adresse: 'Route de la plage, 97122 Baie-Mahault'
          })

          // When
          rendezVousObtenu = rendezVousFactory.createRendezVousCEJ(
            rdvMilo,
            jeune
          )
        })
        it('retourne un rendez-vous avec le type ENTRETIEN INDIVIDUEL ', async () => {
          // Then
          const expected: RendezVous = {
            id: uuid,
            source: RendezVous.Source.MILO,
            titre: rdvMilo.titre,
            sousTitre: '',
            date: new Date('2022-10-06T14:07:00Z'),
            duree: 96,
            jeunes: [
              unJeuneDuRendezVous({
                id: idJeune,
                configuration
              })
            ],
            type: CodeTypeRendezVous.RENDEZ_VOUS_MILO,
            presenceConseiller: true,
            adresse: rdvMilo.adresse,
            commentaire: rdvMilo.commentaire,
            informationsPartenaire: {
              type: 'RENDEZ_VOUS',
              id: rdvMilo.id
            },
            createur: { id: '', nom: '', prenom: '' },
            modalite: undefined
          }
          expect(rendezVousObtenu).to.deep.equal(expected)
        })
      })
    })
    describe('mettreAJourRendezVousPassEmploi', () => {
      beforeEach(() => {
        // Given
        idService = stubClass(IdService)
        rendezVousFactory = new RendezVousMilo.Factory(idService)
        dateStringRendezVousDebut = '2022-10-06 10:07:00'
        dateStringRendezVousFin = '2022-10-06 11:43:00'
        jeune = unJeune({
          id: idJeune,
          configuration
        })
        rendezVousPassEmploi = unRendezVous({
          id: 'un-id-pass-emploi-quoi',
          jeunes: [jeune]
        })
        uuid = 'de82d1fe-875c-11ed-a1eb-0242ac120002'
        idService.uuid.returns(uuid)
        rdvMilo = unRendezVousMilo({
          dateHeureDebut: dateStringRendezVousDebut,
          dateHeureFin: dateStringRendezVousFin,
          statut: 'Absent'
        })

        // When
        rendezVousObtenu = rendezVousFactory.updateRendezVousCEJ(
          rendezVousPassEmploi,
          rdvMilo
        )
      })
      it('retourne un rendez-vous avec le type ENTRETIEN INDIVIDUEL ', async () => {
        // Then
        const expected: RendezVous = {
          ...rendezVousPassEmploi,
          jeunes: [
            {
              id: jeune.id,
              firstName: jeune.firstName,
              lastName: jeune.lastName,
              email: jeune.email,
              configuration: jeune.configuration,
              conseiller: jeune.conseiller,
              preferences: jeune.preferences,
              present: false
            }
          ],
          titre: rdvMilo.titre,
          date: new Date('2022-10-06T14:07:00Z'),
          duree: 96,
          modalite: rdvMilo.modalite,
          commentaire: rdvMilo.commentaire,
          adresse: undefined
        }
        expect(rendezVousObtenu).to.deep.equal(expected)
      })
    })
  })
})
