class CreateJeuneRequest:
    def __init__(self, jeune_id: str, first_name: str, last_name: str):
        self.id = jeune_id
        self.firstName = first_name
        self.lastName = last_name
