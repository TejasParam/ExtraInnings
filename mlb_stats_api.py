import requests
import time
import datetime
import statsapi
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from pybaseball import statcast
import concurrent.futures


#create dictionary of team ids
teams_info = statsapi.get('teams',{'sportId':1})['teams']
teamIds = {}
team_abbreviations = {}
for team in teams_info:
    team_abbreviations[team['abbreviation']] = team['id']
    teamIds[team['teamName']] = team['id']


#get link to condensed game from highlight plays endpoint
def get_condensed_game(game_Id):
    highlight_videos= statsapi.game_highlight_data(game_Id)
    video_url = ""
    for link in highlight_videos:
        if 'condensed-game' in link['id']:
            video_url = link['playbacks'][0]['url']
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

# def rank_games_excitement(start_date, end_date):
#     pitch_data = statcast(start_dt=start_date,end_dt=end_date)
#     pitch_data['delta_home_win_exp'] = pitch_data["delta_home_win_exp"].apply(lambda x: abs(x))
#     pitch_data = pitch_data[['game_pk','game_date','home_team','away_team','delta_home_win_exp']].groupby("game_pk")
#     game_excitement = pitch_data.agg({'game_date': 'first', 
#                         'home_team': 'first', 
#                         'away_team': 'first', 
#                         'delta_home_win_exp': 'sum'}).sort_values(by='delta_home_win_exp',ascending=False).reset_index()
#     return game_excitement

def rank_games_excitement(start_date, end_date, timeout=60):
    try:
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future = executor.submit(statcast, start_dt=start_date, end_dt=end_date)
            pitch_data = future.result(timeout=timeout)
        if pitch_data.empty or not set(['game_pk','game_date','home_team','away_team','delta_home_win_exp']).issubset(pitch_data.columns):
            print(f"Statcast data missing or malformed for {start_date} to {end_date}")
            return pd.DataFrame()
        pitch_data['delta_home_win_exp'] = pitch_data["delta_home_win_exp"].apply(lambda x: abs(x))
        pitch_data = pitch_data[['game_pk','game_date','home_team','away_team','delta_home_win_exp']].groupby("game_pk")
        game_excitement = pitch_data.agg({'game_date': 'first', 
                            'home_team': 'first', 
                            'away_team': 'first', 
                            'delta_home_win_exp': 'sum'}).sort_values(by='delta_home_win_exp',ascending=False).reset_index()
        return game_excitement
    except concurrent.futures.TimeoutError:
        print(f"Timeout loading statcast data for {start_date} to {end_date}")
        return pd.DataFrame()
    except Exception as e:
        print(f"Error loading statcast data for {start_date} to {end_date}: {e}")
        return pd.DataFrame()

        

def main():
    #print_ranked_games_highlight_links()
    # for k in team_abbreviations:
    #     print(k, team_abbreviations[k])
    games = rank_games_excitement("1984-01-01","1984-12-31")
    games['game_date'] = games['game_date'].dt.date
    g = games.to_numpy()
    print(g[0])

if __name__ == "__main__":
    main()