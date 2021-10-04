from firebase_admin import messaging


def send_firebase_push_notifications(registration_token: str, notification_data: dict):
    message = messaging.Message(
        data=notification_data,
        token=registration_token,
    )
    response = messaging.send(message)
    print('Successfully sent message:', response)
