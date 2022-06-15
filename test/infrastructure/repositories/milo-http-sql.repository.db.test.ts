import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { CategorieSituationMilo, EtatSituationMilo } from 'src/domain/milo'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { uneSituationsMilo } from 'test/fixtures/milo.fixture'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { DossierMiloDto } from '../../../src/infrastructure/repositories/dto/milo.dto'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository.db'
import { MiloHttpSqlRepository } from '../../../src/infrastructure/repositories/milo-http-sql.repository.db'
import { unJeune } from '../../fixtures/jeune.fixture'
import { testConfig } from '../../utils/module-for-testing'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unConseiller } from '../../fixtures/conseiller.fixture'

describe('MiloHttpRepository', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let miloHttpSqlRepository: MiloHttpSqlRepository
  const configService = testConfig()
  const jeune = unJeune({ email: 'john@doe.io' })
  let idService: IdService
  let dateService: DateService

  beforeEach(async () => {
    const httpService = new HttpService()
    const conseillerSqlRepository = new ConseillerSqlRepository()
    await conseillerSqlRepository.save(unConseiller())
    const jeuneSqlRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      idService,
      dateService
    )
    await jeuneSqlRepository.save(jeune)

    miloHttpSqlRepository = new MiloHttpSqlRepository(
      httpService,
      configService
    )
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
        const dossier = await miloHttpSqlRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal(
          success({
            email: 'pass.emploi.contact@gmail.com',
            id: '1',
            nom: 'PEREZ',
            prenom: 'Olivier',
            codePostal: '65410',
            dateDeNaissance: '1997-05-08',
            situations: [
              {
                categorie: "Demandeur d'emploi",
                etat: 'EN_COURS',
                dateFin: undefined
              }
            ]
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
        const dossier = await miloHttpSqlRepository.getDossier('1')

        // Then
        expect(dossier).to.deep.equal(
          failure(new ErreurHttp('un message', 404))
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
        const dossier = await miloHttpSqlRepository.creerJeune('1')

        // Then
        expect(dossier).to.deep.equal(emptySuccess())
      })
    })
    describe('quand il y a un bad request', () => {
      describe("quand c'est SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT", () => {
        describe('que le jeune existe ou pas chez nous', () => {
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
            const dossier = await miloHttpSqlRepository.creerJeune('1')

            // Then
            expect(dossier).to.deep.equal(
              failure(new ErreurHttp('le mail est pas bon john', 400))
            )
          })
        })
      })
    })
  })

  describe('saveSituationsJeune', () => {
    describe("quand le jeune n'a pas de situations", () => {
      it('sauvegarde les nouvelles situations', async () => {
        // Given
        const situationsMilo = uneSituationsMilo({ idJeune: jeune.id })

        // When
        await miloHttpSqlRepository.saveSituationsJeune(situationsMilo)

        // Then
        const result = await SituationsMiloSqlModel.findAll({
          where: { idJeune: jeune.id }
        })
        expect(result.length).to.equal(1)
        expect(result[0].idJeune).to.equal(jeune.id)
        expect(result[0].situationCourante).to.deep.equal(
          situationsMilo.situationCourante
        )
        expect(result[0].situations).to.deep.equal(situationsMilo.situations)
      })
    })
    describe('quand le jeune a deja des situations', () => {
      it('met à jour les situations', async () => {
        // Given
        const situationsMilo = uneSituationsMilo({ idJeune: jeune.id })

        // When
        await miloHttpSqlRepository.saveSituationsJeune(situationsMilo)
        situationsMilo.situations = []
        await miloHttpSqlRepository.saveSituationsJeune(situationsMilo)

        // Then
        const result = await SituationsMiloSqlModel.findAll({
          where: { idJeune: jeune.id }
        })
        expect(result.length).to.equal(1)
        expect(result[0].idJeune).to.equal(jeune.id)
        expect(result[0].situations).to.deep.equal(situationsMilo.situations)
      })
    })
  })

  describe('getSituationsByJeune', () => {
    it('recupere les situations', async () => {
      // Given
      const situationsMilo = uneSituationsMilo({ idJeune: jeune.id })
      await SituationsMiloSqlModel.create({ ...situationsMilo })

      // When
      const result = await miloHttpSqlRepository.getSituationsByJeune(jeune.id)

      // Then
      expect(result).to.deep.equal(situationsMilo)
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
      etat: EtatSituationMilo.EN_COURS,
      dateFin: null,
      categorieSituation: CategorieSituationMilo.DEMANDEUR_D_EMPLOI,
      codeRomeMetierPrepare: null,
      codeRomePremierMetier: 'F1501',
      codeRomeMetierExerce: null
    }
  ]
})
