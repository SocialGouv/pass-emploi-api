import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { failure, Result, success } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { MauvaiseCommandeError } from '../building-blocks/types/domain-error'

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
    dateDebut?: DateTime
    dateFin?: DateTime
    dateAnnulation?: DateTime
  }

  export interface ACreer {
    dateFin: Date
    pourquoi?: string
    quoi?: string
    comment?: string
    description?: string
  }

  export interface Creee {
    statut: Demarche.Statut
    dateCreation: DateTime
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
      dateFin: Date,
      dateDebut?: Date
    ): Result<Demarche.Modifiee> {
      const maintenant = this.dateService.now()

      const demarcheModifiee: Demarche.Modifiee = {
        id,
        statut,
        dateModification: maintenant,
        dateFin: DateTime.fromJSDate(dateFin).toUTC()
      }

      switch (statut) {
        case Demarche.Statut.EN_COURS:
          return this.mettreEnCours(dateFin, maintenant, demarcheModifiee)
        case Demarche.Statut.REALISEE:
          return this.realiser(dateDebut, maintenant, demarcheModifiee)
        case Demarche.Statut.A_FAIRE:
          return success({
            ...demarcheModifiee,
            dateDebut: undefined
          })
        case Demarche.Statut.ANNULEE:
          return success({
            ...demarcheModifiee,
            dateAnnulation: maintenant,
            dateDebut: undefined,
            dateFin: undefined
          })
      }
    }

    creerDemarche(demarcheACreer: Demarche.ACreer): Result<Demarche.Creee> {
      const maintenant = setHoursTo12h00(this.dateService.now())
      const dateTimeFin = setHoursTo12h00(
        DateTime.fromJSDate(demarcheACreer.dateFin)
      )

      if (demarcheACreer.quoi && demarcheACreer.pourquoi) {
        return success({
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: maintenant,
          dateFin: dateTimeFin,
          pourquoi: demarcheACreer.pourquoi,
          quoi: demarcheACreer.quoi,
          comment: demarcheACreer.comment
        })
      } else if (demarcheACreer.description) {
        return success({
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: maintenant,
          dateFin: dateTimeFin,
          pourquoi: POURQUOI_DEMARCHE_PERSO,
          quoi: QUOI_DEMARCHE_PERSO,
          description: demarcheACreer.description
        })
      }

      return failure(
        new MauvaiseCommandeError(
          'Pour créer une démarche du référentiel il faut un quoi et un pourquoi à minima, ou une description'
        )
      )
    }

    private mettreEnCours(
      dateFin: Date,
      maintenant: DateTime,
      demarcheModifiee: Demarche.Modifiee
    ): Result<Demarche.Modifiee> {
      if (dateFin < setHoursTo12h00(maintenant).toJSDate()) {
        return failure(
          new MauvaiseCommandeError(
            'Une démarche en cours ne peut pas avoir une date de fin dans le passé'
          )
        )
      }

      return success({
        ...demarcheModifiee,
        dateDebut: setHoursTo12h00(maintenant)
      })
    }

    private realiser(
      dateDebut: Date | undefined,
      maintenant: DateTime,
      demarcheModifiee: Demarche.Modifiee
    ): Result<Demarche.Modifiee> {
      const maintenantA12Heures = setHoursTo12h00(maintenant)
      if (dateDebut && dateDebut < maintenantA12Heures.toJSDate()) {
        return success({
          ...demarcheModifiee,
          dateFin: maintenantA12Heures
        })
      }
      return success({
        ...demarcheModifiee,
        dateDebut: maintenantA12Heures,
        dateFin: maintenantA12Heures
      })
    }
  }
}

function setHoursTo12h00(date: DateTime): DateTime {
  return date.set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
}
