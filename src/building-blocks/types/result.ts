import { DomainError } from './domain-error'

export type Result<Data = void> = Success<Data> | Failure
export type Success<Data = void> = { _isSuccess: true; data: Data }
export type Failure = { _isSuccess: false; error: DomainError }

export function emptySuccess(): Success {
  return { _isSuccess: true, data: undefined }
}

export function success<Data = void>(data: Data): Success<Data> {
  return { _isSuccess: true, data }
}

export function failure(error: DomainError): Failure {
  return { _isSuccess: false, error }
}

export function isSuccess<Data = void>(
  result: Result<Data>
): result is Success<Data> {
  return result._isSuccess
}

export function isFailure<Data = void>(
  result: Result<Data>
): result is Failure {
  return !result._isSuccess
}
