import pandas as pd
import numpy as np
from mlb_stats_api import teamIds
from data_scraping import game_info

cleaned_game_list = []

for game in game_info:
    if game.home_team in teamIds:
        game.set_home_id(teamIds[game.home_team])
    elif game.home_team == "A's":
        game.set_home_id(teamIds['Athletics'])
    elif game.home_team == "D-Backs" or game.home_team == "Diamondbacks":
        game.set_home_id(teamIds["D-backs"])
    else:
        game.set_home_id(None)

    if game.away_team in teamIds:
        game.set_away_id(teamIds[game.away_team])
    elif game.away_team == "A's":
        game.set_away_id(teamIds['Athletics'])
    elif game.away_team == "D-Backs" or game.away_team == "Diamondbacks":
        game.set_away_id(teamIds["D-backs"])
    else:
        game.set_away_id(None)
    
    if game.home_id is not None and game.away_id is not None and game.date is not None and game.view_count:
        cleaned_game_list.append(game)
    
team_views = {}
team_games = {}

for game in cleaned_game_list:
    if game.home_id in team_views:
        team_views[game.home_id] = team_views[game.home_id] + game.view_count
        team_games[game.home_id] = team_games[game.home_id] + 1
    else:
        team_views[game.home_id] = game.view_count
        team_games[game.home_id] = 1
    
    if game.away_id in team_views:
        team_views[game.away_id] = team_views[game.away_id] + game.view_count
        team_games[game.away_id] = team_games[game.away_id] + 1
    else:
        team_views[game.away_id] = game.view_count
        team_games[game.away_id] = 1

team_avg_views = {}
for team in team_views:
    team_avg_views[team] = team_views[team] / team_games[team]

for game in cleaned_game_list:
    expected_views = (team_avg_views[game.home_id] + team_avg_views[game.away_id]) / 2
    game.set_expected_views(expected_views)