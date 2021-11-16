class JeuneActionsSumUp:

    def __init__(
            self,
            jeune_id: str,
            jeune_first_name: str,
            jeune_last_name: str,
            in_progress_actions_count: str,
            todo_actions_count: str,
            done_actions_count: str,
    ):
        self.jeuneId = jeune_id
        self.jeuneFirstName = jeune_first_name
        self.jeuneLastName = jeune_last_name
        self.inProgressActionsCount = in_progress_actions_count
        self.todoActionsCount = todo_actions_count
        self.doneActionsCount = done_actions_count
