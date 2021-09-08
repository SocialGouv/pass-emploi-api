from model.rendezvous import Rendezvous


class JsonRendezvous:
    def __init__(self, rendezvous: Rendezvous):
        self.id = rendezvous.id
        self.title = rendezvous.title
        self.subtitle = rendezvous.subtitle if rendezvous.subtitle is not None else ''
        self.comment = rendezvous.comment if rendezvous.comment is not None else ''
        self.date = rendezvous.date if rendezvous.date is not None else ''
        self.duration = str(rendezvous.duration)
        self.modality = rendezvous.modality
        self.jeuneId = rendezvous.jeune.id
