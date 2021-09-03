from sql_model.sql_conseiller import SqlConseiller
from sql_model.sql_jeune import SqlJeune
from transformers.jeune_transformer import to_jeune


def test_to_jeune():
    # Given
    sql_conseiller = SqlConseiller(id=1, firstName='Nils', lastName='Tavernier')
    sql_jeune = SqlJeune(id='2', firstName='Kendji', lastName='Girac', conseiller=sql_conseiller)

    # When
    jeune = to_jeune(sql_jeune)

    # Then
    assert jeune.id == '2'
    assert jeune.firstName == 'Kendji'
    assert jeune.lastName == 'Girac'
    assert jeune.conseiller.id == '1'
    assert jeune.conseiller.firstName == 'Nils'
    assert jeune.conseiller.lastName == 'Tavernier'
