from datetime import datetime, timedelta

from model.conseiller import Conseiller
from model.jeune import Jeune
from model.rendezvous import Rendezvous
from sql_model.sql_conseiller import SqlConseiller
from sql_model.sql_jeune import SqlJeune
from sql_model.sql_rendezvous import SqlRendezvous
from transformers.rendezvous_transformer import to_rendezvous, to_sql_rendezvous


def test_to_rendezvous():
    # Given
    date = datetime.utcnow()
    duration = timedelta(minutes=60)
    sql_conseiller = SqlConseiller(id=1, firstName='Nils', lastName='Tavernier')
    sql_jeune = SqlJeune(id='2', firstName='Kendji', lastName='Girac', conseiller=sql_conseiller)
    sql_rendezvous = SqlRendezvous(
        id=4,
        title='title',
        subtitle='subtitle',
        comment='comment',
        date=date,
        duration=duration,
        jeune=sql_jeune,
        conseiller=sql_conseiller
    )

    # When
    rendezvous = to_rendezvous(sql_rendezvous)

    # Then
    assert rendezvous.id == '4'
    assert rendezvous.title == 'title'
    assert rendezvous.subtitle == 'subtitle'
    assert rendezvous.comment == 'comment'
    assert rendezvous.date == date
    assert rendezvous.duration == duration
    assert rendezvous.jeune.id == '2'
    assert rendezvous.jeune.firstName == 'Kendji'
    assert rendezvous.jeune.lastName == 'Girac'
    assert rendezvous.jeune.conseiller.id == '1'
    assert rendezvous.jeune.conseiller.firstName == 'Nils'
    assert rendezvous.jeune.conseiller.lastName == 'Tavernier'


def test_to_sql_rendezvous():
    # Given
    date = datetime.utcnow()
    duration = timedelta(minutes=60)
    conseiller = Conseiller('1', 'Nils', 'Tavernier')
    jeune = Jeune('2', 'Kendji', 'Girac', conseiller)
    rendezvous = Rendezvous('3', 'title', 'subtitle', 'comment', 'modality', date, duration, jeune, conseiller)

    # When
    sql_rendezvous = to_sql_rendezvous(rendezvous)

    # Then
    assert sql_rendezvous.title == 'title'
    assert sql_rendezvous.subtitle == 'subtitle'
    assert sql_rendezvous.comment == 'comment'
    assert sql_rendezvous.modality == 'modality'
    assert sql_rendezvous.date == date
    assert sql_rendezvous.duration == duration
    assert sql_rendezvous.jeuneId == '2'
    assert sql_rendezvous.conseillerId == '1'
