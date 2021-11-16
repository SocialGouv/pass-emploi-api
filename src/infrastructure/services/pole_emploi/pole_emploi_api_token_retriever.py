from abc import ABC, abstractmethod
from typing import Optional


class PoleEmploiAPITokenRetriever(ABC):
    @abstractmethod
    def get_api_token(self) -> Optional[str]:
        pass
