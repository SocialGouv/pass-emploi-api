import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { MauvaiseCommandeError } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { Core } from './core'
import { catalogueDemarchesInMemory } from '../infrastructure/clients/utils/demarches-in-memory'
import { estDemarchePerso } from '../application/queries/query-mappers/actions-pole-emploi.mappers'

export const DemarcheRepositoryToken = 'DemarcheRepositoryToken'

export const POURQUOI_DEMARCHE_PERSO = 'P01'
export const QUOI_DEMARCHE_PERSO = 'Q38'

export interface Demarche {
  id: string
  contenu?: string
  statut: Demarche.Statut
  label: string
  titre: string
  sousTitre?: string
  dateCreation: DateTime
  dateDebut?: DateTime
  dateModification?: DateTime
  dateAnnulation?: DateTime
  dateFin: DateTime
  creeeParConseiller: boolean
  modifieParConseiller: boolean
  attributs: Demarche.Attribut[]
  codeDemarche: string
  statutsPossibles: Demarche.Statut[]
  promptIa?: string
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
    dateFin: DateTime
    pourquoi?: string
    quoi?: string
    comment?: string
    description?: string
    promptIa?: string
  }

  export interface Creee {
    statut: Demarche.Statut
    dateCreation: DateTime
    dateFin: DateTime
    pourquoi: string
    quoi: string
    comment?: string
    description?: string
    promptIa?: string
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
      accessToken: string,
      structure: Core.Structure
    ): Promise<Result<Demarche>>

    save(
      demarche: Demarche.Creee,
      accessToken: string,
      structure: Core.Structure
    ): Promise<Result<Demarche>>
  }

  @Injectable()
  export class Factory {
    constructor(private dateService: DateService) {}

    mettreAJourLeStatut(
      id: string,
      statut: Demarche.Statut,
      dateFin: DateTime,
      dateDebut?: DateTime
    ): Result<Demarche.Modifiee> {
      const maintenant = this.dateService.now()

      const demarcheModifiee: Demarche.Modifiee = {
        id,
        statut,
        dateModification: maintenant,
        dateFin
      }

      switch (statut) {
        case Demarche.Statut.EN_COURS:
          return this.mettreEnCours(dateFin, maintenant, demarcheModifiee)
        case Demarche.Statut.REALISEE:
          return this.realiser(dateDebut, dateFin, maintenant, demarcheModifiee)
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
      const dateTimeFin = setHoursTo12h00(demarcheACreer.dateFin)

      let statut = Demarche.Statut.A_FAIRE
      const laDateDeFinEstDansLePasse = dateTimeFin < maintenant
      if (laDateDeFinEstDansLePasse) statut = Demarche.Statut.REALISEE

      if (
        demarcheACreer.quoi &&
        demarcheACreer.pourquoi &&
        !estDemarchePerso(demarcheACreer.pourquoi, demarcheACreer.quoi)
      ) {
        let codeCommentParUnAutreMoyen = undefined
        const pourquoi = catalogueDemarchesInMemory.find(
          demarche => demarche.code === demarcheACreer.pourquoi
        )
        if (pourquoi) {
          const quoi = pourquoi.demarches.find(
            demarche => demarche.codeQuoi === demarcheACreer.quoi
          )
          if (quoi) {
            codeCommentParUnAutreMoyen = quoi.comment[0]?.code
          }
        }
        return success({
          statut,
          dateCreation: maintenant,
          dateFin: dateTimeFin,
          pourquoi: demarcheACreer.pourquoi,
          quoi: demarcheACreer.quoi,
          comment: codeCommentParUnAutreMoyen,
          promptIa: demarcheACreer.promptIa
        })
      } else if (demarcheACreer.description) {
        return success({
          statut,
          dateCreation: maintenant,
          dateFin: dateTimeFin,
          pourquoi: POURQUOI_DEMARCHE_PERSO,
          quoi: QUOI_DEMARCHE_PERSO,
          description: demarcheACreer.description,
          promptIa: demarcheACreer.promptIa
        })
      }

      return failure(
        new MauvaiseCommandeError(
          'Pour créer une démarche du référentiel il faut un quoi et un pourquoi à minima, ou une description'
        )
      )
    }

    private mettreEnCours(
      dateFin: DateTime,
      maintenant: DateTime,
      demarcheModifiee: Demarche.Modifiee
    ): Result<Demarche.Modifiee> {
      if (dateFin < setHoursTo12h00(maintenant)) {
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
      dateDebut: DateTime | undefined,
      dateFin: DateTime,
      maintenant: DateTime,
      demarcheModifiee: Demarche.Modifiee
    ): Result<Demarche.Modifiee> {
      const maintenantA12Heures = setHoursTo12h00(maintenant)
      let dateDebutDefinitive = dateDebut
        ? setHoursTo12h00(dateDebut)
        : maintenantA12Heures
      const dateFinDefinitive = setHoursTo12h00(dateFin)
      if (dateFinDefinitive < dateDebutDefinitive) {
        dateDebutDefinitive = dateFinDefinitive
      }

      return success({
        ...demarcheModifiee,
        dateDebut: dateDebutDefinitive,
        dateFin: dateFinDefinitive
      })
    }
  }
}

function setHoursTo12h00(date: DateTime): DateTime {
  return date.set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
}
