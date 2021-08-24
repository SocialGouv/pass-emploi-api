class CreateActionRequest:
    def __init__(self, comment: str, content: str, is_done: bool):
        self.comment = comment
        self.content = content
        self.isDone = is_done
