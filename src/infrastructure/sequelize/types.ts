import { Model } from 'sequelize-typescript'
import { Omit } from 'sequelize-typescript/dist/shared/types'

export type AsSql<T extends Model> = Omit<T, keyof Omit<Model, 'id'>> &
  Partial<{
    createdAt: Date
    updatedAt: Date
    deletedAt: Date
    version: number
  }>
