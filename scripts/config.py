"""
authors: Kai Middlebrook
"""

import json
import os

# spotipy imports
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


""" Spotify config """
# Spotify Credentials for Spotify API (used with Spotipy)
# load credentials from file
with open("spotify_keys.json", "r") as fp:
    SPOTIPY_CREDS = json.load(fp)


SPOTIPY_REQUESTS_TIMEOUT = 15
# create spotipy clients 
SPOTIPY_CLIENTS = []
for creds in SPOTIPY_CREDS:
    cm = SpotifyClientCredentials(
        client_id=creds.get("ID", None),
        client_secret=creds.get("SECRET", None),  # noqa: E501
    )
    SPOTIPY_CLIENTS.append(
        spotipy.Spotify(
            client_credentials_manager=cm, requests_timeout=SPOTIPY_REQUESTS_TIMEOUT,
        )
    )
