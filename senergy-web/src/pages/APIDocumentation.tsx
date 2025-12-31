import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useNavigate } from 'react-router-dom'


// API Documentation - Easily updateable structure
const API_DOCUMENTATION = {
  auth: {
    category: 'Authentication',
    icon: 'fa-lock',
    color: 'from-[#5865F2] to-[#4752C4]',
    description: 'User authentication, registration, and OAuth integration',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        name: 'Register User',
        description: 'Create a new user account with email and password',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password (min 8 chars)' },
          { name: 'displayName', type: 'string', required: true, description: 'Display name for user profile' },
        ],
        response: {
          user: '{ id, email, displayName, createdAt, totalRatingsCount, totalGroupsJoined }',
          token: 'JWT token for authentication',
        },
        example: `curl -X POST http://localhost:3001/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"SecurePass123!","displayName":"John Doe"}'`,
        statusCodes: [
          { code: 201, message: 'User created successfully' },
          { code: 400, message: 'Missing required fields or validation failed' },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        name: 'Login User',
        description: 'Authenticate user with email and password',
        parameters: [
          { name: 'email', type: 'string', required: true, description: 'User email address' },
          { name: 'password', type: 'string', required: true, description: 'User password' },
        ],
        response: {
          user: '{ id, email, displayName, personalityType, adjustmentFactor, totalRatingsCount, totalGroupsJoined }',
          token: 'JWT token for authenticated requests',
        },
        example: `curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"SecurePass123!"}'`,
        statusCodes: [
          { code: 200, message: 'Login successful' },
          { code: 401, message: 'Invalid credentials' },
        ],
      },
      {
        method: 'GET',
        path: '/api/auth/verify',
        name: 'Verify Token',
        description: 'Verify JWT token and get current user information',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          user: '{ id, email, displayName, personalityType, adjustmentFactor, ... }',
        },
        example: `curl -X GET http://localhost:3001/api/auth/verify \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Token is valid' },
          { code: 401, message: 'Invalid or missing token' },
        ],
      },
      {
        method: 'POST',
        path: '/api/auth/google',
        name: 'Google OAuth',
        description: 'Authenticate or register using Google',
        parameters: [
          { name: 'token', type: 'string', required: true, description: 'Firebase ID token from Google Sign-In' },
        ],
        response: {
          user: '{ id, email, displayName, avatar, ... }',
          token: 'JWT token for session',
        },
        example: `curl -X POST http://localhost:3001/api/auth/google \\
  -H "Content-Type: application/json" \\
  -d '{"token":"<firebase_id_token>"}'`,
        statusCodes: [
          { code: 200, message: 'Google auth successful' },
          { code: 400, message: 'Invalid token' },
        ],
      },
    ],
  },
  quiz: {
    category: 'Personality Quiz',
    icon: 'fa-brain',
    color: 'from-yellow-500 to-orange-500',
    description: 'Personality assessment and profile management',
    endpoints: [
      {
        method: 'GET',
        path: '/api/quiz/questions',
        name: 'Get Quiz Questions',
        description: 'Retrieve all personality quiz questions',
        parameters: [],
        response: {
          questions: '[ { id, text, weight, reverse } ]',
        },
        example: `curl -X GET http://localhost:3001/api/quiz/questions \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Questions retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
      },
      {
        method: 'POST',
        path: '/api/quiz/submit',
        name: 'Submit Quiz',
        description: 'Submit quiz responses and calculate personality profile',
        parameters: [
          { name: 'responses', type: 'number[]', required: true, description: 'Array of responses (1-5 scale)' },
        ],
        response: {
          adjustmentFactor: '-1 to 1 scale (introvert to extrovert)',
          personalityType: 'Strong Introvert, Moderate Introvert, Ambivert, Moderate Extrovert, Strong Extrovert',
          description: 'Description of personality type',
          user: 'Updated user profile with personality data',
          verificationCode: 'Discord verification code (if Discord linked)',
        },
        example: `curl -X POST http://localhost:3001/api/quiz/submit \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"responses":[5,3,4,4,5,3,4,2,4,3]}'`,
        statusCodes: [
          { code: 200, message: 'Quiz submitted successfully' },
          { code: 400, message: 'Invalid responses format' },
        ],
      },
      {
        method: 'GET',
        path: '/api/quiz/result',
        name: 'Get Quiz Result',
        description: 'Retrieve stored quiz result for current user',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          quiz: '{ adjustmentFactor, personalityType, description, timestamp }',
        },
        example: `curl -X GET http://localhost:3001/api/quiz/result \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Quiz result found' },
          { code: 404, message: 'No quiz result found' },
        ],
      },
    ],
  },
  ratings: {
    category: 'Place Ratings',
    icon: 'fa-star',
    color: 'from-yellow-500 to-orange-500',
    description: 'Rate places and view aggregated ratings',
    endpoints: [
      {
        method: 'POST',
        path: '/api/ratings',
        name: 'Create Rating',
        description: 'Submit a rating for a place',
        parameters: [
          { name: 'placeId', type: 'string', required: true, description: 'Unique place identifier' },
          { name: 'placeName', type: 'string', required: true, description: 'Name of the place' },
          { name: 'placeAddress', type: 'string', required: false, description: 'Address of the place' },
          { name: 'location', type: 'object', required: true, description: '{ lat: number, lng: number }' },
          { name: 'categories', type: 'object', required: true, description: '{ atmosphere, service, crowdSize, noiseLevel, socialEnergy } (1-10 scale)' },
          { name: 'comment', type: 'string', required: false, description: 'Optional user comment' },
          { name: 'userAdjustmentFactor', type: 'number', required: false, description: 'User personality type adjustment factor' },
          { name: 'userPersonalityType', type: 'string', required: false, description: 'User personality type' },
        ],
        response: {
          id: 'Rating ID',
          overallScore: 'Calculated weighted overall score (1-10)',
          createdAt: 'Timestamp of rating creation',
        },
        example: `curl -X POST http://localhost:3001/api/ratings \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "placeId": "cafe_123",
    "placeName": "Brew & Co",
    "placeAddress": "123 Main St",
    "location": { "lat": 47.6062, "lng": -122.3321 },
    "categories": {
      "atmosphere": 8,
      "service": 7,
      "crowdSize": 6,
      "noiseLevel": 5,
      "socialEnergy": 7
    },
    "comment": "Great coffee and ambiance!"
  }'`,
        statusCodes: [
          { code: 201, message: 'Rating created successfully' },
          { code: 400, message: 'Validation failed' },
          { code: 500, message: 'Server error' },
        ],
      },
      {
        method: 'GET',
        path: '/api/ratings',
        name: 'Get User Ratings',
        description: 'Retrieve all ratings submitted by current user (paginated)',
        parameters: [
          { name: 'limit', type: 'number', required: false, description: 'Results per page (default: 50, max: 100)' },
          { name: 'offset', type: 'number', required: false, description: 'Pagination offset (default: 0)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { id, placeId, placeName, overallScore, categories, comment, createdAt } ]',
          pagination: '{ limit, offset, count }',
        },
        example: `curl -X GET "http://localhost:3001/api/ratings?limit=10&offset=0" \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Ratings retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
      },
      {
        method: 'GET',
        path: '/api/ratings/place/:placeId',
        name: 'Get Place Ratings',
        description: 'Get all ratings for a specific place with aggregated statistics',
        parameters: [
          { name: 'placeId', type: 'string (path)', required: true, description: 'Place identifier' },
        ],
        response: {
          ratings: '[ { id, userId, overallScore, categories, comment, createdAt } ]',
          stats: '{ totalRatings, avgOverallScore, byPersonality, avgCategories, lastRatedAt }',
        },
        example: `curl -X GET http://localhost:3001/api/ratings/place/cafe_123`,
        statusCodes: [
          { code: 200, message: 'Place ratings retrieved' },
          { code: 404, message: 'Place not found' },
        ],
      },
      {
        method: 'PUT',
        path: '/api/ratings/:ratingId',
        name: 'Update Rating',
        description: 'Update an existing rating (only by original author)',
        parameters: [
          { name: 'ratingId', type: 'string (path)', required: true, description: 'Rating ID to update' },
          { name: 'categories', type: 'object', required: false, description: 'Updated category ratings' },
          { name: 'comment', type: 'string', required: false, description: 'Updated comment' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Rating updated',
        },
        example: `curl -X PUT http://localhost:3001/api/ratings/rating_123 \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"categories":{"atmosphere":9},"comment":"Even better now!"}'`,
        statusCodes: [
          { code: 200, message: 'Rating updated' },
          { code: 403, message: 'Unauthorized to update this rating' },
          { code: 404, message: 'Rating not found' },
        ],
      },
      {
        method: 'DELETE',
        path: '/api/ratings/:ratingId',
        name: 'Delete Rating',
        description: 'Delete a rating (only by original author)',
        parameters: [
          { name: 'ratingId', type: 'string (path)', required: true, description: 'Rating ID to delete' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Rating deleted',
        },
        example: `curl -X DELETE http://localhost:3001/api/ratings/rating_123 \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Rating deleted' },
          { code: 403, message: 'Unauthorized' },
          { code: 404, message: 'Rating not found' },
        ],
      },
    ],
  },
  places: {
    category: 'Places & Search',
    icon: 'fa-map-marker-alt',
    color: 'from-green-500 to-emerald-500',
    description: 'Search places and get location information',
    endpoints: [
      {
        method: 'GET',
        path: '/api/places/search',
        name: 'Search Places',
        description: 'Search for places by name and location (uses Algolia or OpenStreetMap)',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query (place name or type)' },
          { name: 'location', type: 'string', required: false, description: 'Coordinates in format "lat,lng"' },
          { name: 'radius', type: 'number', required: false, description: 'Search radius in meters (default: 15000)' },
          { name: 'category', type: 'string', required: false, description: 'Filter by category' },
        ],
        response: {
          data: '[ { id, name, address, location, category, stats } ]',
          source: '"algolia" or "openstreetmap"',
          count: 'Number of results',
        },
        example: `curl -X GET "http://localhost:3001/api/places/search?query=cafe&location=47.6062,-122.3321&radius=5000"`,
        statusCodes: [
          { code: 200, message: 'Places found' },
          { code: 400, message: 'Missing search query' },
          { code: 500, message: 'Search service unavailable' },
        ],
      },
      {
        method: 'GET',
        path: '/api/places/reverse',
        name: 'Reverse Geocode',
        description: 'Convert coordinates to address information',
        parameters: [
          { name: 'lat', type: 'number', required: true, description: 'Latitude' },
          { name: 'lng', type: 'number', required: true, description: 'Longitude' },
        ],
        response: {
          data: '{ id, name, address, location }',
        },
        example: `curl -X GET "http://localhost:3001/api/places/reverse?lat=47.6062&lng=-122.3321"`,
        statusCodes: [
          { code: 200, message: 'Address found' },
          { code: 400, message: 'Invalid coordinates' },
        ],
      },
      {
        method: 'GET',
        path: '/api/places/:placeId',
        name: 'Get Place Details',
        description: 'Get detailed information about a specific place',
        parameters: [
          { name: 'placeId', type: 'string (path)', required: true, description: 'Place identifier' },
        ],
        response: {
          data: '{ id, name, address, location, stats }',
        },
        example: `curl -X GET http://localhost:3001/api/places/cafe_123`,
        statusCodes: [
          { code: 200, message: 'Place details retrieved' },
          { code: 404, message: 'Place not found' },
        ],
      },
    ],
  },
  groups: {
    category: 'Groups',
    icon: 'fa-users',
    color: 'from-green-500 to-emerald-500',
    description: 'Create and manage group decisions',
    endpoints: [
      {
        method: 'POST',
        path: '/api/groups',
        name: 'Create Group',
        description: 'Create a new group for collaborative place selection',
        parameters: [
          { name: 'memberIds', type: 'string[]', required: true, description: 'Array of user IDs to include' },
          { name: 'searchLocation', type: 'object', required: true, description: '{ lat: number, lng: number }' },
          { name: 'city', type: 'string', required: true, description: 'City name for the group' },
          { name: 'searchRadius', type: 'number', required: false, description: 'Search radius in km (default: 15)' },
          { name: 'communityId', type: 'string', required: false, description: 'Associated community ID' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '{ id, createdBy, members, memberProfiles, searchLocation, city, status }',
        },
        example: `curl -X POST http://localhost:3001/api/groups \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "memberIds": ["user1", "user2", "user3"],
    "searchLocation": { "lat": 47.6062, "lng": -122.3321 },
    "city": "Seattle",
    "searchRadius": 15
  }'`,
        statusCodes: [
          { code: 201, message: 'Group created' },
          { code: 400, message: 'Invalid members or location' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/:groupId',
        name: 'Get Group Details',
        description: 'Retrieve detailed information about a group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
        ],
        response: {
          data: '{ id, members, memberProfiles, recommendedPlaces, votes, status }',
        },
        example: `curl -X GET http://localhost:3001/api/groups/group_123`,
        statusCodes: [
          { code: 200, message: 'Group found' },
          { code: 404, message: 'Group not found' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/user/active',
        name: 'Get User Groups',
        description: 'Get all active groups for current user',
        parameters: [],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { id, members, city, status } ]',
          count: 'Number of active groups',
        },
        example: `curl -X GET http://localhost:3001/api/groups/user/active \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Groups retrieved' },
          { code: 401, message: 'Unauthorized' },
        ],
      },
      {
        method: 'POST',
        path: '/api/groups/:groupId/recommend',
        name: 'Generate Recommendations',
        description: 'Generate personalized place recommendations for group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
          { name: 'searchRadius', type: 'number', required: false, description: 'Override search radius' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { placeId, placeName, predictedScore, confidenceScore, reasoning } ]',
          count: 'Number of recommendations',
        },
        example: `curl -X POST http://localhost:3001/api/groups/group_123/recommend \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"searchRadius": 20}'`,
        statusCodes: [
          { code: 200, message: 'Recommendations generated' },
          { code: 400, message: 'Failed to generate recommendations' },
        ],
      },
      {
        method: 'POST',
        path: '/api/groups/:groupId/vote',
        name: 'Cast Votes',
        description: 'Submit ranked choice votes for places',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
          { name: 'rankedPlaceIds', type: 'string[]', required: true, description: 'Array of place IDs in rank order (1-3)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          message: 'Votes recorded',
        },
        example: `curl -X POST http://localhost:3001/api/groups/group_123/vote \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -H "Content-Type: application/json" \\
  -d '{"rankedPlaceIds": ["place_1", "place_2", "place_3"]}'`,
        statusCodes: [
          { code: 200, message: 'Votes submitted' },
          { code: 400, message: 'Invalid votes format' },
        ],
      },
      {
        method: 'GET',
        path: '/api/groups/:groupId/votes',
        name: 'Get Voting Results',
        description: 'Get ranked choice voting results for group',
        parameters: [
          { name: 'groupId', type: 'string (path)', required: true, description: 'Group ID' },
        ],
        response: {
          data: '{ placeId: { score, votes } }',
        },
        example: `curl -X GET http://localhost:3001/api/groups/group_123/votes`,
        statusCodes: [
          { code: 200, message: 'Results retrieved' },
          { code: 404, message: 'Group not found' },
        ],
      },
    ],
  },
  users: {
    category: 'Users & Matching',
    icon: 'fa-heart',
    color: 'from-pink-500 to-rose-500',
    description: 'Find similar users and manage user profiles',
    endpoints: [
      {
        method: 'GET',
        path: '/api/users/matches',
        name: 'Find Similar Users',
        description: 'Find users with similar personality types and location',
        parameters: [
          { name: 'personalityRange', type: 'number', required: false, description: 'Personality similarity range 0-1 (default: 0.3)' },
          { name: 'maxDistance', type: 'number', required: false, description: 'Max distance in km (default: 50)' },
        ],
        headers: [
          { name: 'Authorization', value: 'Bearer <token>', required: true },
        ],
        response: {
          data: '[ { userId, displayName, personalityType, adjustmentFactor, similarity, distance } ]',
          count: 'Number of matches',
        },
        example: `curl -X GET "http://localhost:3001/api/users/matches?personalityRange=0.3&maxDistance=50" \\
  -H "Authorization: Bearer <your_jwt_token>"`,
        statusCodes: [
          { code: 200, message: 'Matches found' },
          { code: 400, message: 'Invalid parameters' },
        ],
      },
      {
        method: 'GET',
        path: '/api/users/:userId/profile',
        name: 'Get User Profile',
        description: 'Get public user profile information',
        parameters: [
          { name: 'userId', type: 'string (path)', required: true, description: 'User ID' },
        ],
        response: {
          data: '{ id, displayName, avatar, personalityType, adjustmentFactor, totalRatingsCount, totalGroupsJoined }',
        },
        example: `curl -X GET http://localhost:3001/api/users/user_123`,
        statusCodes: [
          { code: 200, message: 'Profile found' },
          { code: 404, message: 'User not found' },
        ],
      },
      {
        method: 'GET',
        path: '/api/users/similarity/:userId1/:userId2',
        name: 'Calculate Similarity',
        description: 'Calculate similarity between two users',
        parameters: [
          { name: 'userId1', type: 'string (path)', required: true, description: 'First user ID' },
          { name: 'userId2', type: 'string (path)', required: true, description: 'Second user ID' },
        ],
        response: {
          similarity: 'Score from 0-1',
          similarityPercent: 'Percentage (0-100)',
        },
        example: `curl -X GET http://localhost:3001/api/users/similarity/user_1/user_2`,
        statusCodes: [
          { code: 200, message: 'Similarity calculated' },
          { code: 404, message: 'User not found' },
        ],
      },
    ],
  },
}

export const APIDocumentation: React.FC = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const categoryHeaderRef = useRef<HTMLDivElement>(null)
  const endpointRefs = useRef<(HTMLDivElement | null)[]>([])
  
  const [activeCategory, setActiveCategory] = useState('auth')
  const [activeEndpoint, setActiveEndpoint] = useState(-1)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Initial page load animation
  useEffect(() => {
    if (!containerRef.current || !sidebarRef.current || !contentRef.current || !headerRef.current) return
    
    const tl = gsap.timeline()
    
    tl.fromTo(headerRef.current, 
      { y: -100, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    )
    
    tl.fromTo(sidebarRef.current, 
      { x: -100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' }, 
      0.2
    )
    
    tl.fromTo(contentRef.current, 
      { x: 100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' }, 
      0.3
    )
  }, [])

  // Category change animation
  useEffect(() => {
    if (!categoryHeaderRef.current) return
    
    gsap.fromTo(categoryHeaderRef.current,
      { scale: 0.95, opacity: 0, rotateX: -15 },
      { scale: 1, opacity: 1, rotateX: 0, duration: 0.6, ease: 'back.out(1.4)' }
    )
    
    endpointRefs.current.forEach((ref, idx) => {
      if (ref) {
        gsap.fromTo(ref,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: idx * 0.1, ease: 'power2.out' }
        )
      }
    })
  }, [activeCategory])

  // Endpoint expansion animation
  useEffect(() => {
    const expandedContent = document.querySelector(`#endpoint-content-${activeEndpoint}`)
    if (expandedContent) {
      gsap.fromTo(expandedContent,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [activeEndpoint])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    
    const button = document.querySelector(`#copy-btn-${id}`)
    if (button) {
      gsap.to(button, { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 })
    }
    
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId)
    setActiveEndpoint(-1)
  }

  const handleEndpointClick = (idx: number) => {
    const wasActive = activeEndpoint === idx
    setActiveEndpoint(idx)
    
    const element = endpointRefs.current[idx]
    if (element && !wasActive) {
      gsap.to(element, { 
        scale: 1.02, 
        duration: 0.2, 
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(element, { scale: 1, duration: 0.2, ease: 'power2.out' })
          // Scroll to top of element with 10px extra offset
          const elementTop = element.getBoundingClientRect().top + window.scrollY - 100
          window.scrollTo({ top: elementTop, behavior: 'smooth' })
        }
      })
    }
  }

  const handleCategoryHover = (e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean) => {
    const icon = e.currentTarget.querySelector('.category-icon')
    if (icon) {
      gsap.to(icon, {
        rotate: isEnter ? 360 : 0,
        scale: isEnter ? 1.1 : 1,
        duration: 0.5,
        ease: 'back.out(2)'
      })
    }
  }

  const categories = Object.entries(API_DOCUMENTATION).map(([key, value]) => ({ id: key, ...value }))
  const currentCategory = API_DOCUMENTATION[activeCategory as keyof typeof API_DOCUMENTATION]
  // const currentEndpoint = currentCategory?.endpoints[activeEndpoint]

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-neutral-50 via-slate-50 to-blue-50">
      {/* Header */}
      <header ref={headerRef} className="w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <i className="fas fa-code text-white text-lg" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Documentation</p>
              <h1 className="text-lg font-bold text-slate-900">Senergy API</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl text-slate-700 text-sm font-semibold border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all hover:scale-105"
          >
            <i className="fas fa-arrow-left mr-2" />
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <aside ref={sidebarRef} className="w-72 flex-shrink-0 sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 hover:shadow-2xl transition-shadow duration-300">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">API Reference</h2>
            <nav className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  onMouseEnter={(e) => handleCategoryHover(e, true)}
                  onMouseLeave={(e) => handleCategoryHover(e, false)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 group ${
                    activeCategory === cat.id
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                      : 'text-slate-700 hover:bg-slate-50 hover:scale-102 hover:shadow-md'
                  }`}
                >
                  <div className={`category-icon w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${activeCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <i className={`fas ${cat.icon} ${activeCategory === cat.id ? 'text-white' : `text-slate-600`}`} />
                  </div>
                  <span className="flex-1 text-left">{cat.category}</span>
                  {activeCategory === cat.id && (
                    <i className="fas fa-chevron-right text-white/80 animate-pulse" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {currentCategory && (
            <>
              {/* Category Header */}
              <div 
                ref={categoryHeaderRef}
                className={`bg-gradient-to-br ${currentCategory.color} rounded-2xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden hover:shadow-3xl transition-shadow duration-300`}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
                </div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-6 transition-all duration-300">
                    <i className={`fas ${currentCategory.icon} text-3xl`} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black">{currentCategory.category}</h1>
                    <p className="text-white/80 mt-1">{currentCategory.description}</p>
                  </div>
                </div>
              </div>

              {/* Endpoints */}
              <div className="space-y-6">
                {currentCategory.endpoints.map((endpoint, idx) => (
                  <div 
                    key={idx}
                    ref={(el) => { endpointRefs.current[idx] = el!; }}
                    className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl ${
                      activeEndpoint === idx ? 'border-indigo-400 shadow-indigo-100' : 'border-slate-200 hover:border-slate-300'
                    }`} 
                    onClick={() => handleEndpointClick(idx)}
                  >
                    {/* Endpoint Header */}
                    <div className="p-6 border-b border-slate-200 hover:bg-slate-50/50 transition-colors duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${
                            endpoint.method === 'GET' ? 'bg-blue-500' : 
                            endpoint.method === 'POST' ? 'bg-green-500' : 
                            endpoint.method === 'PUT' ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-sm font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors duration-300">{endpoint.path}</code>
                        </div>
                        <i className={`fas fa-chevron-down transition-all duration-500 text-slate-400 ${activeEndpoint === idx ? 'rotate-180 text-indigo-500' : ''}`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{endpoint.name}</h3>
                      <p className="text-slate-600 text-sm mt-2">{endpoint.description}</p>
                    </div>

                    {/* Expanded Content */}
                    {activeEndpoint === idx && (
                      <div id={`endpoint-content-${idx}`} className="bg-gradient-to-b from-slate-50 to-white p-6 space-y-6 border-t border-slate-200">
                        {/* Parameters */}
                        {endpoint.parameters.length > 0 && (
                          <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <i className="fas fa-sliders-h text-indigo-500" />
                              Parameters
                            </h4>
                            <div className="space-y-2">
                              {endpoint.parameters.map((param, pidx) => (
                                <div 
                                  key={pidx} 
                                  className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all duration-300 hover:scale-102"
                                  style={{ animationDelay: `${pidx * 50}ms` }}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-mono text-indigo-600 font-semibold">{param.name}</code>
                                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">{param.type}</span>
                                    {param.required && (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold animate-pulse">Required</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600">{param.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <i className="fas fa-reply text-green-500" />
                            Response
                          </h4>
                          <div className="p-4 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-700 space-y-1 hover:border-green-200 hover:shadow-md transition-all duration-300">
                            {Object.entries(endpoint.response).map(([key, val]) => (
                              <div key={key} className="hover:bg-slate-50 px-2 py-1 rounded transition-colors duration-200">
                                <span className="text-indigo-600 font-semibold">{key}:</span> <span className="text-slate-600">{val as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Example */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <i className="fas fa-code text-purple-500" />
                            Example Request
                          </h4>
                          <div className="relative group">
                            <pre className="p-4 bg-slate-900 rounded-lg text-green-400 text-xs overflow-x-auto hover:shadow-xl transition-shadow duration-300 border border-slate-700">{endpoint.example}</pre>
                            <button
                              id={`copy-btn-example-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(endpoint.example, `example-${idx}`)
                              }}
                              onMouseEnter={(e) => {
                                gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })
                              }}
                              onMouseLeave={(e) => {
                                gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })
                              }}
                              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                            >
                              {copiedCode === `example-${idx}` ? (
                                <>
                                  <i className="fas fa-check mr-1 text-green-400" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-copy mr-1" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}