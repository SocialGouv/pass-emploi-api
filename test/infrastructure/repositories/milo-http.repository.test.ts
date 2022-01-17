import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { ErreurHttpMilo } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { ConseillerSqlEmailRepository } from '../../../src/infrastructure/repositories/conseiller-sql-email-repository.service'
import { DossierMiloDto } from '../../../src/infrastructure/repositories/dto/milo.dto'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { MiloHttpRepository } from '../../../src/infrastructure/repositories/milo-http.repository'
import { unJeune } from '../../fixtures/jeune.fixture'
import { DatabaseForTesting, stubClass } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'
import { MailSendinblueClient } from '../../../src/infrastructure/clients/mail-sendinblue.client'

describe('MiloHttpRepository', () => {
  let miloHttpRepository: MiloHttpRepository
  const configService = testConfig()
  const database = DatabaseForTesting.prepare()
  const jeune = { ...unJeune(), email: 'john@doe.io' }

  beforeEach(async () => {
    const httpService = new HttpService()
    const mailSendinblueClient: MailSendinblueClient =
      stubClass(MailSendinblueClient)
    const conseillerSqlRepository = new ConseillerSqlEmailRepository(
      mailSendinblueClient
    )
    await conseillerSqlRepository.save(jeune.conseiller)
    const jeuneSqlRepository = new JeuneSqlRepository(database.sequelize)
    await jeuneSqlRepository.save(jeune)

    miloHttpRepository = new MiloHttpRepository(httpService, configService)
  })

  describe('getDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        nock('https://milo.com')
          .get('/dossiers/1')
          .reply(200, JSON.stringify(dossierDto()))
          .isDone()

        // When
        const dossier = await miloHttpRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal(
          success({
            email: 'pass.emploi.contact@gmail.com',
            id: '1',
            nom: 'PEREZ',
            prenom: 'Olivier',
            codePostal: '65410',
            dateDeNaissance: '1997-05-08'
          })
        )
      })
    })

    describe('quand il y a une erreur 4XX', () => {
      it("renvoie l'erreur", async () => {
        // Given
        nock('https://milo.com')
          .get('/dossiers/1')
          .reply(404, {
            message: 'un message'
          })
          .isDone()

        // When
        const dossier = await miloHttpRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal(
          failure(new ErreurHttpMilo('un message', 404))
        )
      })
    })
  })

  describe('creerJeune', () => {
    describe('quand le jeune est nouveau', () => {
      it('le créée chez Milo', async () => {
        // Given
        nock('https://milo.com').post('/compte-jeune/1').reply(204).isDone()

        // When
        const dossier = await miloHttpRepository.creerJeune('1', jeune.email)

        // Then
        expect(dossier).to.deep.equal(emptySuccess())
      })
    })
    describe('quand il y a un bad request', () => {
      describe("quand c'est SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT", () => {
        describe("quand le jeune n'existe pas chez nous avec cet email", () => {
          it('renvoie un succès', async () => {
            // Given
            nock('https://milo.com')
              .post('/compte-jeune/1')
              .reply(400, {
                code: 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT'
              })
              .isDone()

            // When
            const dossier = await miloHttpRepository.creerJeune(
              '1',
              'un-autre-email'
            )

            // Then
            expect(dossier).to.deep.equal(emptySuccess())
          })
        })
        describe('quand le jeune existe chez nous avec cet email', () => {
          it('renvoie un échec', async () => {
            // Given
            nock('https://milo.com')
              .post('/compte-jeune/1')
              .reply(400, {
                code: 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT',
                message: 'le mail est pas bon john'
              })
              .isDone()

            // When
            const dossier = await miloHttpRepository.creerJeune(
              '1',
              jeune.email
            )

            // Then
            expect(dossier).to.deep.equal(
              failure(new ErreurHttpMilo('le mail est pas bon john', 400))
            )
          })
        })
      })
    })
  })
})

const dossierDto = (): DossierMiloDto => ({
  idDossier: 6282,
  idJeune: '1306654400021970358',
  numeroDE: '4053956Z',
  adresse: {
    numero: '',
    libelleVoie: 'le village',
    complement: 'ancienne ecole',
    codePostal: '65410',
    commune: 'Beyrède-Jumet-Camous'
  },
  nomNaissance: 'PEREZ',
  nomUsage: 'PEREZ',
  prenom: 'Olivier',
  dateNaissance: '1997-05-08',
  mail: 'pass.emploi.contact@gmail.com',
  structureRattachement: {
    nomUsuel: 'Antenne de Tarbes',
    nomOfficiel: '65-ML TARBES',
    codeStructure: '65440S00'
  },
  accompagnementCEJ: {
    accompagnementCEJ: false,
    dateDebut: null,
    dateFinPrevue: null,
    dateFinReelle: null,
    premierAccompagnement: null
  },
  situations: [
    {
      etat: 'EN_COURS',
      dateFin: null,
      categorieSituation: "Demandeur d'emploi",
      codeRomeMetierPrepare: null,
      codeRomePremierMetier: 'F1501',
      codeRomeMetierExerce: null
    }
  ]
})
