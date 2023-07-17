import { DateTime } from 'luxon'
import { Success, success } from '../../../../src/building-blocks/types/result'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { SessionMiloHttpSqlRepository } from '../../../../src/infrastructure/repositories/milo/session-milo-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { SessionMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneDatetime } from '../../../fixtures/date.fixture'
import {
  unDetailSessionConseillerDto,
  uneInscriptionSessionMiloDto
} from '../../../fixtures/milo-dto.fixture'
import { uneSessionMilo } from '../../../fixtures/sessions.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

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
    const structureConseiller = {
      id: 'structure-milo',
      timezone: 'America/Cayenne'
    }
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
            nom: 'Granger',
            prenom: 'Hermione',
            statut: 'ONGOING'
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 2,
            nom: 'Weasley',
            prenom: 'Ronald',
            statut: 'REFUSAL'
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 3,
            nom: 'Potter',
            prenom: 'Harry',
            statut: 'REFUSAL_YOUNG'
          }),
          uneInscriptionSessionMiloDto({ idDossier: 4 })
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
            inscriptions: [
              {
                idJeune: 'id-hermione',
                nom: 'Granger',
                prenom: 'Hermione',
                statut: SessionMilo.Inscription.Statut.INSCRIT
              },
              {
                idJeune: 'id-ron',
                nom: 'Weasley',
                prenom: 'Ronald',
                statut: SessionMilo.Inscription.Statut.REFUS_TIERS
              },
              {
                idJeune: 'id-harry',
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
      await StructureMiloSqlModel.create({
        id: idStructure,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })
      await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({ id: 'id-hermione', idPartenaire: 'id-dossier-hermione' }),
        unJeuneDto({ id: 'id-ron', idPartenaire: 'id-dossier-ron' }),
        unJeuneDto({ id: 'id-harry', idPartenaire: 'id-dossier-harry' })
      ])

      session = {
        ...uneSessionMilo({
          id: idSession,
          idStructureMilo: idStructure,
          estVisible: true,
          inscriptions: [
            {
              idJeune: 'id-hermione',
              nom: 'Granger',
              prenom: 'Hermione',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-ron',
              nom: 'Weasley',
              prenom: 'Ronald',
              statut: SessionMilo.Inscription.Statut.INSCRIT
            },
            {
              idJeune: 'id-harry',
              nom: 'Potter',
              prenom: 'Harry',
              statut: SessionMilo.Inscription.Statut.REFUS_TIERS
            }
          ]
        }),
        dateModification: uneDatetime().minus({ day: 1 })
      }

      // When
      await sessionMiloHttpSqlRepository.save(
        session,
        [
          {
            idJeune: 'id-hermione',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          },
          {
            idJeune: 'id-ron',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          },
          {
            idJeune: 'id-harry',
            statut: SessionMilo.Inscription.Statut.REFUS_TIERS
          }
        ],
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
      await sessionMiloHttpSqlRepository.save(sessionModifiee, [], tokenMilo)

      // Then
      const sessionTrouve = await SessionMiloSqlModel.findByPk(idSession)
      expect(sessionTrouve!.estVisible).to.equal(false)
      expect(sessionTrouve!.dateModification).to.deep.equal(
        uneDatetime().toJSDate()
      )
    })

    it('inscrit les participants', async () => {
      // Then
      expect(
        miloClient.inscrireJeunesSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession, [
        'id-dossier-hermione',
        'id-dossier-ron'
      ])
    })

    it('ne réinscrit pas les participants déjà inscrits', async () => {
      // Given
      const sessionModifiee = {
        ...session,
        inscriptions: [
          ...session.inscriptions,
          {
            idJeune: 'id-harry',
            nom: 'Potter',
            prenom: 'Harry',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          }
        ]
      }

      // When
      await sessionMiloHttpSqlRepository.save(
        sessionModifiee,
        [
          {
            idJeune: 'id-harry',
            statut: SessionMilo.Inscription.Statut.INSCRIT
          }
        ],
        tokenMilo
      )

      // Then
      expect(miloClient.inscrireJeunesSession).to.have.been.calledWithExactly(
        tokenMilo,
        idSession,
        ['id-dossier-harry']
      )
    })
  })
})
