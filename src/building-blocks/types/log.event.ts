export enum LogEventKey {
  USER_API_CALL = 'userApiCall',
  USER_EVENT = 'userEvent'
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
