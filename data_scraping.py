import yt_dlp
from mlb_stats_api import teamIds
import re

class Game:
    def __init__(self, home_team, away_team, date, view_count,is_double_header):
        self.home_team = home_team
        self.away_team = away_team
        self.date = date
        self.view_count = view_count
        self.is_double_header = is_double_header

    def set_double_header_game(self, game_num):
        self.game_num = game_num
    


def get_playlist_videos(url):
    ydl_opts = {
        'quiet': True,
        'extract_flat': 'in_playlist',
        'dump_single_json': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        result = ydl.extract_info(playlist_url, download=False)

    videos = result.get("entries", [])
    video_data = []

    for video in videos:
        title = video.get("title")
        view_count = video.get("view_count")
        video_data.append((title, view_count))

    return video_data

def extract_title_info(title):
    #Extract date from title using re
    date_pattern = r'\((\d{1,2}/\d{1,2}/\d{2})\)'
    date_match = re.search(date_pattern, title)
    if date_match:
        date = date_match.group(1)
    else:
        date = None

    #check if game is doubleheader and if so, label if game 1 or 2
    double_header = False
    if "Game 1" in title or "Game 2" in title:
        double_header = True
        if "Game 1" in title:
            game_num = 1
        else:
            game_num = 2
    
    #extract team names
    teams_pattern = r'^(.*?)\s+vs\.\s+(.*?)\s+Game'
    if double_header:
        teams_match = re.search(teams_pattern, title)
    else:
        teams_pattern = r'^(.*?)\s+vs\.\s+(.*?)\s+Highlights'
        teams_match = re.search(teams_pattern, title)
    
    away_team = teams_match.group(1).strip() if teams_match else None
    home_team = teams_match.group(2).strip() if teams_match else None

    info = [home_team, away_team, date, double_header]
    if double_header:
        info.append(game_num)

    return info

playlist_url = "https://www.youtube.com/playlist?list=PLL-lmlkrmJanUePyXyLusrJGzyGRg-Qj3"
video_info = get_playlist_videos(playlist_url)[40::]
game_info = []
for game_title in video_info:
    game_title_info = extract_title_info(game_title[0])
    curr_game = Game(game_title_info[0],game_title_info[1],game_title_info[2],game_title[1],game_title_info[3])
    if curr_game.is_double_header:
        curr_game.set_double_header_game(game_title_info[4])
    game_info.append(curr_game)
    
for game in game_info:
    print(game.home_team,game.away_team,game.date,game.view_count)



