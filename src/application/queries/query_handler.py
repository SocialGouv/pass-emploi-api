from abc import ABC, abstractmethod


class Query(ABC):
    @abstractmethod
    def __init__(self, name: str):
        self.name = name


class QueryHandler(ABC):
    @abstractmethod
    def handle(self, query: Query):
        raise NotImplementedError
