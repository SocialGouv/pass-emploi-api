import { TransformFnParams } from 'class-transformer'

export function transformStringToArray(
  params: TransformFnParams,
  key: string
): [] {
  if (typeof params.value === 'string') {
    params.obj[key] = [params.value]
  }
  return params.obj[key]
}

export function transformStringToBoolean(
  params: TransformFnParams,
  key: string
): boolean {
  switch (params.value) {
    case 'true':
      params.obj[key] = true
      break
    case 'false':
      params.obj[key] = false
      break
    default:
      params.obj[key] = undefined
  }
  return params.obj[key]
}

export function transformStringToInteger(
  params: TransformFnParams,
  key: string
): boolean {
  params.obj[key] = parseInt(params.value)
  return params.obj[key] ? params.obj[key] : undefined
}
