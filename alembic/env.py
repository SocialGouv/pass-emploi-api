import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config
from sqlalchemy import pool

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name, disable_existing_loggers=False)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = None


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

TEST_ENV = 'test'


def run_migrations_for_tests():
    """Run migrations in a testing context.
    """
    config_section = config.get_section(config.config_ini_section)
    database_url = os.environ.get('SQLALCHEMY_DATABASE_TEST_URI', '').replace('postgres://', 'postgresql://')
    config_section["sqlalchemy.url"] = database_url
    connectable = engine_from_config(
        config_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    config_section = config.get_section(config.config_ini_section)
    database_url = os.environ.get('SQLALCHEMY_DATABASE_URI', '').replace('postgres://', 'postgresql://')
    config_section["sqlalchemy.url"] = database_url
    connectable = engine_from_config(
        config_section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if os.environ.get('ENV') == TEST_ENV:
    run_migrations_for_tests()
else:
    run_migrations_online()
