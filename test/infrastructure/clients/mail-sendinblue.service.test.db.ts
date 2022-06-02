import { MailSendinblueService } from '../../../src/infrastructure/clients/mail-sendinblue.service'
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
import { RendezVous } from '../../../src/domain/rendez-vous'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('MailSendinblueService', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let mailSendinblueService: MailSendinblueService
  let invitationIcsClient: InvitationIcsClient
  const config = testConfig()

  beforeEach(() => {
    const httpService = new HttpService()
    invitationIcsClient = new InvitationIcsClient(
      databaseForTesting.sequelize,
      config
    )
    mailSendinblueService = new MailSendinblueService(
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
            config.get('sendinblue').templates.conversationsNonLues
          ),
          params: {
            prenom: conseiller.firstName,
            conversationsNonLues: 22,
            nom: conseiller.lastName,
            lien: config.get('frontEndUrl')
          }
        }
        const scope = nock(config.get('sendinblue').url)
          .post('/v3/smtp/email', JSON.stringify(expectedBody))
          .reply(200)

        // When
        await mailSendinblueService.envoyerMailConversationsNonLues(
          conseiller,
          22
        )

        // Then
        expect(scope.isDone()).to.equal(true)
      })
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
      const result = mailSendinblueService.creerContenuMailRendezVous(
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
      const result = mailSendinblueService.creerContenuMailRendezVous(
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
      const result = mailSendinblueService.creerContenuMailRendezVous(
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
        templateId: parseInt(
          config.get('sendinblue').templates.rendezVousSupprime
        ),
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
            config.get('sendinblue').templates.conversationsNonLues
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
        const scope = nock(config.get('sendinblue').url)
          .post('/v3/smtp/email', JSON.stringify(mailDataDto))
          .reply(200)

        // When
        await mailSendinblueService.envoyer(mailDataDto)

        // Then
        expect(scope.isDone()).to.equal(true)
      })
    })
  })
})
