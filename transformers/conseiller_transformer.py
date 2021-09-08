from model.conseiller import Conseiller
from sql_model.sql_conseiller import SqlConseiller


def to_conseiller(sql_conseiller: SqlConseiller) -> Conseiller:
    return Conseiller(str(sql_conseiller.id), sql_conseiller.firstName, sql_conseiller.lastName)
