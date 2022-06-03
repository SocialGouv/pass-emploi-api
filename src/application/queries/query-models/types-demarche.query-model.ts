export class CommentDemarcheQueryModel {
  label: string

  code: string
}

export class TypesDemarcheQueryModel {
  codeQuoi: string

  libelleQuoi: string

  codePourquoi: string

  libellePourquoi: string

  commentObligatoire: boolean

  comment: CommentDemarcheQueryModel[]
}
