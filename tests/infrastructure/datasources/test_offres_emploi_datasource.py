from src.infrastructure.datasources.offres_emploi_api_datasource import generate_query_param_range


class TestOffresEmploiDatasource:
    def test_generate_query_param_range(self):
        mocked_page = 2
        mocked_limit = 50

        expected_range = '50-99'

        received_range = generate_query_param_range(mocked_page, mocked_limit)

        assert received_range == expected_range
