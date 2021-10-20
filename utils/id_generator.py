import random


def id_generator(id_length: int):
    return ''.join(random.SystemRandom().choice('ABCDEFGHJKLMNPQRSTUVWXYZ') for _ in range(id_length))
