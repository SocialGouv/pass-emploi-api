import { DateTime } from 'luxon'

export const BEGINNING_OF_HISTORY = DateTime.fromISO('2022-07-10')

export class Calendar {
  private weeks: DateTime[]

  constructor(private commits: Commit[], private tags: Tag[]) {
    const start = BEGINNING_OF_HISTORY.startOf('week')
    const end = DateTime.local().endOf('week')
    const weeks = new Array<DateTime>()
    let date = start
    while (date < end) {
      weeks.push(date)
      date = date.plus({ week: 1 })
    }
    this.weeks = weeks
  }

  getNumberOfDeploymentPerWeek(): Indicateur[] {
    const deploymentsPerWeek = this.tags.reduce(
      (acc: { [key: string]: number }, tag: Tag) => {
        const tagDuringWeek = acc[tag.date.startOf('week').toISO()]
        if (tagDuringWeek) {
          acc[tag.date.startOf('week').toISO()] = tagDuringWeek + 1
        } else {
          acc[tag.date.startOf('week').toISO()] = 1
        }
        return acc
      },
      {}
    )
    return this.weeks.map(week => {
      return {
        date: week,
        value: deploymentsPerWeek[week.toISO()] || 0
      }
    })
  }

  getLeadTimeToProduction(): Indicateur[] {
    const leadTimePerCommit: CommitWithLeadTime[] = this.commits
      .filter(commit => {
        return commit.date > BEGINNING_OF_HISTORY
      })
      .map(commit => {
        const tag = this.tags.find(tag => tag.date < commit.date)
        if (tag) {
          return {
            hash: commit.hash,
            leadTime: commit.date.diff(tag.date, 'days').days,
            date: commit.date
          }
        } else {
          return undefined
        }
      })
      .filter(isDefined)

    const leadTimePerWeek = leadTimePerCommit.reduce(
      (
        acc: { [key: string]: { leadTime: number; numberOfCommits: number } },
        commit: CommitWithLeadTime
      ) => {
        const startOfWeek = commit.date.startOf('week')
        const week = acc[startOfWeek.toISO()]

        if (week) {
          week.leadTime =
            (week.leadTime * week.numberOfCommits + commit.leadTime) /
            (week.numberOfCommits + 1)
          week.numberOfCommits = week.numberOfCommits + 1
        } else {
          acc[startOfWeek.toISO()] = {
            leadTime: commit.leadTime,
            numberOfCommits: 1
          }
        }
        return acc
      },
      {}
    )

    return this.weeks.map(week => {
      return {
        date: week,
        value: leadTimePerWeek[week.toISO()]?.leadTime || 0
      }
    })
  }
}

export interface Commit {
  date: DateTime
  hash: string
}

export interface CommitWithLeadTime extends Commit {
  leadTime: number
}

export class Tag {
  constructor(
    public date: DateTime,
    public major: string,
    public minor: string,
    public patch: string
  ) {}

  toString(): string {
    return `v${this.major}.${this.minor}.${this.patch}`
  }
}

interface Indicateur {
  date: DateTime
  value: number
}

function isDefined<T>(argument: T | undefined): argument is T {
  return argument !== undefined
}
