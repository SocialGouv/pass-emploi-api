import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerDto,
  uneInscriptionSessionMiloDto
} from 'test/fixtures/milo-dto.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  GetDetailSessionConseillerMiloQuery,
  GetDetailSessionConseillerMiloQueryHandler
} from 'src/application/queries/milo/get-detail-session-conseiller.milo.query.handler.db'
import { unDetailSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { getDatabase } from 'test/utils/database-for-testing'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'

describe('GetDetailSessionConseillerMiloQueryHandler', () => {
  let getDetailSessionMiloQueryHandler: GetDetailSessionConseillerMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    getDetailSessionMiloQueryHandler =
      new GetDetailSessionConseillerMiloQueryHandler(
        miloClient,
        conseillerRepository,
        conseillerAuthorizer,
        keycloakClient
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query = {
        idSession: 'idSession',
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
      }
      getDetailSessionMiloQueryHandler.authorize(
        query,
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })

  describe('handle', () => {
    it("renvoie une failure quand le conseiller Milo n'existe pas", async () => {
      // Given
      const query = {
        idSession: 'idSession-1',
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token'
      }
      conseillerRepository.get
        .withArgs(query.idConseiller)
        .resolves(failure(new ConseillerMiloSansStructure(query.idConseiller)))

      // When
      const result = await getDetailSessionMiloQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(
        failure(new ConseillerMiloSansStructure(query.idConseiller))
      )
    })

    describe("récupère le detail d'une session", async () => {
      let conseiller: ConseillerMilo
      let query: GetDetailSessionConseillerMiloQuery
      beforeEach(async () => {
        query = {
          idSession: unDetailSessionConseillerDto.session.id.toString(),
          idConseiller: 'idConseiller-1',
          token: 'bearer un-token'
        }
        const idpToken = 'idpToken'
        conseiller = unConseillerMilo()
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
        miloClient.getDetailSessionConseiller
          .withArgs(idpToken, query.idSession)
          .resolves(success(unDetailSessionConseillerDto))
        miloClient.getListeInscritsSessionConseillers
          .withArgs(idpToken, query.idSession)
          .resolves(
            success([
              uneInscriptionSessionMiloDto({
                idDossier: 12345,
                statut: 'ONGOING'
              }),
              uneInscriptionSessionMiloDto({
                idDossier: 12345,
                statut: 'REFUSAL'
              }),
              uneInscriptionSessionMiloDto({
                idDossier: 12345,
                statut: 'REFUSAL_YOUNG'
              }),
              uneInscriptionSessionMiloDto({ idDossier: 67890 })
            ])
          )
        await StructureMiloSqlModel.create({
          ...conseiller.structure,
          nomOfficiel: 'Structure Milo'
        })
        await ConseillerSqlModel.create(unConseillerDto())
        await JeuneSqlModel.create(
          unJeuneDto({ id: 'id-jeune', idPartenaire: '12345' })
        )
      })

      it('quand elle n’existe pas en base, avec une visibilité à false', async () => {
        // When
        const result = await getDetailSessionMiloQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success({
            ...unDetailSessionConseillerMiloQueryModel,
            inscriptions: [
              {
                idJeune: 'id-jeune',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.INSCRIT
              },
              {
                idJeune: 'id-jeune',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.REFUS_TIERS
              },
              {
                idJeune: 'id-jeune',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
              }
            ]
          })
        )
      })

      describe('quand elle existe en base', () => {
        beforeEach(async () => {
          await SessionMiloSqlModel.create({
            id: unDetailSessionConseillerDto.session.id.toString(),
            estVisible: true,
            idStructureMilo: conseiller.structure.id,
            dateModification: DateTime.now().toJSDate()
          })
        })

        afterEach(async () => {
          await getDatabase().cleanPG()
        })

        it('avec la bonne visibilité', async () => {
          // When
          const result = await getDetailSessionMiloQueryHandler.handle(query)

          // Then
          expect(result).to.deep.equal(
            success({
              ...unDetailSessionConseillerMiloQueryModel,
              session: {
                ...unDetailSessionConseillerMiloQueryModel.session,
                estVisible: true
              },
              inscriptions: [
                {
                  idJeune: 'id-jeune',
                  nom: 'Granger',
                  prenom: 'Hermione',
                  statut: SessionMilo.Inscription.Statut.INSCRIT
                },
                {
                  idJeune: 'id-jeune',
                  nom: 'Granger',
                  prenom: 'Hermione',
                  statut: SessionMilo.Inscription.Statut.REFUS_TIERS
                },
                {
                  idJeune: 'id-jeune',
                  nom: 'Granger',
                  prenom: 'Hermione',
                  statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
                }
              ]
            })
          )
        })
      })
    })
  })
})
