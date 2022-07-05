export const SupportNotificationServiceToken = 'SupportNotification.Service'
export namespace SupportNotification {
  export interface Service {
    envoyerJobResultat(message: string): Promise<void>
  }
}
