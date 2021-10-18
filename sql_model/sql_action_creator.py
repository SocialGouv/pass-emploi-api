from initialize_db import db
from model.action_creator_type import ActionCreatorType


class SqlActionCreator(db.Model):
    __tablename__ = 'action_creator'
    id = db.Column(db.BigInteger(), primary_key=True)
    creatorId = db.Column(db.String(255), name='creator_id')
    actionCreatorType = db.Column(db.Enum(ActionCreatorType, values_callable=lambda obj: [e.value for e in obj]),
                                  name='action_creator_type')
