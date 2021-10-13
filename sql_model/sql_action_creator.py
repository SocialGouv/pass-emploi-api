from initialize_db import db
from model.action_creator_type import ActionCreatorType


class SqlActionCreator(db.Model):
    __tablename__ = 'action_creator'
    id = db.Column(db.String(255), primary_key=True)
    actionCreatorType = db.Column(db.Enum(ActionCreatorType), name='action_creator_type')
    creatorId = db.Column(db.String(255), name='creator_id')
    action = db.relationship('SqlAction', backref=db.backref('action_creator_action', lazy=False))
    actionId = db.Column(db.String(255), db.ForeignKey('action.id'), name='action_id')
