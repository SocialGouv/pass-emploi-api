import { Injectable } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { DateTime } from 'luxon'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import {
  Result,
  emptySuccess,
  isFailure,
  success
} from '../../building-blocks/types/result'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { Authentification } from '../../domain/authentification'
import { Evenement, EvenementService } from '../../domain/evenement'

export class EvenementEmploiDetailQueryModel {
  @ApiProperty({ required: true })
  id: string
  @ApiProperty({ required: false })
  ville?: string
  @ApiProperty({ required: false })
  codePostal?: string
  @ApiProperty({ required: false })
  longitude?: number
  @ApiProperty({ required: false })
  latitude?: number
  @ApiProperty({ required: false })
  description?: string
  @ApiProperty({ required: false })
  titre?: string
  @ApiProperty({ required: false })
  typeEvenement?: string
  @ApiProperty({ required: false })
  dateEvenement?: string
  @ApiProperty()
  dateTimeDebut: string
  @ApiProperty()
  dateTimeFin: string
  @ApiProperty({ required: false })
  heureDebut?: string
  @ApiProperty({ required: false })
  heureFin?: string
  @ApiProperty({ required: false })
  deroulement?: string
  @ApiProperty({ required: false })
  nombrePlacesTotalDistancel?: number
  @ApiProperty({ required: false })
  nombrePlacesTotalPresentiel?: number
  @ApiProperty({ required: false })
  nombreInscritsDistancel?: number
  @ApiProperty({ required: false })
  nombreInscritsPresentiel?: number
  @ApiProperty({ required: false })
  modalites?: string[]
  @ApiProperty({ required: false })
  url?: string
}

export interface GetEvenementEmploiQuery extends Query {
  idEvenement: string
}

@Injectable()
export class GetEvenementEmploiQueryHandler extends QueryHandler<
  GetEvenementEmploiQuery,
  Result<EvenementEmploiDetailQueryModel>
> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private evenementService: EvenementService
  ) {
    super('GetEvenementEmploiQueryHandler')
  }

  async handle(
    query: GetEvenementEmploiQuery
  ): Promise<Result<EvenementEmploiDetailQueryModel>> {
    const resultEvenement = await this.poleEmploiClient.getEvenementEmploi(
      query.idEvenement
    )

    if (isFailure(resultEvenement)) {
      return resultEvenement
    }

    const dateTimeDebut = DateTime.fromISO(resultEvenement.data.dateEvenement, {
      setZone: true
    })
    const [heureFin, minuteFin] = resultEvenement.data.heureFin.split(':')
    const dateTimeFin = dateTimeDebut.set({
      hour: parseInt(heureFin),
      minute: parseInt(minuteFin)
    })

    return success({
      id: resultEvenement.data.id.toString(),
      ville: resultEvenement.data.ville,
      codePostal: resultEvenement.data.codePostal,
      longitude: resultEvenement.data.longitude,
      latitude: resultEvenement.data.latitude,
      description: resultEvenement.data.description,
      titre: resultEvenement.data.titre,
      typeEvenement: resultEvenement.data.type,
      dateEvenement: resultEvenement.data.dateEvenement,
      heureDebut: resultEvenement.data.heureDebut,
      heureFin: resultEvenement.data.heureFin,
      dateTimeDebut: dateTimeDebut.toUTC().toISO(),
      dateTimeFin: dateTimeFin.toUTC().toISO(),
      modalites: resultEvenement.data.modalites,
      deroulement: resultEvenement.data.deroulement,
      nombrePlacesTotalDistancel: resultEvenement.data.nombrePlaceTotalDistance,
      nombrePlacesTotalPresentiel:
        resultEvenement.data.nombrePlaceTotalPresentiel,
      nombreInscritsDistancel: resultEvenement.data.nombreInscritDistance,
      nombreInscritsPresentiel: resultEvenement.data.nombreInscritPresentiel,
      url: resultEvenement.data.urlDetailEvenement
    })
  }
  async authorize(): Promise<Result> {
    return emptySuccess()
  }

  async monitor(utilisateur: Authentification.Utilisateur): Promise<void> {
    await this.evenementService.creer(
      Evenement.Code.EVENEMENT_EXTERNE_DETAIL,
      utilisateur
    )
  }
}
