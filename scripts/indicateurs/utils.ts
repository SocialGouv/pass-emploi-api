import { DateTime } from 'luxon'
import { exec } from 'child_process'
import { promisify } from 'util'
import { BEGINNING_OF_HISTORY, Commit, Tag } from './calendar'

const execute = promisify(exec)

export async function getCommits(): Promise<Commit[]> {
  const result = await execute('git reflog develop --pretty="format:%ci %h"')
  const lines = result.stdout!.split('\n')
  return lines
    .map(line => {
      const date = line.split(' ')[0]
      const hash = line.split(' ')[3]
      return {
        date: DateTime.fromISO(date),
        hash
      }
    })
    .filter(version => version.date > BEGINNING_OF_HISTORY)
}

export async function getTags(): Promise<Tag[]> {
  const result = await execute(
    'git log --tags --simplify-by-decoration --pretty="format:%ci %d"'
  )
  const lines = result.stdout.split('\n')
  return lines
    .map(line => {
      const date = line.split(' ')[0]
      const tag =
        line.indexOf('tag: ') > -1
          ? line.split('tag: ')[1].split(',')[0].split(')')[0]
          : undefined

      return {
        date: DateTime.fromISO(date),
        major: tag ? tag.split('.')[0].split('v')[1] : undefined,
        minor: tag ? tag.split('.')[1] : undefined,
        patch: tag ? tag.split('.')[2] : undefined
      }
    })
    .filter(tagIsDefined)
}

function tagIsDefined(tag: Partial<Tag>): tag is Tag {
  return Boolean(tag?.major && tag?.minor && tag?.patch)
}

export function log(message: string): void {
  // eslint-disable-next-line no-console
  console.log(message)
}

export function getEnviroment(key: string): string {
  // eslint-disable-next-line no-process-env
  const env = process.env[key]
  if (!env) {
    throw new Error(`${key} is not defined`)
  }
  return env
}
