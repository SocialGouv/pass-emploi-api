import { MailBrevoService } from '../../../src/infrastructure/clients/mail-brevo.service.db'
import { HttpService } from '@nestjs/axios'
import { testConfig } from '../../utils/module-for-testing'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import * as nock from 'nock'
import { expect } from '../../utils'
import * as fs from 'fs'
import * as path from 'path'
import { unRendezVous } from '../../fixtures/rendez-vous.fixture'
import { InvitationIcsClient } from '../../../src/infrastructure/clients/invitation-ics.client'
import { MailDataDto } from '../../../src/domain/mail'
import { RendezVous } from '../../../src/domain/rendez-vous/rendez-vous'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'

describe('MailBrevoService', () => {
  let databaseForTesting: DatabaseForTesting
  let mailBrevoService: MailBrevoService
  let invitationIcsClient: InvitationIcsClient
  const config = testConfig()

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    const httpService = new HttpService()
    invitationIcsClient = new InvitationIcsClient(
      databaseForTesting.sequelize,
      config
    )
    mailBrevoService = new MailBrevoService(
      invitationIcsClient,
      httpService,
      config
    )
  })

  describe('envoyerMailConversationsNonLues', () => {
    describe('quand tout va bien', () => {
      it('envoie un mail', async () => {
        // Given
        const conseiller = unConseiller()
        const expectedBody = {
          to: [
            {
              email: conseiller.email,
              name: conseiller.firstName + ' ' + conseiller.lastName
            }
          ],
          templateId: parseInt(
            config.get('brevo').templates.conversationsNonLues
          ),
          params: {
            prenom: conseiller.firstName,
            conversationsNonLues: 22,
            nom: conseiller.lastName,
            lien: config.get('frontEndUrl')
          }
        }
        const scope = nock(config.get('brevo').url)
          .post('/v3/smtp/email', JSON.stringify(expectedBody))
          .reply(200)

        // When
        await mailBrevoService.envoyerMailConversationsNonLues(conseiller, 22)

        // Then
        expect(scope.isDone()).to.equal(true)
      })
    })
  })
  describe('envoyerEmailCreationConseillerMilo', () => {
    it('envoie un email', async () => {
      // Given
      const utilisateurConseiller = unUtilisateurConseiller()
      const expectedBody = {
        to: [
          {
            email: utilisateurConseiller.email,
            name: utilisateurConseiller.prenom + ' ' + utilisateurConseiller.nom
          }
        ],
        templateId: parseInt(
          config.get('brevo').templates.creationConseillerMilo
        ),
        params: {
          prenom: utilisateurConseiller.prenom
        }
      }
      const scope = nock(config.get('brevo').url)
        .post('/v3/smtp/email', JSON.stringify(expectedBody))
        .reply(200)

      // When
      await mailBrevoService.envoyerEmailCreationConseillerMilo(
        utilisateurConseiller
      )

      // Then
      expect(scope.isDone()).to.equal(true)
    })
  })
  describe('envoyerEmailJeuneArchive', () => {
    it('envoie un email avec les bons paramètres', async () => {
      // Given
      const jeune = unJeune()
      const command = {
        jeune,
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
        commentaireMotif: 'test'
      }
      const mailDataDtoAttendu: MailDataDto = {
        to: [
          {
            email: jeune.email,
            name: `${jeune.firstName} ${jeune.lastName}`
          }
        ],
        templateId: parseInt(config.get('brevo').templates.compteJeuneArchive),
        params: {
          prenom: jeune.firstName,
          nom: jeune.lastName,
          motif: command.motif,
          commentaireMotif: 'test'
        }
      }
      const scope = nock(config.get('brevo').url)
        .post('/v3/smtp/email', JSON.stringify(mailDataDtoAttendu))
        .reply(200)

      // When
      await mailBrevoService.envoyerEmailJeuneArchive(
        jeune,
        command.motif,
        command.commentaireMotif
      )

      // Then
      expect(scope.isDone()).to.equal(true)
    })
  })
  describe('creerContenuMailRendezVous', () => {
    it('renvoie le contenu du mail du nouveau rendez-vous', async () => {
      // Given
      const conseiller = unConseiller()
      const rendezVous = unRendezVous()
      const fichierInvitation = fs.readFileSync(
        path.resolve(__dirname, '../../fixtures/invitation-mail.fixture.ics'),
        'utf8'
      )
      const invitationBase64 = Buffer.from(fichierInvitation).toString('base64')

      // When
      const result = mailBrevoService.creerContenuMailRendezVous(
        conseiller,
        rendezVous,
        fichierInvitation,
        RendezVous.Operation.CREATION
      )

      // Then
      expect(result).to.deep.equal({
        attachment: [
          {
            content: invitationBase64,
            name: 'invite.ics'
          }
        ],
        params: {
          dateRdv: 'jeudi 11 novembre 2021',
          heureRdv: '09h03',
          lienPortail: 'http://frontend.com',
          typeRdv: 'Entretien individuel conseiller'
        },
        templateId: 300,
        to: [
          {
            email: 'nils.tavernier@passemploi.com',
            name: 'Nils Tavernier'
          }
        ]
      })
    })
    it('renvoie le contenu du mail du rappel de rendez-vous', async () => {
      // Given
      const conseiller = unConseiller()
      const rendezVous = unRendezVous()
      const fichierInvitation = fs.readFileSync(
        path.resolve(__dirname, '../../fixtures/invitation-mail.fixture.ics'),
        'utf8'
      )
      const invitationBase64 = Buffer.from(fichierInvitation).toString('base64')

      // When
      const result = mailBrevoService.creerContenuMailRendezVous(
        conseiller,
        rendezVous,
        fichierInvitation,
        RendezVous.Operation.MODIFICATION
      )

      // Then
      expect(result).to.deep.equal({
        attachment: [
          {
            content: invitationBase64,
            name: 'invite.ics'
          }
        ],
        params: {
          dateRdv: 'jeudi 11 novembre 2021',
          heureRdv: '09h03',
          lienPortail: 'http://frontend.com',
          typeRdv: 'Entretien individuel conseiller'
        },
        templateId: 400,
        to: [
          {
            email: 'nils.tavernier@passemploi.com',
            name: 'Nils Tavernier'
          }
        ]
      })
    })
    it('renvoie le contenu du mail du rendez-vous supprimé', async () => {
      // Given
      const conseiller = unConseiller()
      const rendezVous = unRendezVous()
      const fichierInvitation = fs.readFileSync(
        path.resolve(
          __dirname,
          '../../fixtures/invitation-mail-annulee.fixture.ics'
        ),
        'utf8'
      )
      const invitationBase64 = Buffer.from(fichierInvitation).toString('base64')

      // When
      const result = mailBrevoService.creerContenuMailRendezVous(
        conseiller,
        rendezVous,
        fichierInvitation,
        RendezVous.Operation.SUPPRESSION
      )

      // Then
      expect(result).to.deep.equal({
        attachment: [
          {
            content: invitationBase64,
            name: 'invite.ics'
          }
        ],
        params: {
          dateRdv: 'jeudi 11 novembre 2021',
          heureRdv: '09h03',
          lienPortail: 'http://frontend.com',
          typeRdv: 'Entretien individuel conseiller'
        },
        templateId: parseInt(config.get('brevo').templates.rendezVousSupprime),
        to: [
          {
            email: 'nils.tavernier@passemploi.com',
            name: 'Nils Tavernier'
          }
        ]
      })
    })
  })
  describe('envoyer', () => {
    describe('quand tout va bien', () => {
      it('envoie un mail', async () => {
        // Given
        const fichierInvitation = fs.readFileSync(
          path.resolve(__dirname, '../../fixtures/invitation-mail.fixture.ics'),
          'utf8'
        )
        const invitationBase64 =
          Buffer.from(fichierInvitation).toString('base64')
        const mailDataDto: MailDataDto = {
          to: [
            {
              email: 'nils.tavernier@passemploi.com',
              name: 'Nils  Tavernier'
            }
          ],
          templateId: parseInt(
            config.get('brevo').templates.conversationsNonLues
          ),
          params: {
            prenom: 'Nils',
            conversationsNonLues: 22,
            nom: 'Tavernier',
            lien: config.get('frontEndUrl')
          },
          attachment: [
            {
              name: 'invite.ics',
              content: invitationBase64
            }
          ]
        }
        const scope = nock(config.get('brevo').url)
          .post('/v3/smtp/email', JSON.stringify(mailDataDto))
          .reply(200)

        // When
        await mailBrevoService.envoyer(mailDataDto)

        // Then
        expect(scope.isDone()).to.equal(true)
      })
    })
  })
})
