from firebase_admin import messaging


def send_firebase_push_notifications(registration_token: str, notification_message: str):
    message = messaging.Message(
        notification=messaging.Notification(body=notification_message),
        token=registration_token,
    )
    response = messaging.send(message)
    print('Successfully sent message:', response)
