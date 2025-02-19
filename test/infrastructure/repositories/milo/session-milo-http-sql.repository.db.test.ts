import { HttpService } from '@nestjs/axios'
import { DateTime } from 'luxon'
import * as nock from 'nock'
import {
  emptySuccess,
  isSuccess,
  Success,
  success
} from 'src/building-blocks/types/result'
import {
  SessionMilo,
  SessionMiloAllegeeForBeneficiaire
} from 'src/domain/milo/session.milo'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { SessionMiloHttpSqlRepository } from 'src/infrastructure/repositories/milo/session-milo-http-sql.repository.db'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneDatetime } from 'test/fixtures/date.fixture'
import {
  unDetailSessionConseillerDto,
  unDetailSessionJeuneDto,
  uneInscriptionSessionMiloDto
} from 'test/fixtures/milo-dto.fixture'
import { uneSessionMilo } from 'test/fixtures/sessions.fixture'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'
import { PlanificateurService } from '../../../../src/domain/planificateur'
import {
  MILO_INSCRIT,
  MILO_PRESENT,
  MILO_REFUS_JEUNE,
  MILO_REFUS_TIERS
} from '../../../../src/infrastructure/clients/dto/milo.dto'
import { InstanceSessionMiloDto } from '../../../../src/infrastructure/repositories/dto/milo.dto'
import { RateLimiterService } from '../../../../src/utils/rate-limiter.service'
import { uneInstanceSessionMilo } from '../../../fixtures/milo.fixture'
import { expect, sinon, StubbedClass, stubClass } from '../../../utils'
import { testConfig } from '../../../utils/module-for-testing'

const structureConseiller = {
  id: 'structure-milo',
  timezone: 'America/Cayenne'
}

describe('SessionMiloHttpSqlRepository', () => {
  let miloClient: StubbedClass<MiloClient>
  let repository: SessionMiloHttpSqlRepository
  let planificateurService: StubbedClass<PlanificateurService>
  const configService = testConfig()
  const rateLimiterService = new RateLimiterService(configService)

  beforeEach(async () => {
    const httpService = new HttpService()
    planificateurService = stubClass(PlanificateurService)
    await getDatabase().cleanPG()

    miloClient = stubClass(MiloClient)
    repository = new SessionMiloHttpSqlRepository(
      miloClient,
      httpService,
      configService,
      rateLimiterService,
      planificateurService
    )
  })
  describe('findInstanceSession', () => {
    const idDossier = '1234'
    const idInstance = '5678'

    describe('quand elle existe', () => {
      it('renvoie la session milo', async () => {
        // Given
        const sessionJson: InstanceSessionMiloDto = {
          lieu: 'la',
          nom: 'je suis un titre mais en fait le nom',
          idSession: '123456',
          id: idInstance,
          dateHeureDebut: '2020-10-06 10:00:00',
          dateHeureFin: '2020-10-06 12:00:00',
          idDossier: idDossier,
          commentaire: 'un petit commentaire plus ou moins long',
          statut: 'Prescrit'
        }
        nock('https://milo.com')
          .get(`/operateurs/dossiers/${idDossier}/sessions/${idInstance}`)
          .reply(200, JSON.stringify(sessionJson))
          .isDone()

        // When
        const resultat = await repository.findInstanceSession(
          idInstance,
          idDossier
        )

        // Then
        const expected = uneInstanceSessionMilo({
          id: '5678',
          idDossier: idDossier,
          statut: 'Prescrit',
          dateHeureDebut: '2020-10-06 10:00:00',
          idSession: '123456'
        })
        expect(resultat).to.deep.equal(expected)
      })
    })

    describe('quand elle n’existe pas', () => {
      it('renvoie undefined', async () => {
        // Given
        nock('https://milo.com')
          .get(`/operateurs/dossiers/${idDossier}/sessions/${idInstance}`)
          .reply(404)
          .isDone()

        // When
        const resultat = await repository.findInstanceSession(
          idInstance,
          idDossier
        )

        // Then
        expect(resultat).to.be.undefined()
      })
    })
  })

  describe('.getForConseiller', () => {
    const idSession = 'idSession'
    const tokenMilo = 'token-milo'

    beforeEach(async () => {
      // Given
      miloClient.getDetailSessionConseiller.resolves(
        success(unDetailSessionConseillerDto)
      )
      miloClient.getListeInscritsSession.resolves(
        success([
          uneInscriptionSessionMiloDto({
            idDossier: 1,
            idInstanceSession: 1,
            nom: 'Granger',
            prenom: 'Hermione',
            statut: MILO_INSCRIT
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 2,
            idInstanceSession: 2,
            nom: 'Weasley',
            prenom: 'Ronald',
            statut: MILO_REFUS_TIERS
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 3,
            idInstanceSession: 3,
            nom: 'Potter',
            prenom: 'Harry',
            statut: MILO_REFUS_JEUNE
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 4,
            idInstanceSession: 4,
            nom: 'Hagrid',
            prenom: 'Rubeus',
            statut: MILO_REFUS_JEUNE
          })
        ])
      )

      await StructureMiloSqlModel.create({
        ...structureConseiller,
        nomOfficiel: 'Structure Milo'
      })
      await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({ id: 'id-hermione', idPartenaire: '1' }),
        unJeuneDto({ id: 'id-ron', idPartenaire: '2' }),
        unJeuneDto({ id: 'id-harry', idPartenaire: '3' })
      ])
    })

    it('récupère les informations nécessaires', async () => {
      // When
      await repository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      expect(
        miloClient.getDetailSessionConseiller
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession)
      expect(
        miloClient.getListeInscritsSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession)
    })

    it('reconstruit la session avec les inscrits et les dates dans la timezone du conseiller', async () => {
      // When
      const actual = await repository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      expect(actual).to.deep.equal(
        success(
          uneSessionMilo({
            dateMaxInscription: DateTime.fromISO('2020-04-07', {
              zone: structureConseiller.timezone
            }).endOf('day'),
            inscriptions: [
              {
                idJeune: 'id-hermione',
                idInscription: '1',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.INSCRIT
              },
              {
                idJeune: 'id-ron',
                idInscription: '2',
                nom: 'Weasley',
                prenom: 'Ronald',
                statut: SessionMilo.Inscription.Statut.REFUS_TIERS
              },
              {
                idJeune: 'id-harry',
                idInscription: '3',
                nom: 'Potter',
                prenom: 'Harry',
                statut: SessionMilo.Inscription.Statut.REFUS_JEUNE
              }
            ]
          })
        )
      )
    })

    it('récupère le paramétrage de la session si elle a été modifiée', async () => {
      // Given
      const now = DateTime.now()
      await SessionMiloSqlModel.create({
        id: idSession,
        estVisible: true,
        autoinscription: false,
        idStructureMilo: structureConseiller.id,
        dateModification: now.toJSDate()
      })

      // When
      const actual = await repository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      const actualSession = (actual as Success<SessionMilo>).data
      expect(actualSession.estVisible).to.be.true()
      expect(actualSession.autoinscription).to.be.false()
      expect(actualSession.dateModification).to.deep.equal(now)
    })
  })

  describe('.save', () => {
    const idStructure = 'structure-1'
    const idSession = 'session-1'
    const tokenMilo = 'token-milo'
    let session: SessionMilo & { dateModification: DateTime }
    beforeEach(async () => {
      // Given
      miloClient.inscrireJeunesSession.resolves(
        success([
          {
            id: 12,
            idDossier: 34,
            idSession: 56,
            statut: 'test'
          }
        ])
      )
      miloClient.desinscrireJeunesSession.resolves(emptySuccess())
      miloClient.modifierInscriptionJeunesSession.resolves(emptySuccess())
      await StructureMiloSqlModel.create({
        id: idStructure,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({ id: 'id-hermione', idPartenaire: 'id-dossier-hermione' }),
        unJeuneDto({ id: 'id-ron', idPartenaire: 'id-dossier-ron' }),
        unJeuneDto({ id: 'id-harry', idPartenaire: 'id-dossier-harry' }),
        unJeuneDto({ id: 'id-ginny', idPartenaire: 'id-dossier-ginny' }),
        unJeuneDto({ id: 'id-luna', idPartenaire: 'id-dossier-luna' }),
        unJeuneDto({ id: 'id-fred', idPartenaire: 'id-dossier-fred' }),
        unJeuneDto({ id: 'id-rogue', idPartenaire: 'id-dossier-rogue' })
      ])

      session = {
        ...uneSessionMilo({
          id: idSession,
          idStructureMilo: idStructure,
          estVisible: true,
          autoinscription: true,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              idInscription: 'id-inscription-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              idInscription: 'id-inscription-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-harry',
              idInscription: 'id-inscription-harry',
              nom: 'Potter',
              prenom: 'Harry',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              idJeune: 'id-rogue',
              idInscription: 'id-inscription-rogue',
              nom: 'Rogue',
              prenom: 'Severus',
              statut: SessionMilo.Inscription.Statut.PRESENT
            }
          ]
        }),
        dateModification: uneDatetime().minus({ day: 1 })
      }

      // When
      await repository.save(
        session,
        {
          idsJeunesAInscrire: ['id-hermione', 'id-ron'],
          inscriptionsASupprimer: [
            { idJeune: 'id-harry', idInscription: 'id-inscription-harry' }
          ],
          inscriptionsAModifier: [
            {
              idJeune: 'id-ginny',
              idInscription: 'id-inscription-ginny',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-luna',
              idInscription: 'id-inscription-luna',
              statut: SessionMilo.Inscription.Statut.REFUS_JEUNE,
              commentaire: 'J’ai pas envie'
            },
            {
              idJeune: 'id-fred',
              idInscription: 'id-inscription-fred',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            },
            {
              idJeune: 'id-rogue',
              idInscription: 'id-inscription-rogue',
              statut: SessionMilo.Inscription.Statut.PRESENT
            }
          ]
        },
        tokenMilo
      )
    })

    it('sauvegarde la session en base', async () => {
      // Then
      const sessionTrouve = await SessionMiloSqlModel.findByPk(idSession)
      expect(sessionTrouve!.id).to.equal(idSession)
      expect(sessionTrouve!.idStructureMilo).to.equal(idStructure)
      expect(sessionTrouve!.estVisible).to.equal(true)
      expect(sessionTrouve!.autoinscription).to.equal(true)
      expect(sessionTrouve!.dateModification).to.deep.equal(
        uneDatetime().minus({ day: 1 }).toJSDate()
      )
    })

    it('modifie la session en base', async () => {
      // Given
      const sessionModifiee = {
        ...uneSessionMilo({
          id: idSession,
          idStructureMilo: idStructure,
          estVisible: false,
          autoinscription: false
        }),
        dateModification: uneDatetime()
      }

      // When
      await repository.save(
        sessionModifiee,
        {
          idsJeunesAInscrire: [],
          inscriptionsASupprimer: [],
          inscriptionsAModifier: []
        },
        tokenMilo
      )

      // Then
      const sessionTrouve = await SessionMiloSqlModel.findByPk(idSession)
      expect(sessionTrouve!.estVisible).to.equal(false)
      expect(sessionTrouve!.autoinscription).to.equal(false)
      expect(sessionTrouve!.dateModification).to.deep.equal(
        uneDatetime().toJSDate()
      )
    })

    it('soumet les modifications d’inscriptions à Milo', async () => {
      // Then
      sinon.assert.callOrder(
        miloClient.desinscrireJeunesSession,
        miloClient.modifierInscriptionJeunesSession,
        miloClient.inscrireJeunesSession
      )

      expect(
        miloClient.desinscrireJeunesSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, [
        {
          idDossier: 'id-dossier-harry',
          idInstanceSession: 'id-inscription-harry'
        }
      ])
      expect(
        planificateurService.supprimerRappelsParId.getCall(0).args
      ).to.deep.equal([`instance-session:id-inscription-harry`])
      expect(
        planificateurService.supprimerRappelsParId.getCall(1).args
      ).to.deep.equal([`instance-session:id-inscription-rogue`])
      expect(
        planificateurService.supprimerRappelsParId.getCall(2).args
      ).to.deep.equal([`instance-session:id-inscription-fred`])
      expect(
        planificateurService.supprimerRappelsParId.getCall(3).args
      ).to.deep.equal([`instance-session:id-inscription-luna`])
      expect(
        planificateurService.supprimerRappelsParId
      ).not.to.have.been.calledWith(`instance-session:id-inscription-ginny`)
      expect(
        planificateurService.planifierRappelsInstanceSessionMilo.getCall(0).args
      ).to.deep.equal([
        {
          idInstance: 'id-inscription-ginny',
          idDossier: 'id-dossier-ginny',
          idSession: 'session-1',
          dateDebut: session.debut
        }
      ])
      expect(
        planificateurService.planifierRappelsInstanceSessionMilo.getCall(1).args
      ).to.deep.equal([
        {
          idInstance: '12',
          idDossier: '34',
          idSession: '56',
          dateDebut: session.debut
        }
      ])
      expect(
        miloClient.modifierInscriptionJeunesSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, [
        {
          idDossier: 'id-dossier-rogue',
          idInstanceSession: 'id-inscription-rogue',
          statut: MILO_PRESENT,
          dateDebutReelle: '2020-04-06'
        },
        {
          idDossier: 'id-dossier-fred',
          idInstanceSession: 'id-inscription-fred',
          statut: MILO_REFUS_TIERS
        },
        {
          idDossier: 'id-dossier-luna',
          idInstanceSession: 'id-inscription-luna',
          statut: MILO_REFUS_JEUNE,
          commentaire: 'J’ai pas envie'
        },
        {
          idDossier: 'id-dossier-ginny',
          idInstanceSession: 'id-inscription-ginny',
          statut: MILO_INSCRIT
        }
      ])
      expect(
        miloClient.inscrireJeunesSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession, [
        'id-dossier-hermione',
        'id-dossier-ron'
      ])
    })
  })

  describe('.getForBeneficiaire', () => {
    it('récupère le minimum des informations de la session', async () => {
      // Given
      miloClient.getDetailSessionJeune.resolves(
        success(unDetailSessionJeuneDto)
      )

      // When
      const result = await repository.getForBeneficiaire(
        'idSession',
        'id-dossier',
        'token-milo',
        'Europe/Paris'
      )

      // Then
      expect(isSuccess(result)).to.be.true()
      expect(
        (result as Success<SessionMiloAllegeeForBeneficiaire>).data
      ).to.deep.equal({
        id: 'idSession',
        nom: 'Une-session',
        debut: DateTime.fromISO('2020-04-06T10:20:00', {
          zone: 'Europe/Paris'
        }),
        nbPlacesDisponibles: 10,
        statutInscription: undefined
      })
    })
  })

  describe('.inscrireBeneficiaire', () => {
    it('inscrit le bénéficiaire à la session', async () => {
      // Given
      const idSession = '67890'
      const idDossier = '12345'
      miloClient.inscrireJeunesSession
        .withArgs('token-milo-conseiller', idSession, [idDossier])
        .resolves(
          success([
            {
              id: 1,
              idDossier: parseInt(idSession),
              idSession: parseInt(idDossier),
              statut: 'test'
            }
          ])
        )

      // When
      const result = await repository.inscrireBeneficiaire(
        idSession,
        idDossier,
        'token-milo-conseiller'
      )

      // Then
      expect(isSuccess(result)).to.equal(true)
    })
  })
})
