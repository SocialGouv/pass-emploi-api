import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Action } from '../../../domain/action/action'
import { Demarche } from '../../../domain/demarche'

class CreateurQueryModel implements Action.Createur {
  @ApiProperty()
  prenom: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  id: string

  @ApiProperty()
  type: Action.TypeCreateur
}

export class QualificationActionQueryModel {
  @ApiProperty()
  code: Action.Qualification.Code

  @ApiProperty()
  libelle: string

  @ApiPropertyOptional()
  heures?: number

  @ApiPropertyOptional()
  commentaireQualification?: string
}

export class BeneficiaireActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  idConseiller: string

  @ApiProperty()
  dispositif: string
}

export class ActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  content: string

  @ApiProperty()
  comment: string

  @ApiProperty()
  creationDate: string

  @ApiProperty()
  lastUpdate: string

  @ApiProperty()
  status: Action.Statut

  @ApiProperty()
  creatorType: Action.TypeCreateur

  @ApiProperty()
  creator: string

  @ApiProperty({ type: BeneficiaireActionQueryModel })
  jeune: BeneficiaireActionQueryModel

  @ApiProperty()
  dateEcheance: string

  @ApiProperty({ required: false })
  dateFinReelle?: string

  @ApiProperty()
  etat: Action.Qualification.Etat

  @ApiProperty({ required: false })
  qualification?: QualificationActionQueryModel
}

export class CommentaireActionQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  date: string

  @ApiProperty()
  createur: CreateurQueryModel

  @ApiProperty()
  message: string
}

export class ActionsMetadonneesQueryModel {
  @ApiProperty()
  nombreTotal: number

  @ApiProperty()
  nombreFiltrees: number

  @ApiProperty()
  nombreActionsParPage: number
}

export class ListeActionsV2QueryModel {
  @ApiProperty({ type: ActionQueryModel, isArray: true })
  actions: ActionQueryModel[]

  @ApiProperty({ type: ActionsMetadonneesQueryModel, isArray: true })
  metadonnees: ActionsMetadonneesQueryModel
}

export class AttributDemarcheQueryModel {
  @ApiProperty()
  label: string

  @ApiProperty()
  valeur: string | number

  @ApiProperty()
  cle: string
}

export class DemarcheQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({ required: false })
  contenu?: string

  @ApiProperty()
  statut: Demarche.Statut

  @ApiProperty()
  dateFin: string

  @ApiProperty({ required: false })
  dateDebut?: string

  @ApiProperty()
  label: string

  @ApiProperty()
  titre: string

  @ApiProperty({ required: false })
  sousTitre?: string

  @ApiProperty()
  dateCreation: string

  @ApiProperty({ required: false })
  dateModification?: string

  @ApiProperty({ required: false })
  dateAnnulation?: string

  @ApiProperty()
  creeeParConseiller: boolean

  @ApiProperty()
  modifieParConseiller: boolean

  @ApiProperty({ type: AttributDemarcheQueryModel, isArray: true })
  attributs: AttributDemarcheQueryModel[]

  @ApiProperty()
  codeDemarche: string

  @ApiProperty({ isArray: true, enum: Demarche.Statut })
  statutsPossibles: Demarche.Statut[]
}

export class TypeQualificationQueryModel
  implements Action.Qualification.TypeQualification
{
  @ApiProperty()
  code: Action.Qualification.Code
  @ApiProperty()
  label: string
  @ApiProperty()
  heures: number
}

export class ActionPredefinieQueryModel implements Action.ActionPredefinie {
  @ApiProperty()
  id: string
  @ApiProperty()
  titre: string
}
