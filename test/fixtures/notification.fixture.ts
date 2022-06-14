import { Notification } from '../../src/domain/notification'

export const uneNotification = (
  args: Partial<Notification.Message> = {}
): Notification.Message => {
  const defaults = {
    token: 'token',
    notification: {
      title: 'Nouveau message',
      body: 'Vous avez un nouveau message'
    },
    data: {
      type: Notification.Type.NEW_MESSAGE
    }
  }

  return { ...defaults, ...args }
}
