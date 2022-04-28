import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { SequelizeInjectionToken } from '../sequelize/providers'
import { Conseiller } from '../../domain/conseiller'
import {
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous'
import * as icsService from 'ics'
import {
  formaterDateRendezVous,
  formaterHeureRendezVous,
  ICS
} from './mail-sendinblue.service'
import { EventAttributes } from 'ics'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InvitationIcsClient {
  private passEmploiContactEmail: string

  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private configService: ConfigService
  ) {
    this.passEmploiContactEmail =
      this.configService.get('passEmploiContactEmail') ?? ''
  }
  async getAndIncrementRendezVousIcsSequence(
    idRendezVous: string
  ): Promise<number> {
    const rendezVousIcsSequence = await this.sequelize.query(
      ` UPDATE rendez_vous SET ics_sequence = CASE 
            WHEN ics_sequence IS NOT NULL THEN ics_sequence + 1 ELSE 0 END 
            WHERE id = :idRendezVous
            RETURNING ics_sequence;`,
      {
        type: QueryTypes.UPDATE,
        replacements: { idRendezVous }
      }
    )
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return rendezVousIcsSequence[0][0]['ics_sequence']
  }

  creerFichierInvitationRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous,
    icsSequence: number,
    rendezVousMisAJour?: RendezVous
  ): ICS {
    const event = this.creerEvenementRendezVous(
      conseiller,
      rendezVous,
      icsSequence,
      rendezVousMisAJour
    )
    const { error, value } = icsService.createEvent(event)
    if (error || !value) {
      throw error
    }
    return value
  }

  creerEvenementRendezVous(
    conseiller: Conseiller,
    rendezVous: RendezVous,
    icsSequence: number,
    rendezVousMisAJour?: RendezVous
  ): EventAttributes {
    const rendezVousEvenement = rendezVousMisAJour
      ? rendezVousMisAJour
      : rendezVous
    const dateRendezVousUtc = new Date(
      Date.UTC(
        rendezVousEvenement.date.getUTCFullYear(),
        rendezVousEvenement.date.getUTCMonth(),
        rendezVousEvenement.date.getUTCDate(),
        rendezVousEvenement.date.getUTCHours(),
        rendezVousEvenement.date.getUTCMinutes(),
        rendezVousEvenement.date.getUTCSeconds()
      )
    )
    return {
      uid: rendezVousEvenement.id,
      sequence: icsSequence,
      startInputType: 'utc',
      start: [
        dateRendezVousUtc.getFullYear(),
        dateRendezVousUtc.getMonth() + 1,
        dateRendezVousUtc.getDate(),
        dateRendezVousUtc.getUTCHours(),
        dateRendezVousUtc.getMinutes()
      ],
      title: `[CEJ] ${mapCodeLabelTypeRendezVous[rendezVousEvenement.type]}`,
      description:
        "Création d'un nouveau rendez-vous\n" +
        `Vous avez créé un rendez-vous de type ${
          mapCodeLabelTypeRendezVous[rendezVousEvenement.type]
        } pour le ${formaterDateRendezVous(
          rendezVousEvenement.date
        )} à ${formaterHeureRendezVous(rendezVousEvenement.date)} .\n` +
        "Pour l'intégrer à votre agenda, vous devez accepter cette invitation." +
        'Attention, les modifications et refus effectués directement dans votre agenda ne sont pas pris en compte dans votre portail CEJ.\n' +
        'Bonne journée',
      duration: { minutes: rendezVousEvenement.duree },
      organizer: {
        name: conseiller.lastName + ' ' + conseiller.firstName,
        email: this.passEmploiContactEmail
      },
      method: 'REQUEST',
      attendees: [
        {
          name: conseiller.lastName + ' ' + conseiller.firstName,
          email: conseiller.email,
          rsvp: true,
          role: 'REQ-PARTICIPANT'
        },
        {
          name:
            rendezVousEvenement.jeune.lastName +
            ' ' +
            rendezVousEvenement.jeune.firstName,
          email: rendezVousEvenement.jeune.email,
          rsvp: true,
          role: 'REQ-PARTICIPANT'
        }
      ]
    }
  }
}
