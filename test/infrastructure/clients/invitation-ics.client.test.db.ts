import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect } from '../../utils'
import { InvitationIcsClient } from '../../../src/infrastructure/clients/invitation-ics.client'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { testConfig } from '../../utils/module-for-testing'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { databaseForTesting } from '../../test-with-bd.test'

describe('InvitationIcsClient', () => {
  let invitationIcsClient: InvitationIcsClient
  const config = testConfig()

  beforeEach(async () => {
    invitationIcsClient = new InvitationIcsClient(
      databaseForTesting.sequelize,
      config
    )

    // Given
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(unJeuneDto())
  })

  describe('getAndIncrementRendezVousIcsSequence', () => {
    describe('quand le rdv a une séquence ics qui est nulle', () => {
      it('initialise la séquence ics à 0', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv
        })
        await RendezVousSqlModel.create(unRendezVous)
        // When
        const rendezVousIcsSequence =
          await invitationIcsClient.getAndIncrementRendezVousIcsSequence(idRdv)
        // Then
        expect(rendezVousIcsSequence).to.equal(0)
      })
    })
    describe('quand le rdv a une séquence ics non nulle', () => {
      it('incrémente la séquence ics', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv,
          icsSequence: 0
        })
        await RendezVousSqlModel.create(unRendezVous)
        // When
        const rendezVousIcsSequence =
          await invitationIcsClient.getAndIncrementRendezVousIcsSequence(idRdv)
        // Then
        expect(rendezVousIcsSequence).to.equal(1)
      })
    })
  })
  describe('creerEvenementRendezVous', () => {
    it('renvoie le bon évènement du rendez-vous en excluant un jeune sans email', async () => {
      // Given
      const conseiller = unConseiller()
      const unJeuneAvecEmail = unJeune({ email: 'test@test.com' })
      const unJeuneSansEmail = unJeune({ email: undefined })
      const rendezVous = unRendezVous({
        jeunes: [unJeuneAvecEmail, unJeuneSansEmail]
      })
      const icsSequence = 0

      // When
      const result = invitationIcsClient.creerEvenementRendezVous(
        conseiller,
        rendezVous,
        icsSequence,
        RendezVous.Operation.CREATION
      )

      // Then
      expect(result).to.deep.equal({
        attendees: [
          {
            email: 'nils.tavernier@passemploi.com',
            name: 'Tavernier Nils',
            role: 'REQ-PARTICIPANT',
            rsvp: true
          },
          {
            name: 'Doe John',
            role: 'REQ-PARTICIPANT',
            email: unJeuneAvecEmail.email,
            rsvp: true
          }
        ],
        description:
          "Création d'un nouveau rendez-vous\nVous avez créé un rendez-vous de type Entretien individuel conseiller pour le jeudi 11 novembre 2021 à 09h03 .\nPour l'intégrer à votre agenda, vous devez accepter cette invitation.Attention, les modifications et refus effectués directement dans votre agenda ne sont pas pris en compte dans votre portail CEJ.\nBonne journée",
        duration: {
          minutes: 30
        },
        method: 'REQUEST',
        organizer: {
          email: 'pass.emploi.contact@gmail.com',
          name: 'Tavernier Nils'
        },
        sequence: 0,
        start: [2021, 11, 11, 8, 3],
        startInputType: 'utc',
        title: '[CEJ] Entretien individuel conseiller',
        uid: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
        status: 'CONFIRMED'
      })
    })
  })
})
