from model.action_status import ActionStatus


class CreateActionRequest:
    def __init__(self, comment: str, content: str, is_done : bool = False,
                 status: ActionStatus = ActionStatus.NOT_STARTED):
        self.comment = comment
        self.content = content
        self.isDone = is_done
        self.status = status
