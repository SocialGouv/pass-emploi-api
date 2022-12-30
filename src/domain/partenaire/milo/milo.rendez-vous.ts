import { Injectable } from '@nestjs/common'
import { Result } from '../../../building-blocks/types/result'
import { Jeune } from '../../jeune/jeune'
import {
  CodeTypeRendezVous,
  RendezVous,
  RendezVous as RendezVousPassEmploi
} from '../../rendez-vous/rendez-vous'
import { IdService } from '../../../utils/id-service'
import { DateTime } from 'luxon'
import Source = RendezVous.Source

const MILO_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

export const MiloRendezVousRepositoryToken = 'MiloRendezVousRepositoryToken'

export interface MiloRendezVous {
  id: string
  dateHeureDebut: string
  dateHeureFin?: string
  titre: string
  idPartenaireBeneficiaire: string
  commentaire?: string
  type: MiloRendezVous.Type
  modalite?: string
  adresse?: string
  statut: string
}

export namespace MiloRendezVous {
  export enum Type {
    RENDEZ_VOUS = 'RENDEZ_VOUS',
    SESSION = 'SESSION'
  }

  export enum ObjetEvenement {
    RENDEZ_VOUS = 'RENDEZ_VOUS',
    SESSION = 'SESSION',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }

  export enum TypeEvenement {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    NON_TRAITABLE = 'NON_TRAITABLE'
  }

  export interface Evenement {
    id: string
    idPartenaireBeneficiaire: string
    objet: MiloRendezVous.ObjetEvenement
    type: MiloRendezVous.TypeEvenement
    idObjet: string
    date: string
  }

  export interface Repository {
    findAllEvenements(): Promise<Evenement[]>

    acquitterEvenement(evenement: Evenement): Promise<Result>

    findRendezVousByEvenement(
      evenement: Evenement
    ): Promise<MiloRendezVous | undefined>
  }

  @Injectable()
  export class Factory {
    constructor(private idService: IdService) {}

    creerRendezVousPassEmploi(
      rendezVousMilo: MiloRendezVous,
      jeune: Jeune
    ): RendezVousPassEmploi {
      const dateTimeDebut = DateTime.fromFormat(
        rendezVousMilo.dateHeureDebut,
        MILO_DATE_FORMAT,
        {
          zone: jeune.configuration!.fuseauHoraire ?? 'Europe/Paris'
        }
      )
      let duree = 0
      if (rendezVousMilo.dateHeureFin) {
        const dateTimeFin = DateTime.fromFormat(
          rendezVousMilo.dateHeureFin,
          MILO_DATE_FORMAT,
          {
            zone: jeune.configuration!.fuseauHoraire ?? 'Europe/Paris'
          }
        )
        duree = dateTimeFin.diff(dateTimeDebut, 'minutes').get('minutes')
      }
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
        type:
          rendezVousMilo.type === MiloRendezVous.Type.RENDEZ_VOUS
            ? CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
            : CodeTypeRendezVous.ATELIER,
        presenceConseiller:
          rendezVousMilo.type === MiloRendezVous.Type.RENDEZ_VOUS,
        commentaire: rendezVousMilo.commentaire,
        adresse: rendezVousMilo.adresse,
        modalite: rendezVousMilo.modalite,
        createur: { id: '', nom: '', prenom: '' },
        informationsPartenaire: {
          id: rendezVousMilo.id,
          type: rendezVousMilo.type
        }
      }
    }

    mettreAJourRendezVousPassEmploi(
      rendezVousPassEmploi: RendezVousPassEmploi,
      rendezVousMilo: MiloRendezVous
    ): RendezVousPassEmploi {
      const dateTimeDebut = DateTime.fromFormat(
        rendezVousMilo.dateHeureDebut,
        MILO_DATE_FORMAT,
        {
          zone:
            rendezVousPassEmploi.jeunes[0].configuration!.fuseauHoraire ??
            'Europe/Paris'
        }
      )
      let duree = 0
      if (rendezVousMilo.dateHeureFin) {
        const dateTimeFin = DateTime.fromFormat(
          rendezVousMilo.dateHeureFin!,
          MILO_DATE_FORMAT,
          {
            zone:
              rendezVousPassEmploi.jeunes[0].configuration!.fuseauHoraire ??
              'Europe/Paris'
          }
        )
        duree = dateTimeFin.diff(dateTimeDebut, 'minutes').get('minutes')
      }
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
  }
}
