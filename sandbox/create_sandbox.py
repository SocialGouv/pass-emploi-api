from initialize_db import db


def create_sandbox() -> None:
    query = """
            TRUNCATE TABLE jeune CASCADE;
            TRUNCATE TABLE conseiller CASCADE;
            
            INSERT INTO conseiller (id, first_name, last_name) VALUES ('1', 'Nils', 'Tavernier');
            
            INSERT INTO jeune (id, first_name, last_name, conseiller_id) VALUES ('1', 'Kenji', 'Lefameux', '1');
            
            INSERT INTO rendezvous (id, title, subtitle, comment, modality, date, duration, jeune_id, conseiller_id)
                   VALUES ('1', 'Rendez-vous conseiller', 'avec Nils', 'Suivi des actions', 'Par téléphone', 
                   '2023-09-24 10:00:00', '00:30:00', '1', '1');
                   
            INSERT INTO rendezvous (id, title, subtitle, comment, modality, date, duration, jeune_id, conseiller_id)
                   VALUES ('2', 'Rendez-vous conseiller', 'avec Nils', 'Suivi des actions', 'Par téléphone', 
                   '2023-09-25 10:00:00', '00:30:00', '1', '1');
                   
            INSERT INTO rendezvous (id, title, subtitle, comment, modality, date, duration, jeune_id, conseiller_id)
                   VALUES ('3', 'Rendez-vous conseiller', 'avec Nils', 'Suivi des actions', 'Par téléphone', 
                   '2023-09-26 10:00:00', '00:30:00', '1', '1');
                   
            
            INSERT INTO action (id, content, comment, is_done, creation_date, last_update, jeune_id) VALUES
                    ('1', 'Suivre une formation', 'Consulter le catalogue des formations', 'false', 
                    '2023-09-25 10:00:00', '2023-09-24 10:00:00', '1');
                    
            INSERT INTO action (id, content, comment, is_done, creation_date, last_update, jeune_id) VALUES
                    ('2', 'Suivre une formation', 'Consulter le catalogue des formations', 'false', 
                    '2023-09-25 10:00:00', '2023-09-24 10:00:00', '1');
                    
            INSERT INTO action (id, content, comment, is_done, creation_date, last_update, jeune_id) VALUES
                    ('3', 'Suivre une formation', 'Consulter le catalogue des formations', 'false', 
                    '2023-09-26 10:00:00', '2023-09-24 10:00:00', '1');              
        """
    db.engine.execute(query)
    db.session.commit()
