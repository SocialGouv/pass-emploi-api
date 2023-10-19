import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { IdService } from '../../utils/id-service'
import {
  CodeTypeRendezVous,
  JeuneDuRendezVous,
  RendezVous
} from '../rendez-vous/rendez-vous'
import Source = RendezVous.Source
import { EvenementMilo } from './evenement.milo'

const MILO_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

export const RendezVousMiloRepositoryToken = 'RendezVousMiloRepositoryToken'

export interface RendezVousMilo {
  id: string
  dateHeureDebut: string
  dateHeureFin?: string
  titre: string
  idPartenaireBeneficiaire: string
  commentaire?: string
  modalite?: string
  adresse?: string
  statut: string
}

export namespace RendezVousMilo {
  export enum Statut {
    RDV_ABSENT = 'Absent',
    RDV_ANNULE = 'Annulé',
    RDV_NON_PRECISE = 'Non précisé',
    RDV_PLANIFIE = 'Planifié',
    RDV_PRESENT = 'Présent',
    RDV_REPORTE = 'Reporté'
  }

  export interface Repository {
    findRendezVousByEvenement(
      evenement: EvenementMilo
    ): Promise<RendezVousMilo | undefined>
  }

  export function timezonerDateMilo(
    dateString: string,
    jeune: JeuneDuRendezVous
  ): DateTime {
    return DateTime.fromFormat(dateString, MILO_DATE_FORMAT, {
      zone: jeune.configuration.fuseauHoraire ?? 'Europe/Paris'
    })
  }

  @Injectable()
  export class Factory {
    constructor(private idService: IdService) {}

    createRendezVousCEJ(
      rendezVousMilo: RendezVousMilo,
      jeune: JeuneDuRendezVous
    ): RendezVous {
      const { dateTimeDebut, duree } = this.getDateEtDuree(
        rendezVousMilo,
        jeune
      )
      return {
        id: this.idService.uuid(),
        source: Source.MILO,
        titre: rendezVousMilo.titre,
        sousTitre: '',
        date: dateTimeDebut.toJSDate(),
        duree,
        jeunes: [
          {
            id: jeune.id,
            firstName: jeune.firstName,
            lastName: jeune.lastName,
            email: jeune.email,
            configuration: jeune.configuration,
            conseiller: jeune.conseiller
          }
        ],
        type: CodeTypeRendezVous.RENDEZ_VOUS_MILO,
        presenceConseiller: true,
        commentaire: rendezVousMilo.commentaire,
        adresse: rendezVousMilo.adresse,
        modalite: rendezVousMilo.modalite,
        createur: { id: '', nom: '', prenom: '' },
        informationsPartenaire: {
          id: rendezVousMilo.id,
          type: EvenementMilo.ObjetEvenement.RENDEZ_VOUS
        }
      }
    }

    updateRendezVousCEJ(
      rendezVousPassEmploi: RendezVous,
      rendezVousMilo: RendezVousMilo
    ): RendezVous {
      const { dateTimeDebut, duree } = this.getDateEtDuree(
        rendezVousMilo,
        rendezVousPassEmploi.jeunes[0]
      )
      return {
        ...rendezVousPassEmploi,
        titre: rendezVousMilo.titre,
        date: dateTimeDebut.toJSDate(),
        duree,
        commentaire: rendezVousMilo.commentaire,
        adresse: rendezVousMilo.adresse,
        modalite: rendezVousMilo.modalite
      }
    }

    private getDateEtDuree(
      rendezVousMilo: RendezVousMilo,
      jeune: JeuneDuRendezVous
    ): { dateTimeDebut: DateTime; duree: number } {
      const dateTimeDebut = timezonerDateMilo(
        rendezVousMilo.dateHeureDebut,
        jeune
      )
      let duree = 0
      if (rendezVousMilo.dateHeureFin) {
        const dateTimeFin = timezonerDateMilo(
          rendezVousMilo.dateHeureFin,
          jeune
        )
        duree = dateTimeFin.diff(dateTimeDebut, 'minutes').get('minutes')
      }
      return { dateTimeDebut, duree }
    }
  }
}
