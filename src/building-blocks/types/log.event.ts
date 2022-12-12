export enum LogEventKey {
  USER_API_CALL = 'userApiCall',
  COMMAND_EVENT = 'commandEvent',
  JOB_EVENT = 'jobEvent',
  QUERY_EVENT = 'queryEvent'
}

export class LogEvent {
  msg: string
  eventKey: LogEventKey
  event: object

  constructor(eventKey: LogEventKey, event: object) {
    this.eventKey = eventKey
    this.event = event
    this.msg = LOG_EVENT_MSG
  }
}

export const LOG_EVENT_MSG = 'log_event'
