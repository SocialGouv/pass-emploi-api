class CreateRendezvousRequest:
    def __init__(self, comment: str, date: str, duration: int, modality: str, jeune_id: str, conseiller_id: str):
        self.comment = comment
        self.date = date
        self.duration = duration
        self.modality = modality
        self.jeuneId = jeune_id
        self.conseillerId = conseiller_id
