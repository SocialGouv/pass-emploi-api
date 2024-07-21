import { HttpService } from '@nestjs/axios'
import * as nock from 'nock'
import { unEvenementMilo, unRendezVousMilo } from 'test/fixtures/milo.fixture'
import { expect } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'
import { EvenementMilo } from '../../../../src/domain/milo/evenement.milo'
import { RendezVousMilo } from '../../../../src/domain/milo/rendez-vous.milo'
import { RendezVousMiloDto } from '../../../../src/infrastructure/repositories/dto/milo.dto'
import { RendezVousMiloHttpRepository } from '../../../../src/infrastructure/repositories/milo/rendez-vous-milo-http.repository'
import { RateLimiterService } from '../../../../src/utils/rate-limiter.service'

describe('MiloEvenementsHttpRepository', () => {
  let repository: RendezVousMiloHttpRepository
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(async () => {
    const httpService = new HttpService()
    repository = new RendezVousMiloHttpRepository(
      httpService,
      configService,
      rateLimiterService
    )
  })

  describe('findRendezVousByEvenement', () => {
    const idPartenaireBeneficiaire = 1234
    const idObjet = 5678

    describe('quand il existe', () => {
      it('renvoie le rendez vous milo', async () => {
        // Given
        const rendezVousJson: RendezVousMiloDto = {
          id: idObjet,
          dateHeureDebut: '2020-10-06 10:00:00',
          dateHeureFin: '2020-10-06 12:00:00',
          objet: 'Test RDV',
          conseiller: 'SIMILO SIMILO',
          idDossier: idPartenaireBeneficiaire,
          commentaire: '',
          type: 'Téléphone',
          statut: 'Planifié',
          lieu: 'new'
        }
        nock('https://milo.com')
          .get(
            `/operateurs/dossiers/${idPartenaireBeneficiaire}/rdv/${idObjet}`
          )
          .reply(200, JSON.stringify(rendezVousJson))
          .isDone()

        // When
        const resultat = await repository.findRendezVousByEvenement(
          unEvenementMilo({
            idObjet: idObjet.toString(),
            objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
            idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
          })
        )

        // Then
        const expected: RendezVousMilo = unRendezVousMilo({
          id: idObjet.toString(),
          idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString(),
          adresse: 'new'
        })
        expect(resultat).to.deep.equal(expected)
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
        const resultat = await repository.findRendezVousByEvenement(
          unEvenementMilo({
            idObjet: idObjet.toString(),
            objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
            idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
          })
        )

        // Then
        expect(resultat).to.be.undefined()
      })
    })
    describe("quand l'evenement est du mauvais type", () => {
      it('renvoie undefined', async () => {
        // Given
        const evenementPasBon = unEvenementMilo({
          idObjet: idObjet.toString(),
          objet: EvenementMilo.ObjetEvenement.SESSION,
          idPartenaireBeneficiaire: idPartenaireBeneficiaire.toString()
        })

        // When
        const resultat = await repository.findRendezVousByEvenement(
          evenementPasBon
        )

        // Then
        expect(resultat).to.be.undefined()
      })
    })
  })
})
