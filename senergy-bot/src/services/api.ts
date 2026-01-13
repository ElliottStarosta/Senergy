import axios, { AxiosInstance } from 'axios'

export class SenergyAPI {
  public client: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = process.env.BACKEND_URL || 'http://localhost:3001') {
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    })
  }

  /**
   * Register a new user (Discord bot context)
   */
  async registerUser(email: string, password: string, displayName: string) {
    try {
      const response = await this.client.post('/api/auth/register', {
        email,
        password,
        displayName,
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  /**
 * Get authentication token for a Discord user
 */
  async getUserToken(discordId: string): Promise<string | null> {
    try {
      const response = await this.client.post('/api/auth/discord', {
        discordId,
      })
      return response.data.token
    } catch (error: any) {
      console.error('Get user token error:', error)
      return null
    }
  }

  /**
   * Create a group
   */
  async createGroup(
    token: string,
    memberIds: string[],
    searchLocation: { lat: number; lng: number },
    city: string,
    searchRadius: number,
    discordChannelId?: string,
    discordGuildId?: string
  ) {
    try {
      const response = await this.client.post(
        '/api/groups',
        {
          memberIds,
          searchLocation,
          city,
          discordChannelId,
          discordGuildId,
          searchRadius,
        },


        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create group')
    }
  }

  /**
   * Get user's active groups
   */
  async getUserGroups(token: string) {
    try {
      const response = await this.client.get('/api/groups/user/active', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch groups')
    }
  }

  /**
   * Get group details
   */
  async getGroup(groupId: string) {
    try {
      const response = await this.client.get(`/api/groups/${groupId}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch group')
    }
  }

  /**
   * Generate recommendations for group
   */
  async generateRecommendations(token: string, groupId: string, searchRadius: number = 15) {
    try {
      const response = await this.client.post(
        `/api/groups/${groupId}/recommend`,
        { searchRadius },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to generate recommendations')
    }
  }

  /**
   * Get voting results
   */
  async getVotingResults(groupId: string) {
    try {
      const response = await this.client.get(`/api/groups/${groupId}/votes`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch voting results')
    }
  }

  /**
   * Cast votes for group
   */
  async castVotes(token: string, groupId: string, rankedPlaceIds: string[]) {
    try {
      const response = await this.client.post(
        `/api/groups/${groupId}/vote`,
        { rankedPlaceIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cast votes')
    }
  }

  /**
   * Finalize group selection
   */
  async finalizeSelection(token: string, groupId: string, placeId: string, placeName: string, location?: { lat: number, lng: number }) {
    try {
      const response = await this.client.post(
        `/api/groups/${groupId}/finalize`,
        { placeId, placeName, location },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to finalize selection')
    }
  }

  /**
   * Find similar users
   */
  async findSimilarUsers(token: string, personalityRange: number = 0.3, maxDistance: number = 50) {
    try {
      const response = await this.client.get(
        `/api/users/matches?personalityRange=${personalityRange}&maxDistance=${maxDistance}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to find similar users')
    }
  }

  /**
   * Get user profile by Firebase user ID
   */
  async getUserProfile(userId: string) {
    try {
      const response = await this.client.get(`/api/users/${userId}/profile`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch profile')
    }
  }

  /**
   * Get user profile by Discord ID
   */
  async getUserProfileByDiscordId(discordId: string) {
    try {
      const response = await this.client.get(`/api/users/discord/${discordId}/profile`)
      return response.data.data
    } catch (error: any) {
      console.error('Get profile error:', error)
      return null
    }
  }

  /**
   * Create a rating
   */
  async createRating(token: string, ratingData: any) {
    try {
      const response = await this.client.post('/api/ratings', ratingData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create rating')
    }

  }

  /**
   * Get user's ratings
   */
  async getUserRatings(token: string, limit: number = 10) {
    try {
      const response = await this.client.get(`/api/ratings?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch ratings')
    }
  }
}

export const api = new SenergyAPI()