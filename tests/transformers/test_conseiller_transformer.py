from sql_model.sql_conseiller import SqlConseiller
from transformers.conseiller_transformer import to_conseiller


def test_to_conseiller():
    # Given
    sql_conseiller = SqlConseiller(id=1, firstName='Nils', lastName='Tavernier')

    # When
    conseiller = to_conseiller(sql_conseiller)

    # Then
    assert conseiller.id == '1'
    assert conseiller.firstName == 'Nils'
    assert conseiller.lastName == 'Tavernier'
