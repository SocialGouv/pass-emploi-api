from model.jeune_actions_sum_up import JeuneActionsSumUp


class JsonJeuneActionsSumUp:

    def __init__(self, sum_up: JeuneActionsSumUp):
        self.jeuneId = sum_up.jeuneId
        self.jeuneFirstName = sum_up.jeuneFirstName
        self.jeuneLastName = sum_up.jeuneLastName
        self.todoActionsCount = sum_up.todoActionsCount
        self.doneActionsCount = sum_up.doneActionsCount
        self.inProgressActionsCount = sum_up.inProgressActionsCount
