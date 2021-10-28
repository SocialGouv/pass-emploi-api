from unittest.mock import patch, MagicMock

from infrastructure.services.cache.pole_emploi_token_cache import PoleEmploiTokenCache
from infrastructure.services.pole_emploi.pole_emploi_api_token_retriever import PoleEmploiAPITokenRetriever
from infrastructure.services.pole_emploi.pole_emploi_api_token_retriever_cache_decorator import \
    PoleEmploiAPITokenRetrieverCacheDecorator


@patch('infrastructure.services.pole_emploi.pole_emploi_api_token_retriever.PoleEmploiAPITokenRetriever')
@patch('infrastructure.services.cache.pole_emploi_token_cache.PoleEmploiTokenCache')
class TestPoleEmploiAPITokenRetrieverCacheDecorator:
    def test_get_api_token_when_token_is_available_in_cache_should_return_it(
            self,
            decorated: PoleEmploiAPITokenRetriever,
            cache: PoleEmploiTokenCache
    ):
        # given
        cache.get = MagicMock(return_value="cached_token")
        decorator = PoleEmploiAPITokenRetrieverCacheDecorator(decorated, cache)

        # when
        token = decorator.get_api_token()

        # then
        assert token == "cached_token"

    def test_get_api_token_when_token_is_not_available_in_cache_should_return_token_from_decorated(
            self,
            decorated: PoleEmploiAPITokenRetriever,
            cache: PoleEmploiTokenCache
    ):
        # given
        cache.get = MagicMock(return_value=None)
        decorated.get_api_token = MagicMock(return_value="new_token")
        decorator = PoleEmploiAPITokenRetrieverCacheDecorator(decorated, cache)

        # when
        token = decorator.get_api_token()

        # then
        assert token == "new_token"

    def test_get_api_token_when_token_is_not_available_in_cache_but_returned_by_decorated_should_set_it_in_cache(
            self,
            decorated: PoleEmploiAPITokenRetriever,
            cache: PoleEmploiTokenCache
    ):
        # given
        cache.get = MagicMock(return_value=None)
        cache.set = MagicMock()
        decorated.get_api_token = MagicMock(return_value="new_token")
        decorator = PoleEmploiAPITokenRetrieverCacheDecorator(decorated, cache)

        # when
        decorator.get_api_token()

        # then
        cache.set.assert_called_with("new_token")

    def test_get_api_token_when_token_not_available_in_cache_and_not_returned_by_decorated_should_not_set_it_in_cache(
            self,
            decorated: PoleEmploiAPITokenRetriever,
            cache: PoleEmploiTokenCache
    ):
        # given
        cache.get = MagicMock(return_value=None)
        cache.set = MagicMock()
        decorated.get_api_token = MagicMock(return_value=None)
        decorator = PoleEmploiAPITokenRetrieverCacheDecorator(decorated, cache)

        # when
        token = decorator.get_api_token()

        # then
        assert token is None
        cache.set.assert_not_called()
