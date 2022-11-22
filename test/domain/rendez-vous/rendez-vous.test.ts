import {
  CodeTypeRendezVous,
  InfosRendezVousACreer,
  RendezVous
} from 'src/domain/rendez-vous/rendez-vous'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { expect, StubbedClass, stubClass } from '../../utils'
import { failure, isSuccess } from '../../../src/building-blocks/types/result'
import {
  ConseillerSansAgenceError,
  JeuneNonLieALAgenceError,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import {
  unJeuneDuRendezVous,
  unRendezVous
} from '../../fixtures/rendez-vous.fixture'

describe('Rendez-vous', () => {
  const id = '26279b34-318a-45e4-a8ad-514a1090462c'
  let idService: StubbedClass<IdService>

  describe('Factory', () => {
    let factory: RendezVous.Factory

    beforeEach(() => {
      idService = stubClass(IdService)
      idService.uuid.returns(id)
      factory = new RendezVous.Factory(idService)
    })

    describe('creer', () => {
      describe('quand le type est autre que animation collective', () => {
        it('crée un rdv', async () => {
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
            date: new Date('2020-04-06T12:00:00.000Z'),
            duree: 10,
            id: '26279b34-318a-45e4-a8ad-514a1090462c',
            idAgence: undefined,
            invitation: undefined,
            jeunes: [unJeune()],
            modalite: undefined,
            organisme: undefined,
            precision: undefined,
            presenceConseiller: true,
            sousTitre: 'avec Nils',
            titre: 'Rendez-vous conseiller',
            type: 'ENTRETIEN_INDIVIDUEL_CONSEILLER'
          })
        })
      })
      describe('quand le type est animation collective', () => {
        describe('quand le conseiller a une agence ', () => {
          it('renvoie un rdv avec agence', async () => {
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
        describe("quand le conseiller n'a pas d'agence", () => {
          it('renvoie une failure', async () => {
            // Given
            const infosRdv: InfosRendezVousACreer = {
              idsJeunes: ['1'],
              idConseiller: '41',
              commentaire: '',
              date: uneDatetime().toJSDate().toISOString(),
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
    })
  })

  describe('Service', () => {
    let service: RendezVous.Service

    beforeEach(() => {
      service = new RendezVous.Service()
    })

    describe('mettreAJour', () => {
      describe("quand c'est une animation collective cloturée", () => {
        it('rejette', () => {
          // Given
          const unAtelierCloture = unRendezVous({
            type: CodeTypeRendezVous.ATELIER,
            dateCloture: uneDatetime()
          })

          // When
          const result = service.mettreAJour(unAtelierCloture, {
            ...unAtelierCloture,
            date: '2020-04-06T12:00:00.000Z'
          })

          // Then
          expect(result).to.deep.equal(
            failure(
              new MauvaiseCommandeError(
                'Une Animation Collective cloturée ne peut plus etre modifiée.'
              )
            )
          )
        })
      })
      describe("quand c'est un rendez vous classique sans jeune", () => {
        it('rejette', () => {
          // Given
          const rendezVous = unRendezVous({
            type: CodeTypeRendezVous.AUTRE,
            jeunes: [unJeune()]
          })

          // When
          const result = service.mettreAJour(rendezVous, {
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
          const result = service.mettreAJour(rendezVous, {
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
      })
      describe('quand tout est bon', () => {
        it('met à jour le rendez vous', () => {
          // Given
          const rendezVous = unRendezVous({
            type: CodeTypeRendezVous.AUTRE
          })

          // When
          const result = service.mettreAJour(rendezVous, {
            ...rendezVous,
            date: '2020-04-06T12:00:00.000Z',
            jeunes: [unJeuneDuRendezVous()],
            modalite: 'nouveau',
            adresse: 'nouvelle',
            organisme: 'nouvel',
            presenceConseiller: false
          })

          // Then
          expect(isSuccess(result) && result.data).to.deep.equal({
            ...rendezVous,
            date: new Date('2020-04-06T12:00:00.000Z'),
            jeunes: [unJeuneDuRendezVous()],
            modalite: 'nouveau',
            adresse: 'nouvelle',
            organisme: 'nouvel',
            presenceConseiller: false
          })
        })
      })
    })
  })
})
