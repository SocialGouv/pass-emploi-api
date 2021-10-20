from model.rendezvous import Rendezvous


class JsonConseillerRendezvous:
    def __init__(self, rendezvous: Rendezvous):
        self.id = rendezvous.id
        self.title = rendezvous.jeune.firstName + rendezvous.jeune.lastName
        self.comment = rendezvous.comment if rendezvous.comment is not None else ''
        self.date = rendezvous.date if rendezvous.date is not None else ''
        self.duration = str(rendezvous.duration)
        self.modality = rendezvous.modality
