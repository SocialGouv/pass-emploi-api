class CreateRendezvousRequest:
    def __init__(self, title: str, subtitle: str, comment: str, date: str, duration: str, jeune_id: str, modality: str):
        self.title = title
        self.subtitle = subtitle
        self.comment = comment
        self.date = date
        self.duration = duration
        self.jeuneId = jeune_id
        self.modality = modality
