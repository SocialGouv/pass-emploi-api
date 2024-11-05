import { unJeune } from 'test/fixtures/jeune.fixture'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous/rendez-vous'
import { InvitationIcsClient } from '../../../src/infrastructure/clients/invitation-ics.client'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { expect } from '../../utils'
import { testConfig } from '../../utils/module-for-testing'

describe('InvitationIcsClient', () => {
  let invitationIcsClient: InvitationIcsClient
  const config = testConfig()

  before(() => {})

  beforeEach(async () => {
    invitationIcsClient = new InvitationIcsClient(config)
  })

  describe('creerEvenementRendezVous', () => {
    it('renvoie le bon évènement du rendez-vous en excluant un jeune sans email', async () => {
      // Given
      const conseiller = unConseiller()
      const unJeuneAvecEmail = unJeune({ email: 'test@test.com' })
      const unJeuneSansEmail = unJeune({ email: undefined })
      const rendezVous = unRendezVous({
        jeunes: [unJeuneAvecEmail, unJeuneSansEmail],
        type: CodeTypeRendezVous.ACTIVITE_EXTERIEURES
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
          "Création d'un nouveau rendez-vous\nVous avez créé un rendez-vous de type Activités extérieures pour le jeudi 11 novembre 2021 à 09h03 .\nPour l'intégrer à votre agenda, vous devez accepter cette invitation.Attention, les modifications et refus effectués directement dans votre agenda ne sont pas pris en compte dans votre portail CEJ.\nBonne journée",
        duration: {
          minutes: 30
        },
        method: 'REQUEST',
        organizer: {
          email: 'no-reply@pass-emploi.beta.gouv.fr',
          name: 'Tavernier Nils'
        },
        sequence: 0,
        start: [2021, 11, 11, 8, 3],
        startInputType: 'utc',
        title: '[CEJ] Activités extérieures',
        uid: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
        status: 'CONFIRMED'
      })
    })
    it('renvoie le bon évènement du rendez-vous avec les infos du jeune dans le titre', async () => {
      // Given
      const conseiller = unConseiller()
      const unJeuneSansEmail = unJeune({ email: undefined })
      const unJeuneAvecEmail = unJeune({ email: 'test@test.com' })
      const rendezVous = unRendezVous({
        jeunes: [unJeuneSansEmail, unJeuneAvecEmail]
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
          email: 'no-reply@pass-emploi.beta.gouv.fr',
          name: 'Tavernier Nils'
        },
        sequence: 0,
        start: [2021, 11, 11, 8, 3],
        startInputType: 'utc',
        title: '[CEJ] Doe John - Entretien individuel conseiller',
        uid: '20c8ca73-fd8b-4194-8d3c-80b6c9949deb',
        status: 'CONFIRMED'
      })
    })
  })
})
