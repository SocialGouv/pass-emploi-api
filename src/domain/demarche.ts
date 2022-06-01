import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Result } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'

export const DemarcheRepositoryToken = 'DemarcheRepositoryToken'
const POURQUOI_DEMARCHE_PERSO = 'P01'
const QUOI_DEMARCHE_PERSO = 'Q38'

export interface Demarche {
  id: string
  contenu?: string
  statut: Demarche.Statut
  label: string
  titre: string
  sousTitre?: string
  dateCreation: Date
  dateDebut?: Date
  dateModification?: Date
  dateAnnulation?: Date
  dateFin: Date
  creeeParConseiller: boolean
  modifieParConseiller: boolean
  attributs: Demarche.Attribut[]
  codeDemarche: string
  statutsPossibles: Demarche.Statut[]
}

export namespace Demarche {
  export interface Modifiee {
    id: string
    dateModification: DateTime
    statut: Demarche.Statut
    dateDebut?: DateTime | null
    dateFin?: DateTime
    dateAnnulation?: DateTime
  }
  export interface Creee {
    statut: Demarche.Statut
    dateCreation: DateTime
    dateDebut: DateTime
    dateFin: DateTime
    pourquoi: string
    quoi: string
    comment?: string
    description?: string
  }

  export enum Statut {
    EN_COURS = 'EN_COURS',
    A_FAIRE = 'A_FAIRE',
    REALISEE = 'REALISEE',
    ANNULEE = 'ANNULEE'
  }

  export interface Attribut {
    cle: string
    label: string
    valeur: string | number
  }

  export interface Code {
    quoi: string
    pourquoi: string
    comment?: string
  }

  export function toBase64(code: Code): string {
    return Buffer.from(JSON.stringify(code)).toString('base64')
  }

  export interface Repository {
    update(
      demarcheModifiee: Demarche.Modifiee,
      accessToken: string
    ): Promise<Result<Demarche>>
    save(
      demarche: Demarche.Creee,
      accessToken: string
    ): Promise<Result<Demarche>>
  }

  @Injectable()
  export class Factory {
    constructor(private dateService: DateService) {}

    mettreAJourLeStatut(
      id: string,
      statut: Demarche.Statut,
      dateDebut?: Date
    ): Demarche.Modifiee {
      const maintenant = this.dateService.now()

      const demarcheModifiee: Demarche.Modifiee = {
        id,
        statut,
        dateModification: maintenant
      }

      if (statut === Demarche.Statut.REALISEE) {
        if (dateDebut && dateDebut < maintenant.toJSDate()) {
          return {
            ...demarcheModifiee,
            dateFin: maintenant
          }
        }
        return {
          ...demarcheModifiee,
          dateDebut: maintenant,
          dateFin: maintenant
        }
      }

      if (statut === Demarche.Statut.A_FAIRE) {
        return {
          ...demarcheModifiee,
          dateDebut: null
        }
      }

      if (statut === Demarche.Statut.ANNULEE) {
        return {
          ...demarcheModifiee,
          dateAnnulation: maintenant
        }
      }

      return {
        ...demarcheModifiee,
        dateDebut: maintenant
      }
    }

    creerDemarchePerso(description: string, dateFin: Date): Demarche.Creee {
      const maintenant = this.dateService.now()
      const dateTimeFin = DateTime.fromJSDate(dateFin)

      const demarche: Demarche.Creee = {
        statut: Demarche.Statut.A_FAIRE,
        dateCreation: maintenant,
        dateDebut: dateTimeFin,
        dateFin: dateTimeFin,
        pourquoi: POURQUOI_DEMARCHE_PERSO,
        quoi: QUOI_DEMARCHE_PERSO,
        description
      }
      return demarche
    }
  }
}
