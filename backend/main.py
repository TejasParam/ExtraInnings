from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import pandas as pd
import os
from pydantic import BaseModel
from datetime import date, datetime
import pickle

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

# Load data
def load_games_data():
    """Load games data from CSV or pickle file"""
    try:
        # Try to load pickle first (faster)
        pickle_path = os.path.join(os.path.dirname(__file__), '..', 'all_games_data.pkl')
        if os.path.exists(pickle_path):
            with open(pickle_path, 'rb') as f:
                df = pickle.load(f)
        else:
            # Fall back to CSV
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'all_games_data.csv')
            df = pd.read_csv(csv_path)
        
        # Map CSV columns to expected format
        column_mapping = {
            'game_pk': 'game_id',
            'game_date': 'date',
            'delta_home_win_exp': 'excitement'
        }
        
        # Rename columns to match expected format
        df = df.rename(columns=column_mapping)
        
        # Convert date column to datetime if it's not already
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        
        # Add season column based on date
        if 'season' not in df.columns and 'date' in df.columns:
            df['season'] = df['date'].dt.year
        
        # Add missing columns with defaults if they don't exist
        if 'home_score' not in df.columns:
            df['home_score'] = None
        if 'away_score' not in df.columns:
            df['away_score'] = None
        if 'highlight_url' not in df.columns:
            df['highlight_url'] = None
        
        # Add an ID column if it doesn't exist
        if 'id' not in df.columns:
            df['id'] = range(1, len(df) + 1)
        
        # Ensure we have all required columns
        required_columns = ['game_id', 'date', 'home_team', 'away_team', 'excitement', 'season']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns after mapping: {missing_columns}")
            
        return df
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return pd.DataFrame()

# Global variable to store the loaded data
games_df = load_games_data()

@app.get("/")
async def root():
    return {"message": "MLB Exciting Games API", "total_games": len(games_df)}

@app.get("/games", response_model=GameResponse)
async def get_games(
    season: Optional[str] = Query(None, description="Filter by season (year)"),
    limit: int = Query(25, ge=1, le=100, description="Number of games to return"),
    page: int = Query(1, ge=1, description="Page number"),
    sort: str = Query("excitement", description="Sort by: excitement, date, or score_diff"),
    team: Optional[str] = Query(None, description="Filter by team abbreviation"),
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    try:
        if games_df.empty:
            raise HTTPException(status_code=500, detail="No game data available")
        
        # Start with all games
        filtered_df = games_df.copy()
        
        # Apply filters
        if season:
            filtered_df = filtered_df[filtered_df['season'] == int(season)]
        
        if team:
            team_upper = team.upper()
            filtered_df = filtered_df[
                (filtered_df['home_team'].str.upper() == team_upper) |
                (filtered_df['away_team'].str.upper() == team_upper)
            ]
        
        if start:
            start_date = pd.to_datetime(start)
            filtered_df = filtered_df[filtered_df['date'] >= start_date]
            
        if end:
            end_date = pd.to_datetime(end)
            filtered_df = filtered_df[filtered_df['date'] <= end_date]
        
        # Apply sorting
        if sort == "excitement":
            filtered_df = filtered_df.sort_values('excitement', ascending=False)
        elif sort == "date":
            filtered_df = filtered_df.sort_values('date', ascending=False)
        elif sort == "score_diff":
            # Calculate score difference if scores are available
            if 'home_score' in filtered_df.columns and 'away_score' in filtered_df.columns:
                filtered_df['score_diff'] = abs(filtered_df['home_score'].fillna(0) - filtered_df['away_score'].fillna(0))
                filtered_df = filtered_df.sort_values('score_diff', ascending=False)
            else:
                filtered_df = filtered_df.sort_values('excitement', ascending=False)
        
        # Get total count before pagination
        total = len(filtered_df)
        
        # Apply pagination
        offset = (page - 1) * limit
        paginated_df = filtered_df.iloc[offset:offset + limit]
        
        # Convert to Game objects
        games = []
        for _, row in paginated_df.iterrows():
            game = Game(
                id=int(row['id']) if 'id' in row else int(row.name),
                game_id=int(row['game_id']),
                game_date=row['date'].date() if pd.notna(row['date']) else date.today(),
                home_team=str(row['home_team']),
                away_team=str(row['away_team']),
                home_score=int(row['home_score']) if pd.notna(row.get('home_score')) else None,
                away_score=int(row['away_score']) if pd.notna(row.get('away_score')) else None,
                excitement_score=float(row['excitement']) if pd.notna(row['excitement']) else 0.0,
                season=int(row['season']) if pd.notna(row['season']) else 2024,
                highlight_url=str(row['highlight_url']) if pd.notna(row.get('highlight_url')) else None
            )
            games.append(game)
        
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
        if games_df.empty:
            return {"seasons": []}
        
        seasons = sorted(games_df['season'].dropna().unique().tolist(), reverse=True)
        return {"seasons": seasons}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching seasons: {str(e)}")

@app.get("/teams")
async def get_teams():
    """Get list of available teams"""
    try:
        if games_df.empty:
            return {"teams": []}
        
        home_teams = games_df['home_team'].dropna().unique()
        away_teams = games_df['away_team'].dropna().unique()
        all_teams = sorted(set(list(home_teams) + list(away_teams)))
        
        return {"teams": all_teams}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teams: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "total_games": len(games_df),
        "data_loaded": not games_df.empty
    }

if __name__ == "__main__":
    import uvicorn
    print(f"Loaded {len(games_df)} games from data file")
    uvicorn.run(app, host="0.0.0.0", port=8000)
