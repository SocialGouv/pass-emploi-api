import { ErreurHttp } from './domain-error'
import { DateTime } from 'luxon'

export type ResultApi<Data = void> = SuccessApi<Data> | FailureApi
export type SuccessApi<Data = void> = {
  _isSuccess: true
  data: Data
  dateCache?: DateTime
}
export type FailureApi = { _isSuccess: false; error: ErreurHttp }

export function successApi<Data = void>(
  data: Data,
  dateCache?: DateTime
): SuccessApi<Data> {
  return { _isSuccess: true, data, dateCache }
}

export function failureApi(error: ErreurHttp): FailureApi {
  return { _isSuccess: false, error }
}

export function isSuccessApi<Data = void>(
  result: ResultApi<Data>
): result is SuccessApi<Data> {
  return result._isSuccess
}

export function isFailureApi<Data = void>(
  result: ResultApi<Data>
): result is FailureApi {
  return !result._isSuccess
}
