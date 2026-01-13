import { Router, Request, Response } from 'express'
import { authMiddleware } from '@/middleware/auth'
import { groupService } from '@/services/group.service'
import { Group } from '@/types'

const router = Router()

/**
 * POST /api/groups
 * Create a new group
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { memberIds, searchLocation, city, communityId, communityName, searchRadius } = req.body


    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'memberIds must be a non-empty array',
      })
    }

    if (!searchLocation || typeof searchLocation.lat !== 'number' || typeof searchLocation.lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'searchLocation must have lat and lng as numbers',
      })
    }

    if (!city || typeof city !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'city is required',
      })
    }

    const group = await groupService.createGroup(
      userId,
      memberIds,
      searchLocation,
      city,
      communityId,
      communityName,
      searchRadius
    )

    res.status(201).json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    console.error('Create group error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create group',
    })
  }
})

/**
 * GET /api/groups/:groupId
 * Get group details
 */
router.get('/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params

    const group = await groupService.getGroup(groupId)

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      })
    }

    res.json({
      success: true,
      data: group,
    })
  } catch (error: any) {
    console.error('Get group error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch group',
    })
  }
})

/**
 * GET /api/groups/user/active
 * Get user's active groups
 */
router.get('/user/active', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!

    const groups = await groupService.getUserActiveGroups(userId)

    res.json({
      success: true,
      data: groups,
      count: groups.length,
    })
  } catch (error: any) {
    console.error('Get active groups error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch groups',
    })
  }
})

/**
 * POST /api/groups/:groupId/members
 * Add member to group
 */
router.post('/:groupId/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId } = req.params
    const { newMemberId } = req.body

    if (!newMemberId) {
      return res.status(400).json({
        success: false,
        error: 'newMemberId is required',
      })
    }

    await groupService.addMember(groupId, newMemberId)

    res.json({
      success: true,
      message: `User ${newMemberId} added to group`,
    })
  } catch (error: any) {
    console.error('Add member error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to add member',
    })
  }
})

/**
 * DELETE /api/groups/:groupId/members/:memberId
 * Remove member from group
 */
router.delete('/:groupId/members/:memberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId, memberId } = req.params

    await groupService.removeMember(groupId, memberId)

    res.json({
      success: true,
      message: `User ${memberId} removed from group`,
    })
  } catch (error: any) {
    console.error('Remove member error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to remove member',
    })
  }
})

/**
 * POST /api/groups/:groupId/recommend
 * Generate recommendations for group
 */
router.post('/:groupId/recommend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params
    const { searchRadius } = req.body

    const recommendations = await groupService.generateRecommendations(groupId, searchRadius)

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    })
  } catch (error: any) {
    console.error('Generate recommendations error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to generate recommendations',
    })
  }
})

/**
 * POST /api/groups/:groupId/vote
 * Cast ranked choice votes
 */
router.post('/:groupId/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId } = req.params
    const { rankedPlaceIds } = req.body

    if (!rankedPlaceIds || !Array.isArray(rankedPlaceIds)) {
      return res.status(400).json({
        success: false,
        error: 'rankedPlaceIds must be an array',
      })
    }

    await groupService.castVotes(groupId, userId, rankedPlaceIds)

    res.json({
      success: true,
      message: 'Votes recorded',
    })
  } catch (error: any) {
    console.error('Cast votes error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to cast votes',
    })
  }
})

/**
 * GET /api/groups/:groupId/votes
 * Get voting results (ranked choice)
 */
router.get('/:groupId/votes', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params

    const results = await groupService.getVotingResults(groupId)

    // Sort by score descending
    const sorted = Object.entries(results)
      .sort(([, a], [, b]) => b.score - a.score)
      .map(([placeId, data]) => ({
        placeId,
        ...data,
      }))

    res.json({
      success: true,
      data: sorted,
    })
  } catch (error: any) {
    console.error('Get voting results error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch voting results',
    })
  }
})

/**
 * POST /api/groups/:groupId/finalize
 * Finalize group selection
 */
router.post('/:groupId/finalize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId } = req.params
    const { placeId, placeName, location } = req.body

    if (!placeId || !placeName) {
      return res.status(400).json({
        success: false,
        error: 'placeId and placeName are required',
      })
    }

    await groupService.finalizeSelection(groupId, placeId, placeName, location)

    res.json({
      success: true,
      message: `Group finalized with place: ${placeName}`,
    })
  } catch (error: any) {
    console.error('Finalize selection error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to finalize selection',
    })
  }
})

/**
 * POST /api/groups/:groupId/archive
 * Archive group instead of deleting
 */
router.post('/:groupId/archive', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId } = req.params

    const group = await groupService.getGroup(groupId)
    
    if (group === null){
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      })
    }

    if (group.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only creator can archive group',
      })
    }

    await groupService.archiveGroup(groupId)

    res.json({
      success: true,
      message: 'Group archived',
    })
  } catch (error: any) {
    console.error('Archive group error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to archive group',
    })
  }
})

/**
 * DELETE /api/groups/:groupId
 * Disband/delete group
 */
router.delete('/:groupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { groupId } = req.params

    await groupService.disbandGroup(groupId, userId)

    res.json({
      success: true,
      message: 'Group disbanded',
    })
  } catch (error: any) {
    console.error('Disband group error:', error)
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to disband group',
    })
  }
})

export default router