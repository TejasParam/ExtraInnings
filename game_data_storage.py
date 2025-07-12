import psycopg2
from mlb_stats_api import get_condensed_game, rank_games_excitement
import os
from dotenv import load_dotenv
load_dotenv()

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
            id INT PRIMARY KEY,
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


# conn = psycopg2.connect(host='localhost', dbname = 'postgres',user = 'postgres',password = 'Tejas712006!',port=5432)

# cur = conn.cursor()


# def initial_database_entries():
#     games = rank_games_excitement('1950-01-01','2025-07-09')
#     games['game_date'] = games['game_date'].dt.date
#     games_array = games.to_numpy()
#     for index in range(len(games_array)):
#         game = games_array[index]
#         game_id = game[0]
#         game_date = game[1]
#         game_home_team = game

# conn.commit()
 
# cur.close()
# conn.close()

def main():
    games = Database_Manager(os.getenv('DB_HOST'),os.getenv('DB_NAME'),os.getenv('DB_USER'),os.getenv('DB_PASSWORD'),os.getenv('DB_PORT'))
    games.create_games_table()

if __name__ == "__main__":
    main()