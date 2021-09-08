from model.rendezvous import Rendezvous
from sql_model.sql_rendezvous import SqlRendezvous
from transformers.conseiller_transformer import to_conseiller
from transformers.jeune_transformer import to_jeune


def to_rendezvous(sql_rendezvous: SqlRendezvous) -> Rendezvous:
    return Rendezvous(
        id=str(sql_rendezvous.id),
        title=sql_rendezvous.title,
        subtitle=sql_rendezvous.subtitle,
        comment=sql_rendezvous.comment,
        modality=sql_rendezvous.modality,
        date=sql_rendezvous.date,
        duration=sql_rendezvous.duration,
        jeune=to_jeune(sql_rendezvous.jeune),
        conseiller=to_conseiller(sql_rendezvous.conseiller),
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
