import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import {
  unEvenementMilo,
  unEvenementMiloDto,
  unRendezVousMilo
} from 'test/fixtures/partenaire.fixture'
import { expect } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'
import { ErreurHttp } from '../../../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../../../src/building-blocks/types/result'
import {
  RendezVousMiloDto,
  SessionMiloDto
} from '../../../../../src/infrastructure/repositories/dto/milo.dto'
import { MiloRendezVousHttpRepository } from '../../../../../src/infrastructure/repositories/partenaire/milo/milo-rendez-vous-http.repository'
import { MiloRendezVous } from '../../../../../src/domain/partenaire/milo/milo.rendez-vous'
import { RateLimiterService } from '../../../../../src/utils/rate-limiter.service'

describe('MiloEvenementsHttpRepository', () => {
  let miloEvenementsHttpRepository: MiloRendezVousHttpRepository
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(async () => {
    const httpService = new HttpService()
    miloEvenementsHttpRepository = new MiloRendezVousHttpRepository(
      httpService,
      configService,
      rateLimiterService
    )
  })
  describe('findAllEvenements', () => {
    it("doit retourner une liste d'évènements", async () => {
      // Given
      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(200, [unEvenementMiloDto()])
        .isDone()

      // When
      const evenements = await miloEvenementsHttpRepository.findAllEvenements()

      // Then
      expect(evenements).to.deep.equal([unEvenementMilo()])
    })
    it('renvoie une erreur HTTP quand il y a un problème HTTP', async () => {
      // Given
      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(400, 'Bad Request')
        .isDone()

      // When
      const promise = miloEvenementsHttpRepository.findAllEvenements()

      // Then
      await expect(promise).to.be.rejected()
    })
    it('mappe les éléments de format inconnus en non traitable', async () => {
      // Given
      const unEvenementInconnuDto = unEvenementMiloDto({
        type: 'PLOP'
      })
      const unEvenementMiloInconnue = unEvenementMilo({
        objet: MiloRendezVous.ObjetEvenement.NON_TRAITABLE
      })

      nock('https://milo.com')
        .get('/operateurs/events')
        .reply(200, [unEvenementMiloDto(), unEvenementInconnuDto])
        .isDone()

      // When
      const evenements = await miloEvenementsHttpRepository.findAllEvenements()

      // Then
      expect(evenements).to.deep.equal([
        unEvenementMilo(),
        unEvenementMiloInconnue
      ])
    })
  })
  describe('acquitterEvenement', () => {
    let evenement: MiloRendezVous.Evenement

    beforeEach(() => {
      evenement = unEvenementMilo()
    })

    it('acquitte l‘evenement quand milo répond NO CONTENT', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(204)

      // When
      const result = await miloEvenementsHttpRepository.acquitterEvenement(
        evenement
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('retourne une failure quand milo répond INTERNAL SERVER ERROR', async () => {
      // Given
      nock('https://milo.com')
        .post(`/operateurs/events/${evenement.id}/ack`, {})
        .reply(500, 'Im not a teapot')

      // When
      const result = await miloEvenementsHttpRepository.acquitterEvenement(
        evenement
      )

      // Then
      expect(result).to.deep.equal(
        failure(new ErreurHttp('Im not a teapot', 500))
      )
    })
  })
  describe('findRendezVousByEvenement', () => {
    const idPartenaireBeneficiaire = 1234
    const idObjet = 5678

    describe("quand c'est un rendez-vous", () => {
      describe('quand il existe', () => {
        it('renvoie le rendez vous milo', async () => {
          // Given
          const rendezVousJson: RendezVousMiloDto = {
            id: idObjet,
            dateHeureDebut: '2022-10-06 10:00:00',
            dateHeureFin: '2022-10-06 12:00:00',
            objet: 'Test RDV',
            conseiller: 'SIMILO SIMILO',
            idDossier: idPartenaireBeneficiaire,
            commentaire: '',
            type: 'Téléphone',
            statut: 'Planifié'
          }
          nock('https://milo.com')
            .get(
              `/operateurs/dossiers/${idPartenaireBeneficiaire}/rdv/${idObjet}`
            )
            .reply(200, JSON.stringify(rendezVousJson))
            .isDone()

          // When
          const resultat =
            await miloEvenementsHttpRepository.findRendezVousByEvenement(
              unEvenementMilo({
                idObjet: idObjet.toString(),
                objet: MiloRendezVous.ObjetEvenement.RENDEZ_VOUS,
                idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
              })
            )

          // Then
          const expected: MiloRendezVous = unRendezVousMilo({
            id: idObjet.toString(),
            idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
          })
          expect(resultat).to.deep.equal(expected)
        })

        describe('mais est Annulé ou Reporté', () => {
          for (const statut of ['Annulé', 'Reporté']) {
            it(`renvoie undefined quand le statut est ${statut}`, async () => {
              // Given
              const rendezVousJson: RendezVousMiloDto = {
                id: idObjet,
                dateHeureDebut: '2022-10-06 10:00:00',
                dateHeureFin: '2022-10-06 12:00:00',
                objet: 'Test RDV',
                conseiller: 'SIMILO SIMILO',
                idDossier: idPartenaireBeneficiaire,
                commentaire: '',
                type: 'Téléphone',
                statut: statut as 'Annulé' | 'Reporté'
              }
              nock('https://milo.com')
                .get(
                  `/operateurs/dossiers/${idPartenaireBeneficiaire}/rdv/${idObjet}`
                )
                .reply(200, JSON.stringify(rendezVousJson))
                .isDone()

              // When
              const resultat =
                await miloEvenementsHttpRepository.findRendezVousByEvenement(
                  unEvenementMilo({
                    idObjet: idObjet.toString(),
                    objet: MiloRendezVous.ObjetEvenement.RENDEZ_VOUS,
                    idPartenaireBeneficiaire:
                      idPartenaireBeneficiaire.toString()
                  })
                )

              // Then
              expect(resultat).to.be.undefined()
            })
          }
        })
      })
      describe('quand il n’existe pas', () => {
        it('renvoie undefined', async () => {
          // Given
          nock('https://milo.com')
            .get(
              `/operateurs/dossiers/${idPartenaireBeneficiaire}/rdv/${idObjet}`
            )
            .reply(404)
            .isDone()

          // When
          const resultat =
            await miloEvenementsHttpRepository.findRendezVousByEvenement(
              unEvenementMilo({
                idObjet: idObjet.toString(),
                objet: MiloRendezVous.ObjetEvenement.RENDEZ_VOUS,
                idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
              })
            )

          // Then
          expect(resultat).to.be.undefined()
        })
      })
    })
    describe("quand c'est une session", () => {
      describe('quand elle existe', () => {
        it('renvoie la session milo', async () => {
          // Given
          const sessionJson: SessionMiloDto = {
            lieu: 'la',
            nom: 'je suis un titre mais en fait le nom',
            id: idObjet.toString(),
            dateHeureDebut: '2022-10-06 10:00:00',
            dateHeureFin: '2022-10-06 12:00:00',
            idDossier: idPartenaireBeneficiaire.toString(),
            commentaire: 'un petit commentaire plus ou moins long',
            statut: 'Prescrit'
          }
          nock('https://milo.com')
            .get(
              `/operateurs/dossiers/${idPartenaireBeneficiaire}/sessions/${idObjet}`
            )
            .reply(200, JSON.stringify(sessionJson))
            .isDone()

          // When
          const resultat =
            await miloEvenementsHttpRepository.findRendezVousByEvenement(
              unEvenementMilo({
                idObjet: idObjet.toString(),
                objet: MiloRendezVous.ObjetEvenement.SESSION,
                idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
              })
            )

          // Then
          const expected: MiloRendezVous = unRendezVousMilo({
            id: idObjet.toString(),
            idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString(),
            titre: sessionJson.nom,
            commentaire: sessionJson.commentaire,
            type: MiloRendezVous.Type.SESSION,
            statut: 'Prescrit',
            adresse: 'la'
          })
          expect(resultat).to.deep.equal(expected)
        })
        describe('mais est Refus tiers ou Refus jeune', () => {
          for (const statut of ['Refus tiers', 'Refus jeune']) {
            it(`renvoie undefined quand le statut est ${statut}`, async () => {
              // Given
              const sessionMiloDto: SessionMiloDto = {
                lieu: 'la',
                nom: 'je suis un titre mais en fait le nom',
                id: idObjet.toString(),
                dateHeureDebut: '2022-10-06 10:00:00',
                dateHeureFin: '2022-10-06 12:00:00',
                idDossier: idPartenaireBeneficiaire.toString(),
                commentaire: 'un petit commentaire plus ou moins long',
                statut: statut as 'Refus tiers' | 'Refus jeune'
              }
              nock('https://milo.com')
                .get(
                  `/operateurs/dossiers/${idPartenaireBeneficiaire}/sessions/${idObjet}`
                )
                .reply(200, JSON.stringify(sessionMiloDto))
                .isDone()

              // When
              const resultat =
                await miloEvenementsHttpRepository.findRendezVousByEvenement(
                  unEvenementMilo({
                    idObjet: idObjet.toString(),
                    objet: MiloRendezVous.ObjetEvenement.SESSION,
                    idPartenaireBeneficiaire:
                      idPartenaireBeneficiaire.toString()
                  })
                )

              // Then
              expect(resultat).to.be.undefined()
            })
          }
        })
      })

      describe('quand elle n’existe pas', () => {
        it('renvoie undefined', async () => {
          // Given
          nock('https://milo.com')
            .get(
              `/operateurs/dossiers/${idPartenaireBeneficiaire}/sessions/${idObjet}`
            )
            .reply(404)
            .isDone()

          // When
          const resultat =
            await miloEvenementsHttpRepository.findRendezVousByEvenement(
              unEvenementMilo({
                idObjet: idObjet.toString(),
                objet: MiloRendezVous.ObjetEvenement.SESSION,
                idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
              })
            )

          // Then
          expect(resultat).to.be.undefined()
        })
      })
    })
  })
})
