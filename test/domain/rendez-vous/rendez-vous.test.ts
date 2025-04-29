import { DateTime } from 'luxon'
import {
  CodeTypeRendezVous,
  InfosRendezVousACreer,
  RendezVous
} from 'src/domain/rendez-vous/rendez-vous'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unConseillerDuJeune, unJeune } from 'test/fixtures/jeune.fixture'
import {
  ConseillerSansAgenceError,
  DateNonAutoriseeError,
  JeuneNonLieALAgenceError,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { DateService } from '../../../src/utils/date-service'
import {
  unJeuneDuRendezVous,
  unRendezVous
} from '../../fixtures/rendez-vous.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'

describe('Rendez-vous', () => {
  const id = '26279b34-318a-45e4-a8ad-514a1090462c'
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>

  describe('Factory', () => {
    let factory: RendezVous.Factory

    beforeEach(() => {
      idService = stubClass(IdService)
      idService.uuid.returns(id)
      dateService = stubClass(DateService)
      dateService.now.returns(uneDatetime())
      factory = new RendezVous.Factory(idService, dateService)
    })

    describe('creer', () => {
      describe('quand le type est autre que animation collective', () => {
        describe('quand on renseigne un nombre maximum de participants', () => {
          it('rejette avec une MauvaiseCommandeError', async () => {
            // Given
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: uneDatetime().toJSDate().toISOString(),
              duree: 10,
              type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
              nombreMaxParticipants: 1
            }
            const conseiller = unConseiller({
              agence: { id: 'test' }
            })

            // When
            const result = factory.creer(
              infosRdv,
              [unJeune({ id: '1' })],
              conseiller
            )

            // Then
            expect(!result._isSuccess && result.error).to.be.an.instanceOf(
              MauvaiseCommandeError
            )
          })
        })
        describe('quand tout est bon', () => {
          it('crée un rdv', async () => {
            // Given
            const dateAujourdhui = new Date()
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: dateAujourdhui.toISOString(),
              duree: 10
            }
            const conseiller = unConseiller()

            // When
            const result = factory.creer(infosRdv, [unJeune()], conseiller)

            // Then
            expect(isSuccess(result) && result.data).to.deep.equal({
              adresse: undefined,
              commentaire: '',
              createur: {
                id: '1',
                nom: 'Tavernier',
                prenom: 'Nils'
              },
              date: dateAujourdhui,
              duree: 10,
              id: '26279b34-318a-45e4-a8ad-514a1090462c',
              source: RendezVous.Source.PASS_EMPLOI,
              idAgence: undefined,
              invitation: undefined,
              jeunes: [unJeune()],
              modalite: undefined,
              organisme: undefined,
              precision: undefined,
              presenceConseiller: true,
              sousTitre: 'avec Nils',
              titre: 'Rendez-vous conseiller',
              type: 'ENTRETIEN_INDIVIDUEL_CONSEILLER',
              nombreMaxParticipants: undefined
            })
          })
        })
      })
      describe('quand le type est animation collective', () => {
        describe('quand le conseiller a une agence ', () => {
          describe('quand le nombre de participants est supérieur à la limite', () => {
            it('rejette avec une MauvaiseCommandeError', async () => {
              // Given
              const infosRdv: InfosRendezVousACreer = {
                idsJeunes: ['1'],
                idConseiller: '41',
                commentaire: '',
                date: uneDatetime().toJSDate().toISOString(),
                duree: 10,
                type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
                nombreMaxParticipants: 1
              }
              const conseiller = unConseiller({
                agence: { id: 'test' }
              })

              // When
              const result = factory.creer(
                infosRdv,
                [unJeune(), unJeune()],
                conseiller
              )

              // Then
              expect(!result._isSuccess && result.error).to.be.an.instanceOf(
                MauvaiseCommandeError
              )
            })
          })
          describe('quand tout est bon', () => {
            it('renvoie un rdv avec agence', async () => {
              // Given
              const dateAujourdhui = new Date()
              const infosRdv: InfosRendezVousACreer = {
                idsJeunes: ['1'],
                idConseiller: '41',
                commentaire: '',
                date: dateAujourdhui.toISOString(),
                duree: 10,
                type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
              }
              const conseiller = unConseiller({ agence: { id: 'test' } })
              const unJeuneDuConseiller = unJeune({
                conseiller: {
                  id: conseiller.id,
                  firstName: conseiller.firstName,
                  lastName: conseiller.lastName,
                  email: conseiller.email,
                  idAgence: 'test'
                }
              })

              // When
              const result = factory.creer(
                infosRdv,
                [unJeuneDuConseiller],
                conseiller
              )

              // Then
              expect(isSuccess(result) && result.data.idAgence).to.equal('test')
            })
          })
        })
        describe("quand le conseiller n'a pas d'agence", () => {
          it('renvoie une failure', async () => {
            // Given
            const dateAujourdhui = new Date()
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: dateAujourdhui.toISOString(),
              duree: 10,
              type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
            }
            const conseiller = unConseiller({ agence: undefined })
            const unJeuneDuConseiller = unJeune({
              conseiller: {
                id: conseiller.id,
                firstName: conseiller.firstName,
                lastName: conseiller.lastName,
                email: conseiller.email,
                idAgence: undefined
              }
            })

            // When
            const result = factory.creer(
              infosRdv,
              [unJeuneDuConseiller],
              conseiller
            )

            // Then
            expect(result).to.deep.equal(
              failure(new ConseillerSansAgenceError(conseiller.id))
            )
          })
        })
      })
      describe("quand un des jeunes n'est pas lié a la bonne agence", () => {
        it('rejette', () => {
          // Given
          const infosRdv: InfosRendezVousACreer = {
            idsJeunes: ['1'],
            idConseiller: '41',
            commentaire: '',
            date: uneDatetime().toJSDate().toISOString(),
            duree: 10,
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
          }
          const conseiller = unConseiller({
            agence: { id: 'test' }
          })
          const unJeuneDunAutreConseiller = unJeune({
            conseiller: {
              id: 'un-autre-conseiller',
              firstName: 'un',
              lastName: 'autre',
              email: 'conseiller',
              idAgence: 'plop'
            }
          })

          // When
          const result = factory.creer(
            infosRdv,
            [unJeuneDunAutreConseiller],
            conseiller
          )

          // Then
          expect(result).to.deep.equal(
            failure(
              new JeuneNonLieALAgenceError(unJeuneDunAutreConseiller.id, 'test')
            )
          )
        })
      })
      describe('quand la date du rendez-vous n’est pas valide', () => {
        describe('quand la date du rendez-vous est dans plus de 2 ans', () => {
          it('rejette', () => {
            // Given
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: DateTime.now().plus({ year: 2 }).toJSDate().toISOString(),
              duree: 10
            }
            const conseiller = unConseiller()

            // When
            const result = factory.creer(infosRdv, [unJeune()], conseiller)

            // Then
            expect(result).to.deep.equal(failure(new DateNonAutoriseeError()))
          })
        })
        describe('quand la date du rendez-vous était il y à plus d’1 ans', () => {
          it('rejette', () => {
            // Given
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: DateTime.now()
                .minus({ year: 1, day: 1 })
                .toJSDate()
                .toISOString(),
              duree: 10
            }
            const conseiller = unConseiller()

            // When
            const result = factory.creer(infosRdv, [unJeune()], conseiller)

            // Then
            expect(result).to.deep.equal(failure(new DateNonAutoriseeError()))
          })
        })
      })
    })

    describe('mettreAJour', () => {
      describe('animation collective', () => {
        describe('quand elle est clôturée', () => {
          it('rejette', () => {
            // Given
            const unAtelierCloture = unRendezVous({
              type: CodeTypeRendezVous.ATELIER,
              dateCloture: uneDatetime()
            })

            // When
            const result = factory.mettreAJour(unAtelierCloture, {
              ...unAtelierCloture,
              date: '2020-04-06T12:00:00.000Z'
            })

            // Then
            expect(!result._isSuccess && result.error).to.be.an.instanceOf(
              MauvaiseCommandeError
            )
          })
        })
        describe('quand le nombre de participants est supérieur à la limite', () => {
          it('rejette avec une MauvaiseCommandeError', async () => {
            // Given
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
              jeunes: [unJeuneDuRendezVous()],
              nombreMaxParticipants: 1
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              date: '2020-04-06T12:00:00.000Z',
              jeunes: [unJeuneDuRendezVous(), unJeuneDuRendezVous()]
            })

            // Then
            expect(!result._isSuccess && result.error).to.be.an.instanceOf(
              MauvaiseCommandeError
            )
          })
        })
        describe("quand un des jeunes n'appartient pas à l'agence", () => {
          it('rejette', () => {
            // Given
            const unAtelier = unRendezVous({
              type: CodeTypeRendezVous.ATELIER,
              idAgence: '1'
            })

            // When
            const result = factory.mettreAJour(unAtelier, {
              ...unAtelier,
              date: '2020-04-06T12:00:00.000Z',
              jeunes: [
                unJeuneDuRendezVous({
                  conseiller: unConseillerDuJeune({ idAgence: '2' })
                })
              ]
            })

            // Then
            expect(!result._isSuccess && result.error).to.be.an.instanceOf(
              JeuneNonLieALAgenceError
            )
          })
        })
        describe('quand tout est bon', () => {
          it('met à jour le rendez vous', () => {
            // Given
            const dateAujourdhui = new Date()
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.ATELIER
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              titre: 'Nouveau titre',
              date: dateAujourdhui.toISOString(),
              jeunes: [unJeuneDuRendezVous()],
              modalite: 'nouveau',
              adresse: 'nouvelle',
              organisme: 'nouvel',
              presenceConseiller: false,
              nombreMaxParticipants: 12
            })

            // Then
            expect(isSuccess(result) && result.data).to.deep.equal({
              ...rendezVous,
              date: dateAujourdhui,
              jeunes: [unJeuneDuRendezVous()],
              titre: 'Nouveau titre',
              modalite: 'nouveau',
              adresse: 'nouvelle',
              organisme: 'nouvel',
              presenceConseiller: false,
              nombreMaxParticipants: 12
            })
          })
        })
      })
      describe('rendez-vous', () => {
        describe("quand c'est un rendez vous classique sans jeune", () => {
          it('rejette', () => {
            // Given
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.AUTRE,
              jeunes: [unJeune()]
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              date: '2020-04-06T12:00:00.000Z',
              jeunes: []
            })

            // Then
            expect(result).to.deep.equal(
              failure(
                new MauvaiseCommandeError('Un bénéficiaire minimum est requis.')
              )
            )
          })
        })
        describe("quand c'est un entretien individuel conseiller", () => {
          it('rejette quand on veut modifier la présence conseiller', () => {
            // Given
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
              presenceConseiller: true
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              date: '2020-04-06T12:00:00.000Z',
              presenceConseiller: false
            })

            // Then
            expect(result).to.deep.equal(
              failure(
                new MauvaiseCommandeError(
                  'Le champ presenceConseiller ne peut être modifié pour un rendez-vous Conseiller.'
                )
              )
            )
          })
          it('rejette quand on veut modifier la date du rendez-vous', () => {
            // Given
            const rendezVous = unRendezVous({
              date: new Date()
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              date: '2020-04-06T12:00:00.000Z'
            })

            // Then
            expect(result).to.deep.equal(failure(new DateNonAutoriseeError()))
          })
        })
        describe('quand on renseigne un nombre maximum de participants', () => {
          it('rejette avec une MauvaiseCommandeError', async () => {
            // Given
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              date: '2020-04-06T12:00:00.000Z',
              nombreMaxParticipants: 8
            })

            // Then
            expect(!result._isSuccess && result.error).to.be.an.instanceOf(
              MauvaiseCommandeError
            )
          })
        })
        describe('quand tout est bon', () => {
          it('met à jour le rendez vous', () => {
            // Given
            const dateAujourdhui = new Date()
            const rendezVous = unRendezVous({
              type: CodeTypeRendezVous.AUTRE
            })

            // When
            const result = factory.mettreAJour(rendezVous, {
              ...rendezVous,
              titre: 'Nouveau titre',
              date: dateAujourdhui.toISOString(),
              jeunes: [unJeuneDuRendezVous()],
              modalite: 'nouveau',
              adresse: 'nouvelle',
              organisme: 'nouvel',
              presenceConseiller: false
            })

            // Then
            expect(isSuccess(result) && result.data).to.deep.equal({
              ...rendezVous,
              date: dateAujourdhui,
              jeunes: [unJeuneDuRendezVous()],
              titre: 'Nouveau titre',
              modalite: 'nouveau',
              adresse: 'nouvelle',
              organisme: 'nouvel',
              presenceConseiller: false
            })
          })
        })
      })
    })

    describe('clore', () => {
      it('clos le rendez-vous', () => {
        // Given
        const j1 = unJeuneDuRendezVous({ id: 'j1' })
        const j2 = unJeuneDuRendezVous({ id: 'j2' })
        const rendezVous = unRendezVous({
          jeunes: [j1, j2],
          date: uneDatetime().minus({ hours: 1 }).toJSDate()
        })

        // When
        const result = factory.clore(rendezVous, [j2.id])

        // Then
        expect(result).to.deep.equal(
          success({
            ...rendezVous,
            dateCloture: uneDatetime(),
            jeunes: [
              { ...j1, present: false },
              { ...j2, present: true }
            ]
          })
        )
      })
      it('ne clos pas le rendez-vous quand à venir', () => {
        // Given
        const rendezVous = unRendezVous()

        // When
        const result = factory.clore(rendezVous, ['id'])

        // Then
        expect(result).to.deep.equal(
          failure(
            new MauvaiseCommandeError("Le rendez-vous n'est pas encore passé.")
          )
        )
      })
      it('ne clos pas le rendez-vous quand deja clos', () => {
        // Given
        const rendezVous = unRendezVous({
          dateCloture: uneDatetime()
        })

        // When
        const result = factory.clore(rendezVous, ['a'])

        // Then
        expect(result._isSuccess).to.be.false()
      })
    })
  })
})
