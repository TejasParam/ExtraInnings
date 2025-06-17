import requests
import time
import datetime
import statsapi
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date


#create dictionary of team ids
teams_info = statsapi.get('teams',{'sportId':1})['teams']
teamIds = []
for team in teams_info:
    name_id = {team['teamName']: team['id']}
    teamIds.append(name_id)


#get link to condensed game from highlight plays endpoint
def get_condensed_game(game_Id):
    highlight_videos= statsapi.game_highlight_data(game_Id)
    video_url = ""
    if 'condensed-game' in highlight_videos[-2]['id']:
        video_url = highlight_videos[-2]['playbacks'][0]['url']
    return video_url

def get_yesterday_date():
    yesterday = datetime.strftime(datetime.today() - timedelta(1), '%Y-%m-%d')
    return yesterday


#get list of all game ids for a given date
def get_game_ids_for_day(date):
    games = statsapi.schedule(date)
    game_ids = []
    for game in games:
        game_ids.append(game['game_id'])
    return game_ids