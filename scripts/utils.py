"""
authors: Kai Middlebrook
"""

from datetime import datetime

import spotipy  # noqa: F401
from .config import SPOTIPY_CLIENTS, SPOTIPY_CREDS, SPOTIPY_REQUESTS_TIMEOUT  # noqa
from .dsjobs import app
from spotipy.oauth2 import SpotifyClientCredentials  # noqa: F401


def chunkify(input, chunk_size=20):
    """A convenience function to chunk a list

    Args:
        input (list): A list you want split into chunks.
        chunk_size (int): The number of elements you want in each chunk.

    Returns:
        chunked (list): A list containing lists. Each of these lists is a chunk
            of the original list with length = chunk_size (note: the last chunk
            may be smaller than the chunk_size if the length of the input list
            is not evenly divisible by chunk_size).
    """
    chunked = []
    for i in range(0, len(input), chunk_size):
        end = i + chunk_size if i + chunk_size < len(input) else len(input)
        chunked.append(list(input[i:end]))
    return chunked


class SpotipyMux:
    def __init__(self, starting_point=0):
        self.iter_count = starting_point

    def client(self):
        if self.iter_count >= len(SPOTIPY_CLIENTS):
            self.iter_count -= len(SPOTIPY_CLIENTS) + 1
        self.iter_count += 1
        return SPOTIPY_CLIENTS[self.iter_count % len(SPOTIPY_CLIENTS)]

    def token(self):
        return self.client().client_credentials_manager.get_access_token()
