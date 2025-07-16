from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from datetime import date

load_dotenv()

app = FastAPI(title="MLB Exciting Games API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Game(BaseModel):
    id: int
    game_id: int
    game_date: date
    home_team: str
    away_team: str
    home_score: Optional[int]
    away_score: Optional[int]
    excitement_score: float
    season: int
    highlight_url: Optional[str]

class GameResponse(BaseModel):
    games: List[Game]
    total: int
    page: int
    limit: int

# Database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "MLB Exciting Games API"}

@app.get("/games", response_model=GameResponse)
async def get_games(
    season: Optional[str] = Query(None, description="Filter by season (year)"),
    limit: int = Query(25, ge=1, le=100, description="Number of games to return"),
    page: int = Query(1, ge=1, description="Page number"),
    sort: str = Query("excitement", description="Sort by: excitement, date, or score_diff"),
    team: Optional[str] = Query(None, description="Filter by team abbreviation")
):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build the query
        base_query = """
            SELECT 
                id, game_id, date as game_date, home_team, away_team, 
                home_score, away_score, excitement as excitement_score, 
                season, highlight_url
            FROM games
            WHERE 1=1
        """
        
        params = []
        
        # Add filters
        if season:
            base_query += " AND season = %s"
            params.append(int(season))
        
        if team:
            base_query += " AND (home_team = %s OR away_team = %s)"
            params.extend([team.upper(), team.upper()])
        
        # Add sorting
        if sort == "excitement":
            base_query += " ORDER BY excitement DESC"
        elif sort == "date":
            base_query += " ORDER BY date DESC"
        elif sort == "score_diff":
            base_query += " ORDER BY ABS(home_score - away_score) DESC"
        else:
            base_query += " ORDER BY excitement DESC"
        
        # Get total count for pagination
        count_query = """
            SELECT COUNT(*) as count
            FROM games
            WHERE 1=1
        """
        count_params = []
        
        # Add same filters for count
        if season:
            count_query += " AND season = %s"
            count_params.append(int(season))
        
        if team:
            count_query += " AND (home_team = %s OR away_team = %s)"
            count_params.extend([team.upper(), team.upper()])
        
        cur.execute(count_query, count_params)
        total = cur.fetchone()['count']
        
        # Add pagination
        offset = (page - 1) * limit
        base_query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute main query
        cur.execute(base_query, params)
        games_data = cur.fetchall()
        
        games = [
            Game(
                id=game['id'],
                game_id=game['game_id'],
                game_date=game['game_date'],
                home_team=game['home_team'],
                away_team=game['away_team'],
                home_score=game['home_score'],
                away_score=game['away_score'],
                excitement_score=float(game['excitement_score']) if game['excitement_score'] else 0.0,
                season=game['season'],
                highlight_url=game['highlight_url']
            )
            for game in games_data
        ]
        
        cur.close()
        conn.close()
        
        return GameResponse(
            games=games,
            total=total,
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching games: {str(e)}")

@app.get("/seasons")
async def get_seasons():
    """Get list of available seasons"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT DISTINCT season FROM games ORDER BY season DESC")
        seasons = [row['season'] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return {"seasons": seasons}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching seasons: {str(e)}")

@app.get("/teams")
async def get_teams():
    """Get list of available teams"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT DISTINCT team FROM (
                SELECT home_team as team FROM games
                UNION
                SELECT away_team as team FROM games
            ) t ORDER BY team
        """)
        teams = [row['team'] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return {"teams": teams}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teams: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
