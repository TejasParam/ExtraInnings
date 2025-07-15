import psycopg2
from mlb_stats_api import safe_get_condensed_game, rank_games_excitement, get_condensed_game
import os
from dotenv import load_dotenv
import statsapi
import pybaseball
from datetime import datetime, timedelta
import warnings
import json
import pandas as pd
warnings.filterwarnings("ignore", category=FutureWarning)
load_dotenv()

pybaseball.cache.enable()

class Database_Manager:
    def __init__(self, host, dbname, user, password, port):
        self.host = host
        self.dbname = dbname
        self.user = user
        self.password = password
        self.port = port

    def create_games_table(self):
        with psycopg2.connect(
            dbname = self.dbname,
            user = self.user,
            password = self.password,
            host = self.host,
            port = self.port,
        ) as conn:
            with conn.cursor() as cur:
                cur.execute("""CREATE TABLE IF NOT EXISTS games (
                            id SERIAL PRIMARY KEY,
                            sport VARCHAR(32),
                            season INT,
                            game_id INT,
                            date DATE,
                            home_team VARCHAR(50),
                            away_team VARCHAR(50),
                            home_score INT,
                            away_score INT,
                            excitement FLOAT,
                            highlight_url VARCHAR(2048)
                            );
                            """)
                
    def collect_game_data(self):
        #get needed info for each game
        all_games_list = []
        missed_dates = []
        start = datetime(1969, 1, 1)
        end = datetime(2024, 12, 31)
        current = start

        # Go week by week
        while current <= end:
            week_end = min(current + timedelta(days=6), end)
            start_str = current.strftime('%Y-%m-%d')
            end_str = week_end.strftime('%Y-%m-%d')
            print(f"Processing {start_str} to {end_str}")
            try:
                games = rank_games_excitement(start_str, end_str)
            except Exception as e:
                print(f"Error for {start_str} to {end_str}: {e}")
                missed_dates.append(f"{start_str} to {end_str}")
                current = week_end + timedelta(days=1)
                continue
            if games.empty:
                print(f"Skipping {start_str} to {end_str} due to missing or bad data.")
                missed_dates.append(f"{start_str} to {end_str}")
                current = week_end + timedelta(days=1)
                continue
            
            # Add data to our list
            games['game_date'] = games['game_date'].dt.date
            games_array = games.to_numpy()
            all_games_list.extend(games_array)
            current = week_end + timedelta(days=1)

        # Save missed dates to a file
        with open("missed_dates.json", "w") as f:
            json.dump(missed_dates, f)

        print(f"Missed dates count: {len(missed_dates)}")
        print(f"Total games collected: {len(all_games_list)}")

        # Create DataFrame from all collected games
        if all_games_list:
            columns = ['game_pk', 'game_date', 'home_team', 'away_team', 'delta_home_win_exp']
            all_games_df = pd.DataFrame(all_games_list, columns=columns)
            
            # Save DataFrame to file
            all_games_df.to_csv("all_games_data.csv", index=False)
            all_games_df.to_pickle("all_games_data.pkl")  # Also save as pickle for faster loading
            print("Saved all games data to all_games_data.csv and all_games_data.pkl")
        else:
            print("No games data collected")

    def initial_database_entries(self):
        # Read all games from CSV
        all_games_df = pd.read_csv("all_games_data.csv")
        print(f"Loaded {len(all_games_df)} games from all_games_data.csv")

        insert_query = """
        INSERT INTO games (sport, season, game_id, date, home_team, away_team, home_score, away_score, excitement, highlight_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        with psycopg2.connect(
                dbname = self.dbname,
                user = self.user,
                password = self.password,
                host = self.host,
                port = self.port,
            ) as conn:
            with conn.cursor() as cur:
                for idx, row in all_games_df.iterrows():
                    game_id = row['game_pk']
                    game_date = row['game_date']
                    game_home_team = row['home_team']
                    game_away_team = row['away_team']
                    game_excitement_score = row['delta_home_win_exp']
                    game_sport = 'MLB'
                    game_season = str(pd.to_datetime(game_date).year)
                    try:
                        game_home_score = statsapi.schedule(game_id=game_id)[0]['home_score']
                        game_away_score = statsapi.schedule(game_id=game_id)[0]['away_score']
                        game_highlights_link = safe_get_condensed_game(game_id)
                    except Exception as e:
                        print(f"Error fetching data for game_id {game_id}: {e}")
                        game_home_score = None
                        game_away_score = None
                        game_highlights_link = ""
                    data_entry = (game_sport, game_season, game_id, game_date, game_home_team, game_away_team, game_home_score, game_away_score, game_excitement_score, game_highlights_link)
                    cur.execute(insert_query, data_entry)
                    if idx % 100 == 0:
                        print(f"Inserted {idx} rows")
                conn.commit()
        print("All games inserted into database.")





def main():
    games = Database_Manager(os.getenv('DB_HOST'),os.getenv('DB_NAME'),os.getenv('DB_USER'),os.getenv('DB_PASSWORD'),os.getenv('DB_PORT'))
    #games.create_games_table()
    games.initial_database_entries()

if __name__ == "__main__":
    main()