import { DateTime } from 'luxon'
import {
  emptySuccess,
  Success,
  success
} from 'src/building-blocks/types/result'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { SessionMiloHttpSqlRepository } from 'src/infrastructure/repositories/milo/session-milo-http-sql.repository.db'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneDatetime } from 'test/fixtures/date.fixture'
import {
  unDetailSessionConseillerDto,
  uneInscriptionSessionMiloDto
} from 'test/fixtures/milo-dto.fixture'
import { uneSessionMilo } from 'test/fixtures/sessions.fixture'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { expect, sinon, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from 'test/utils/database-for-testing'
import {
  MILO_INSCRIT,
  MILO_PRESENT,
  MILO_REFUS_JEUNE,
  MILO_REFUS_TIERS
} from '../../../../src/infrastructure/clients/dto/milo.dto'
const structureConseiller = {
  id: 'structure-milo',
  timezone: 'America/Cayenne'
}

describe('SessionMiloHttpSqlRepository', () => {
  let miloClient: StubbedClass<MiloClient>
  let sessionMiloHttpSqlRepository: SessionMiloHttpSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()

    miloClient = stubClass(MiloClient)
    sessionMiloHttpSqlRepository = new SessionMiloHttpSqlRepository(miloClient)
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
      await sessionMiloHttpSqlRepository.getForConseiller(
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
      const actual = await sessionMiloHttpSqlRepository.getForConseiller(
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
            }),
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

    it('récupère la visibilité si elle a été modifiée', async () => {
      // Given
      const now = DateTime.now()
      await SessionMiloSqlModel.create({
        id: idSession,
        estVisible: true,
        idStructureMilo: structureConseiller.id,
        dateModification: now.toJSDate()
      })

      // When
      const actual = await sessionMiloHttpSqlRepository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      const actualSession = (actual as Success<SessionMilo>).data
      expect(actualSession.estVisible).to.be.true()
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
      miloClient.inscrireJeunesSession.resolves(emptySuccess())
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
      await sessionMiloHttpSqlRepository.save(
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
      expect(sessionTrouve!.dateModification).to.deep.equal(
        uneDatetime().minus({ day: 1 }).toJSDate()
      )
    })

    it('modifie la session en base', async () => {
      // When
      const sessionModifiee = {
        ...uneSessionMilo({
          id: idSession,
          idStructureMilo: idStructure,
          estVisible: false
        }),
        dateModification: uneDatetime()
      }
      await sessionMiloHttpSqlRepository.save(
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
})
