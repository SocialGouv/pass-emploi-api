from typing import Optional

from src.application.queries.query_handler import Query, QueryHandler
from src.application.queries.query_models.action_query_model import ActionQueryModel
from src.application.repositories.actions_repository import ActionsRepository


class GetDetailActionQuery(Query):
    def __init__(self, id_action: str):
        super(GetDetailActionQuery, self).__init__(name='GetDetailActionQuery')
        self.id_action = id_action


class GetDetailActionQueryHandler(QueryHandler):
    def __init__(self, actions_repository: ActionsRepository):
        self.actions_repository = actions_repository

    def handle(self, query: GetDetailActionQuery) -> Optional[ActionQueryModel]:
        return self.actions_repository.get_query_model(query.id_action)
