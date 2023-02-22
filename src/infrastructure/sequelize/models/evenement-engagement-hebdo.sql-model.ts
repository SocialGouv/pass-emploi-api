import { Table } from 'sequelize-typescript'
import { EvenementEngagementDto } from './evenement-engagement.sql-model'

@Table({ timestamps: false, tableName: 'evenement_engagement_hebdo' })
export class EvenementEngagementHebdoSqlModel extends EvenementEngagementDto {}
