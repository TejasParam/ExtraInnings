import { useState, useEffect } from 'react';
import axios from 'axios';
import { GameResponse, ApiResponse } from '../types/game';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseGamesParams {
  season?: string;
  limit?: number;
  page?: number;
  sort?: string;
  team?: string;
  start?: string;
  end?: string;
}

export const useGames = (params: UseGamesParams = {}): ApiResponse<GameResponse> => {
  const [data, setData] = useState<GameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        if (params.season) queryParams.append('season', params.season);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.team) queryParams.append('team', params.team);
        if (params.start) queryParams.append('start', params.start);
        if (params.end) queryParams.append('end', params.end);

        const response = await axios.get(`${API_BASE_URL}/games?${queryParams}`);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [params.season, params.limit, params.page, params.sort, params.team, params.start, params.end]);

  return { data, error, loading };
};

export const useSeasons = (): ApiResponse<string[]> => {
  const [data, setData] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/seasons`);
        setData(response.data.seasons);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, []);

  return { data, error, loading };
};

export const useTeams = (): ApiResponse<string[]> => {
  const [data, setData] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/teams`);
        setData(response.data.teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return { data, error, loading };
};
