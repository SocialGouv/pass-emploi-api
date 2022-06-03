import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Query } from 'src/building-blocks/types/query'
import { QueryHandler } from 'src/building-blocks/types/query-handler'
import { Unauthorized } from 'src/domain/erreur'
import { Jeune, JeunesRepositoryToken } from 'src/domain/jeune'
import { Result, success } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Fichier, FichierRepositoryToken } from '../../domain/fichier'

export interface TelechargerFichierQuery extends Query {
  idFichier: string
}

@Injectable()
export class TelechargerFichierQueryHandler extends QueryHandler<
  TelechargerFichierQuery,
  Result<string>
> {
  private client: S3Client

  constructor(
    @Inject(FichierRepositoryToken)
    private fichierRepository: Fichier.Repository,
    @Inject(JeunesRepositoryToken)
    private jeuneRepository: Jeune.Repository,
    private configService: ConfigService
  ) {
    super('TelechargerFichierQueryHandler')
    this.client = new S3Client({
      region: this.configService.get('s3.region'),
      credentials: {
        accessKeyId: this.configService.get('s3.accessKeyId')!,
        secretAccessKey: this.configService.get('s3.secretAccessKey')!
      },
      endpoint: this.configService.get('s3.endpoint')!
    })
  }

  async authorize(
    query: TelechargerFichierQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    const fichierMetadata = await this.fichierRepository.getFichierMetadata(
      query.idFichier
    )
    if (fichierMetadata) {
      if (utilisateur.type === Authentification.Type.JEUNE) {
        if (fichierMetadata.idsJeunes.includes(utilisateur.id)) {
          return
        }
      }
      if (utilisateur.type === Authentification.Type.CONSEILLER) {
        const jeunesDuFichier =
          await this.jeuneRepository.findAllJeunesByConseiller(
            fichierMetadata.idsJeunes,
            utilisateur.id
          )
        const leConseillerADesJeunesDansLeFichier = jeunesDuFichier.length > 0
        if (leConseillerADesJeunesDansLeFichier) {
          return
        }
      }
    }
    throw new Unauthorized('Fichier')
  }

  async handle(query: TelechargerFichierQuery): Promise<Result<string>> {
    const fichierMetadata = (await this.fichierRepository.getFichierMetadata(
      query.idFichier
    ))!

    const bucketPrefix = this.configService.get(
      's3.bucket_prefix_pieces_jointes'
    )
    const keyFile = `${bucketPrefix}${fichierMetadata.id}`

    const command = new GetObjectCommand({
      Bucket: this.configService.get('s3.bucket'),
      Key: keyFile,
      ResponseContentType: fichierMetadata.mimeType,
      ResponseContentDisposition: `attachment; filename="${fichierMetadata.nom}"`
    })

    const url = await getSignedUrl(this.client, command, { expiresIn: 10 })

    return success(url)
  }

  async monitor(): Promise<void> {
    return
  }
}
