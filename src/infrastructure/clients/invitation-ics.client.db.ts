import { Inject, Injectable } from '@nestjs/common'
import { QueryTypes, Sequelize } from 'sequelize'
import { SequelizeInjectionToken } from '../sequelize/providers'
import { Conseiller } from '../../domain/milo/conseiller'
import {
  CodeTypeRendezVous,
  mapCodeLabelTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous/rendez-vous'
import * as icsService from 'ics'
import {
  formaterDateRendezVous,
  formaterHeureRendezVous,
  ICS
} from './mail-brevo.service.db'
import { Attendee, EventAttributes } from 'ics'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InvitationIcsClient {
  private noReplyContactEmail: string

  constructor(
    @Inject(SequelizeInjectionToken) private readonly sequelize: Sequelize,
    private configService: ConfigService
  ) {
    this.noReplyContactEmail =
      this.configService.get('noReplyContactEmail') ?? ''
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
    operation: RendezVous.Operation
  ): ICS {
    const event = this.creerEvenementRendezVous(
      conseiller,
      rendezVous,
      icsSequence,
      operation
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
    operation: RendezVous.Operation
  ): EventAttributes {
    const dateRendezVousUtc = new Date(
      Date.UTC(
        rendezVous.date.getUTCFullYear(),
        rendezVous.date.getUTCMonth(),
        rendezVous.date.getUTCDate(),
        rendezVous.date.getUTCHours(),
        rendezVous.date.getUTCMinutes(),
        rendezVous.date.getUTCSeconds()
      )
    )

    const jeunesAttendeesAvecEmail: Attendee[] = rendezVous.jeunes
      .filter(jeune => jeune.email)
      .map(jeune => ({
        name: jeune.lastName + ' ' + jeune.firstName,
        email: jeune.email,
        rsvp: operation !== RendezVous.Operation.SUPPRESSION,
        role: 'REQ-PARTICIPANT'
      }))

    const headerTitreEvenement =
      rendezVous.type === CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER &&
      jeunesAttendeesAvecEmail[0]?.name
        ? `[CEJ] ${jeunesAttendeesAvecEmail[0].name} -`
        : '[CEJ]'

    return {
      uid: rendezVous.id,
      sequence: icsSequence,
      startInputType: 'utc',
      start: [
        dateRendezVousUtc.getFullYear(),
        dateRendezVousUtc.getMonth() + 1,
        dateRendezVousUtc.getDate(),
        dateRendezVousUtc.getUTCHours(),
        dateRendezVousUtc.getMinutes()
      ],
      title: `${headerTitreEvenement} ${
        mapCodeLabelTypeRendezVous[rendezVous.type]
      }`,
      description:
        "Création d'un nouveau rendez-vous\n" +
        `Vous avez créé un rendez-vous de type ${
          mapCodeLabelTypeRendezVous[rendezVous.type]
        } pour le ${formaterDateRendezVous(
          rendezVous.date
        )} à ${formaterHeureRendezVous(rendezVous.date)} .\n` +
        "Pour l'intégrer à votre agenda, vous devez accepter cette invitation." +
        'Attention, les modifications et refus effectués directement dans votre agenda ne sont pas pris en compte dans votre portail CEJ.\n' +
        'Bonne journée',
      duration: { minutes: rendezVous.duree },
      organizer: {
        name: conseiller.lastName + ' ' + conseiller.firstName,
        email: this.noReplyContactEmail
      },
      method:
        operation === RendezVous.Operation.SUPPRESSION ? 'CANCEL' : 'REQUEST',
      attendees: [
        {
          name: conseiller.lastName + ' ' + conseiller.firstName,
          email: conseiller.email,
          rsvp: operation !== RendezVous.Operation.SUPPRESSION,
          role: 'REQ-PARTICIPANT'
        },
        ...jeunesAttendeesAvecEmail
      ],
      status:
        operation === RendezVous.Operation.SUPPRESSION
          ? 'CANCELLED'
          : 'CONFIRMED'
    }
  }
}
