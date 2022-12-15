import { Injectable, Logger } from '@nestjs/common'
import { BigQuery, JobLoadMetadata } from '@google-cloud/bigquery'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class BigqueryClient extends BigQuery {
  private logger: Logger

  constructor(private configService: ConfigService) {
    super({
      credentials: JSON.parse(configService.get('firebase.key')!)
    })
    this.logger = new Logger('BigqueryClient')
  }

  async loadData(
    datasetId: string,
    tableId: string,
    file: string
  ): Promise<void> {
    const options: JobLoadMetadata = {
      autodetect: true,
      sourceFormat: 'NEWLINE_DELIMITED_JSON',
      writeDisposition: 'WRITE_TRUNCATE'
    }
    await this.dataset(datasetId).table(tableId).load(file, options)
  }
}
