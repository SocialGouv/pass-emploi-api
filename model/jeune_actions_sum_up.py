class JeuneActionsSumUp:

    def __init__(
            self,
            jeune_id: str,
            jeune_first_name: str,
            jeune_last_name: str,
            todo_actions_count: str,
            done_actions_count: str,
    ):
        self.jeuneId = jeune_id
        self.jeuneFirstName = jeune_first_name
        self.jeuneLastName = jeune_last_name
        self.todoActionsCount = todo_actions_count
        self.doneActionsCount = done_actions_count
