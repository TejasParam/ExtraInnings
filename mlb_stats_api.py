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

#score differntial for a given game id
def get_score_differential(game_id):
    game_info = statsapi.schedule(game_id=game_id)[0]
    score_diff = abs(game_info["home_score"]-game_info["away_score"])
    return score_diff

def rank_yesterdays_games_by_score_differential():
    games = get_game_ids_for_day(get_yesterday_date())
    games_ranked = sorted(games, key=get_score_differential)
    return games_ranked

def game_title(game_id):
    game_info = statsapi.schedule(game_id=game_id)[0]
    title = game_info['game_date']+ ": " + game_info['away_name'] + " @ " + game_info["home_name"]
    return title

def print_ranked_games_highlight_links():
     games_ranked = rank_yesterdays_games_by_score_differential()
     for game in games_ranked:
         print(game_title(game) + ": " + get_condensed_game(game))

def main():
    print_ranked_games_highlight_links()

if __name__ == "__main__":
    main()