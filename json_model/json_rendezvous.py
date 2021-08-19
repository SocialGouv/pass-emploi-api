from models.rendezvous import Rendezvous


class JsonRendezvous:
    def __init__(self, rendezvous: Rendezvous):
        self.id = rendezvous.id
        self.comment = rendezvous.comment
        self.date = rendezvous.date
        self.duration = str(rendezvous.duration)
        self.modality = rendezvous.modality
