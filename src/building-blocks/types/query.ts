import { DateTime } from 'luxon'

/**
 * Représente une question envoyée au système.
 *
 * @see https://martinfowler.com/bliki/CommandQuerySeparation.html
 * @see https://udidahan.com/2009/12/09/clarified-cqrs/
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Query {}

export interface Cached<T> {
  queryModel: T
  dateDuCache?: DateTime
}
