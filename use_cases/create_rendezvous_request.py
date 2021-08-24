class CreateRendezvousRequest:
    def __init__(self, comment: str, date: str, duration: str, jeune_id: str, modality: str):
        self.comment = comment
        self.date = date
        self.duration = duration
        self.jeuneId = jeune_id
        self.modality = modality
