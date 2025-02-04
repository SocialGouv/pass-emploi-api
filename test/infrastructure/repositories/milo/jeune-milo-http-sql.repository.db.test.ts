import { HttpService } from '@nestjs/axios'
import { expect } from 'chai'
import * as nock from 'nock'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { uneSituationsMilo } from 'test/fixtures/milo.fixture'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { Core } from '../../../../src/domain/core'
import { JeuneMilo } from '../../../../src/domain/milo/jeune.milo'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'
import { ConseillerSqlRepository } from '../../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { DossierMiloDto } from '../../../../src/infrastructure/repositories/dto/milo.dto'
import { MiloJeuneHttpSqlRepository } from '../../../../src/infrastructure/repositories/milo/jeune-milo-http-sql.repository.db'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { RateLimiterService } from '../../../../src/utils/rate-limiter.service'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import {
  uneConfiguration,
  unJeune,
  unJeuneSansConseiller
} from '../../../fixtures/jeune.fixture'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { testConfig } from '../../../utils/module-for-testing'

describe('JeuneMiloHttpRepository', () => {
  let databaseForTesting: DatabaseForTesting
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)
  let miloHttpSqlRepository: MiloJeuneHttpSqlRepository
  const jeune = unJeune({ email: 'john@doe.io' })
  let idService: IdService
  let dateService: DateService
  const conseiller = unConseiller()

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    const httpService = new HttpService()
    const conseillerSqlRepository = new ConseillerSqlRepository()
    await conseillerSqlRepository.save(conseiller)
    const firebaseClient = stubClass(FirebaseClient)
    const jeuneSqlRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      firebaseClient,
      idService,
      dateService
    )
    await jeuneSqlRepository.save(jeune)

    miloHttpSqlRepository = new MiloJeuneHttpSqlRepository(
      httpService,
      configService,
      rateLimiterService
    )
  })

  describe('get', () => {
    describe('quand le jeune existe', () => {
      it('retourne le jeune', async () => {
        // Given
        const jeuneMilo: JeuneMilo = unJeune({
          id: 'milo',
          configuration: uneConfiguration({ idJeune: 'milo' })
        })
        jeuneMilo.idStructureMilo = 'test'

        await StructureMiloSqlModel.create({
          id: jeuneMilo.idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: jeuneMilo.id,
            idConseiller: conseiller.id,
            dateCreation: jeuneMilo.creationDate.toJSDate(),
            datePremiereConnexion: jeuneMilo.datePremiereConnexion!.toJSDate(),
            idStructureMilo: jeuneMilo.idStructureMilo
          })
        )

        // When
        const result = await miloHttpSqlRepository.get(jeuneMilo.id)

        // Then
        jeuneMilo.conseiller!.idAgence = undefined
        expect(result).to.deep.equal(success(jeuneMilo))
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne une failure', async () => {
        // When
        const result = await miloHttpSqlRepository.get('ZIZOU')

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', 'ZIZOU'))
        )
      })
    })
  })

  describe('getDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        nock('https://milo.com')
          .get('/sue/dossiers/1')
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
            dateFinCEJ: undefined,
            situations: [
              {
                categorie: "Demandeur d'emploi",
                etat: 'EN_COURS',
                dateFin: undefined
              }
            ],
            codeStructure: '65440S00'
          })
        )
      })
    })

    describe('quand il y a une erreur 4XX', () => {
      it("renvoie l'erreur", async () => {
        // Given
        nock('https://milo.com')
          .get('/sue/dossiers/1')
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

  describe('getByIdDossier', () => {
    describe('quand un jeune existe avec cet id dossier', () => {
      it('retourne le jeune avec sa structure Milo', async () => {
        // Given
        const idDossier = 'test-id-dossier'
        const idStructure = 'test2'
        const idJeuneAvecDossier = 'test2'

        const jeuneAttendu: JeuneMilo = {
          ...unJeuneSansConseiller(),
          id: idJeuneAvecDossier,
          idPartenaire: idDossier,
          configuration: uneConfiguration({
            idJeune: idJeuneAvecDossier,
            dateDerniereActualisationToken: uneDatetime().toJSDate()
          }),
          idStructureMilo: idStructure
        }
        await StructureMiloSqlModel.create({
          id: idStructure,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeuneAvecDossier,
            idConseiller: undefined,
            dateCreation: jeuneAttendu.creationDate.toJSDate(),
            pushNotificationToken: 'token',
            dateDerniereActualisationToken: uneDatetime().toJSDate(),
            idPartenaire: idDossier,
            datePremiereConnexion: uneDatetime().plus({ day: 1 }).toJSDate(),
            installationId: '123456',
            instanceId: 'abcdef',
            appVersion: '1.8.1',
            timezone: 'Europe/Paris',
            idStructureMilo: idStructure
          })
        )

        // When
        const result = await miloHttpSqlRepository.getByIdDossier(idDossier)

        // Then
        expect(result).to.deep.equal(success(jeuneAttendu))
      })
    })

    describe("quand aucun jeune n'existe avec cet id dossier", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await miloHttpSqlRepository.getByIdDossier(
          'test-id-dossier-inconnu'
        )

        // Then
        expect(jeune).to.deep.equal(
          failure(new NonTrouveError('Dossier Milo', 'test-id-dossier-inconnu'))
        )
      })
    })
  })

  describe('creerJeune', () => {
    describe('quand le jeune est nouveau', () => {
      describe("l'api ne retourne pas de sub", () => {
        it("le crée chez Milo sans retourner l'id", async () => {
          // Given
          nock('https://milo.com')
            .post('/sue/compte-jeune/1')
            .reply(204)
            .isDone()

          // When
          const dossier = await miloHttpSqlRepository.creerJeune('1')

          // Then
          expect(dossier).to.deep.equal(
            success({
              idAuthentification: undefined,
              existeDejaChezMilo: false
            })
          )
        })
      })
      describe("l'api retourne un sub", () => {
        it("le crée chez Milo et retourne l'id", async () => {
          // Given
          nock('https://milo.com')
            .post('/sue/compte-jeune/1')
            .reply(201, 'un-id-keycloak', { 'content-type': 'text/plain' })
            .isDone()

          // When
          const dossier = await miloHttpSqlRepository.creerJeune('1')

          // Then
          expect(dossier).to.deep.equal(
            success({
              idAuthentification: 'un-id-keycloak',
              existeDejaChezMilo: false
            })
          )
        })
      })
      it("surcharge chez Milo et retourne l'id", async () => {
        // Given
        nock('https://milo.com')
          .put('/sue/compte-jeune/surcharge/1')
          .reply(201, 'un-id-keycloak', { 'content-type': 'text/plain' })
          .isDone()

        // When
        const dossier = await miloHttpSqlRepository.creerJeune('1', true)

        // Then
        expect(dossier).to.deep.equal(
          success({
            idAuthentification: 'un-id-keycloak',
            existeDejaChezMilo: false
          })
        )
      })
      it("surcharge chez Milo et retourne l'id quand pas de sub retourné", async () => {
        // Given
        nock('https://milo.com')
          .put('/sue/compte-jeune/surcharge/1')
          .reply(201, '', { 'content-type': 'text/plain' })
          .isDone()
        nock('https://milo.com')
          .post('/sue/compte-jeune/1')
          .reply(400, {
            code: 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT',
            'id-keycloak': 'un-id-keycloak'
          })
          .isDone()

        // When
        const dossier = await miloHttpSqlRepository.creerJeune('1', true)

        // Then
        expect(dossier).to.deep.equal(
          success({
            idAuthentification: 'un-id-keycloak',
            existeDejaChezMilo: true
          })
        )
      })
    })
    describe('quand il y a un bad request', () => {
      describe("quand c'est SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT", () => {
        describe('api en prod : quand le jeune existe déjà', () => {
          it('renvoie un succès avec le sub', async () => {
            // Given
            nock('https://milo.com')
              .post('/sue/compte-jeune/1')
              .reply(400, {
                code: 'SUE_RECORD_ALREADY_ATTACHED_TO_ACCOUNT',
                'id-keycloak': 'mon-sub'
              })
              .isDone()

            // When
            const dossier = await miloHttpSqlRepository.creerJeune('1')

            // Then
            expect(dossier).to.deep.equal(
              success({
                idAuthentification: 'mon-sub',
                existeDejaChezMilo: true
              })
            )
          })
        })
        describe('quand le jeune existe déjà dans une autre ML', () => {
          it('renvoie un succès avec le sub', async () => {
            // Given
            nock('https://milo.com')
              .post('/sue/compte-jeune/1')
              .reply(400, {
                code: 'SUE_ACCOUNT_EXISTING_OTHER_ML',
                message: 'le jeune est suivi par john'
              })
              .isDone()

            // When
            const dossier = await miloHttpSqlRepository.creerJeune('1')

            // Then
            expect(dossier).to.deep.equal(
              failure(new ErreurHttp('le jeune est suivi par john', 422))
            )
          })
        })
        describe('api pas en prod : pas de sub', () => {
          it('renvoie un échec', async () => {
            // Given
            nock('https://milo.com')
              .post('/sue/compte-jeune/1')
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

  describe('getJeunesMiloAvecIdDossier', () => {
    const idJeuneTest = 'jeune-a-retrouver'

    beforeEach(async () => {
      // Given
      await StructureMiloSqlModel.create({
        id: 'test',
        nomOfficiel: 'test',
        timezone: 'Europe/Paris'
      })
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: 'jeune-pas-milo',
          idConseiller: undefined,
          structure: Core.Structure.POLE_EMPLOI,
          idPartenaire: undefined
        }),
        unJeuneDto({
          id: 'jeune-sans-id-dossier',
          idConseiller: undefined,
          structure: Core.Structure.MILO,
          idPartenaire: undefined
        }),
        unJeuneDto({
          id: idJeuneTest,
          idConseiller: undefined,
          structure: Core.Structure.MILO,
          idPartenaire: 'test-id-dossier',
          idStructureMilo: 'test'
        })
      ])
    })

    describe('quand un jeune Milo existe avec id dossier', () => {
      it('retourne les jeunes', async () => {
        // When
        const result = await miloHttpSqlRepository.getJeunesMiloAvecIdDossier(
          0,
          10
        )

        // Then
        expect(result.length).to.equal(2)
        expect(result[1].id).to.equal(idJeuneTest)
        expect(result[1].idStructureMilo).to.equal('test')
      })
    })
    describe('quand la pagination atteint la limite', () => {
      it('retourne liste vide', async () => {
        // When
        const result = await miloHttpSqlRepository.getJeunesMiloAvecIdDossier(
          2,
          1
        )

        // Then
        expect(result).to.deep.equal([])
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

  describe('save', () => {
    it('sauvegarde la structure du jeune quand trouvée', async () => {
      // Given
      const codeStructure = 'structure-du-jeune'
      await StructureMiloSqlModel.create({
        id: codeStructure,
        nomOfficiel: 'test',
        timezone: 'Europe/Paris'
      })

      // When
      await miloHttpSqlRepository.save(jeune, codeStructure)

      // Then
      const jeuneTrouve = await JeuneSqlModel.findByPk(jeune.id)

      expect(jeuneTrouve?.idStructureMilo).to.equal(codeStructure)
    })
    it('met à null la dateFinCEJ et structure du jeune', async () => {
      // Given
      const codeStructure = 'structure-du-jeune'
      await StructureMiloSqlModel.create({
        id: codeStructure,
        nomOfficiel: 'test',
        timezone: 'Europe/Paris'
      })
      await JeuneSqlModel.update(
        {
          dateFinCEJ: uneDatetime().toJSDate(),
          idStructureMilo: codeStructure
        },
        { where: { id: jeune.id } }
      )

      // When
      await miloHttpSqlRepository.save(
        { ...jeune, dateFinCEJ: uneDatetime(), idStructureMilo: codeStructure },
        null,
        null
      )

      // Then
      const jeuneTrouve = await JeuneSqlModel.findByPk(jeune.id)

      expect(jeuneTrouve?.dateFinCEJ).to.equal(null)
      expect(jeuneTrouve?.idStructureMilo).to.equal(null)
    })
    it('ne modifie aucune donnée du Jeune Milo', async () => {
      // Given
      const codeStructure = 'structure-du-jeune'
      await StructureMiloSqlModel.create({
        id: codeStructure,
        nomOfficiel: 'test',
        timezone: 'Europe/Paris'
      })
      await JeuneSqlModel.update(
        {
          dateFinCEJ: uneDatetime().toJSDate(),
          idStructureMilo: codeStructure
        },
        { where: { id: jeune.id } }
      )

      // When
      await miloHttpSqlRepository.save(
        { ...jeune, dateFinCEJ: uneDatetime(), idStructureMilo: codeStructure },
        undefined,
        undefined
      )

      // Then
      const jeuneTrouve = await JeuneSqlModel.findByPk(jeune.id)

      expect(jeuneTrouve?.dateFinCEJ).to.deep.equal(uneDatetime().toJSDate())
      expect(jeuneTrouve?.idStructureMilo).to.equal(codeStructure)
    })
    it('ne sauvegarde pas la structure du jeune quand non trouvée', async () => {
      // Given
      const codeStructure = 'structure-du-jeune'
      await StructureMiloSqlModel.create({
        id: 'structure-pas-du-jeune',
        nomOfficiel: 'test',
        timezone: 'Europe/Paris'
      })

      // When
      await miloHttpSqlRepository.save(jeune, codeStructure)

      // Then
      const jeuneTrouve = await JeuneSqlModel.findByPk(jeune.id)

      expect(jeuneTrouve?.idStructureMilo).to.be.null()
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
      etat: JeuneMilo.EtatSituation.EN_COURS,
      dateFin: null,
      categorieSituation: JeuneMilo.CategorieSituation.DEMANDEUR_D_EMPLOI,
      codeRomeMetierPrepare: null,
      codeRomePremierMetier: 'F1501',
      codeRomeMetierExerce: null
    }
  ]
})
