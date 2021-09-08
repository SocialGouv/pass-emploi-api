from model.jeune import Jeune
from sql_model.sql_jeune import SqlJeune
from transformers.conseiller_transformer import to_conseiller


def to_jeune(sql_jeune: SqlJeune) -> Jeune:
    return Jeune(
        sql_jeune.id,
        sql_jeune.firstName,
        sql_jeune.lastName,
        to_conseiller(sql_jeune.conseiller)
    )
