from model.rendezvous import Rendezvous
from sql_model.sql_rendezvous import SqlRendezvous
from transformers.conseiller_transformer import to_conseiller
from transformers.jeune_transformer import to_jeune


def to_rendezvous(sql_rendezvous: SqlRendezvous) -> Rendezvous:
    return Rendezvous(
        str(sql_rendezvous.id),
        sql_rendezvous.title,
        sql_rendezvous.subtitle,
        sql_rendezvous.comment,
        sql_rendezvous.modality,
        sql_rendezvous.date,
        sql_rendezvous.duration,
        to_jeune(sql_rendezvous.jeune),
        to_conseiller(sql_rendezvous.conseiller),
    )


def to_sql_rendezvous(rendezvous: Rendezvous) -> SqlRendezvous:
    return SqlRendezvous(
        title=rendezvous.title,
        subtitle=rendezvous.subtitle,
        comment=rendezvous.comment,
        modality=rendezvous.modality,
        date=rendezvous.date,
        duration=rendezvous.duration,
        jeuneId=rendezvous.jeune.id,
        conseillerId=rendezvous.conseiller.id,
    )
