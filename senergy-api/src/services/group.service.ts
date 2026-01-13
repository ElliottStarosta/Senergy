import { db } from '@/config/firebase'
import admin from '@/config/firebase'
import { recommendationService } from './recommendation.service'
import { Group, GroupMember, RecommendedPlace } from '@/types'

export class GroupService {
  private groupsCol = db.collection('groups')
  private usersCol = db.collection('users')

  /**
   * Helper: Convert Discord ID to Firebase user ID
   */
  private async getFirebaseUserIdFromDiscordId(discordId: string): Promise<string> {
    const snapshot = await this.usersCol
      .where('discordId', '==', discordId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new Error(`User with Discord ID ${discordId} not found. They may need to register and verify.`)
    }

    return snapshot.docs[0].id
  }

  /**
   * Helper: Get user by Firebase ID or Discord ID
   */
  private async getUserByIdOrDiscordId(userId: string): Promise<{ id: string; data: any }> {
    // First try as Firebase ID
    let userDoc = await this.usersCol.doc(userId).get()
    
    if (userDoc.exists) {
      return { id: userDoc.id, data: userDoc.data() }
    }

    // Try as Discord ID
    const snapshot = await this.usersCol
      .where('discordId', '==', userId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      throw new Error(`User ${userId} not found`)
    }

    const doc = snapshot.docs[0]
    return { id: doc.id, data: doc.data() }
  }

  /**
   * Create a new group
   * @param createdBy - Firebase user ID or Discord ID of creator
   * @param memberIds - Array of Firebase user IDs or Discord IDs
   */
  async createGroup(
    createdBy: string,
    memberIds: string[],
    searchLocation: { lat: number; lng: number },
    city: string,
    communityId?: string,
    communityName?: string,
    searchRadius?: number
  ): Promise<Group> {

    // Convert Discord IDs to Firebase IDs if needed
    const creatorData = await this.getUserByIdOrDiscordId(createdBy)
    const creatorFirebaseId = creatorData.id

    // Convert all member IDs (could be Discord IDs or Firebase IDs)
    const firebaseMemberIds: string[] = []
    for (const memberId of memberIds) {
      try {
        const memberData = await this.getUserByIdOrDiscordId(memberId)
        firebaseMemberIds.push(memberData.id)
      } catch (error) {
        console.warn(`Skipping invalid member ID: ${memberId}`, error)
      }
    }

    // Ensure creator is in the group
    if (!firebaseMemberIds.includes(creatorFirebaseId)) {
      firebaseMemberIds.unshift(creatorFirebaseId)
    }

    // Get all member profiles using Firebase IDs
    const memberProfiles: { [key: string]: GroupMember } = {}
    for (const firebaseId of firebaseMemberIds) {
      const userDoc = await this.usersCol.doc(firebaseId).get()

      if (!userDoc.exists) {
        console.warn(`User ${firebaseId} not found, skipping`)
        continue
      }

      const user = userDoc.data()!
      memberProfiles[firebaseId] = {
        userId: firebaseId,
        displayName: user.displayName,
        adjustmentFactor: user.adjustmentFactor || 0,
        personalityType: user.personalityType || 'Unknown',
      }
    }

    console.log("SEARCH RADIUS!! ", searchRadius)

    const groupData = {
      createdBy: creatorFirebaseId,
      createdAt: new Date().toISOString(),
      members: firebaseMemberIds,
      memberProfiles,
      searchLocation,
      searchRadius: searchRadius,
      city,
      communityId: communityId || null,
      communityName: communityName || null,
      recommendedPlaces: [],
      votes: {},
      status: 'active' as const,
    }

    const groupRef = await this.groupsCol.add(groupData)

    // Update user stats
    for (const firebaseId of firebaseMemberIds) {
      await this.updateUserGroupStats(firebaseId, 1)
    }

    return { id: groupRef.id, ...groupData } as Group
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<Group | null> {
    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      return null
    }

    return { id: groupDoc.id, ...groupDoc.data() } as Group
  }

  /**
   * Get all active groups for a user (supports Discord ID or Firebase ID)
   */
  async getUserActiveGroups(userId: string): Promise<Group[]> {
    // Try to get Firebase ID if this is a Discord ID
    let firebaseId = userId
    try {
      const userData = await this.getUserByIdOrDiscordId(userId)
      firebaseId = userData.id
    } catch (error) {
      // If conversion fails, try with original ID
    }

    const snapshot = await this.groupsCol
      .where('members', 'array-contains', firebaseId)
      .get()

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group))
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, userId: string): Promise<void> {
    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }

    // Convert to Firebase ID if needed
    const userData = await this.getUserByIdOrDiscordId(userId)
    const firebaseId = userData.id
    const user = userData.data

    const group = groupDoc.data() as Group
    if (group.members.includes(firebaseId)) {
      throw new Error('User already in group')
    }

    const memberProfile: GroupMember = {
      userId: firebaseId,
      displayName: user.displayName,
      adjustmentFactor: user.adjustmentFactor || 0,
      personalityType: user.personalityType || 'Unknown',
    }

    const groupRef = this.groupsCol.doc(groupId)
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayUnion(firebaseId),
      [`memberProfiles.${firebaseId}`]: memberProfile,
    })

    await this.updateUserGroupStats(firebaseId, 1)
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }

    // Convert to Firebase ID if needed
    const userData = await this.getUserByIdOrDiscordId(userId)
    const firebaseId = userData.id

    const group = groupDoc.data() as Group

    // Don't allow creator to leave (must disband group)
    if (group.createdBy === firebaseId && group.members.length > 1) {
      throw new Error('Creator cannot leave group. Disband the group instead.')
    }

    const groupRef = this.groupsCol.doc(groupId)
    await groupRef.update({
      members: admin.firestore.FieldValue.arrayRemove(firebaseId),
    })

    // Remove from votes
    const updatedVotes = { ...group.votes }
    delete updatedVotes[firebaseId]
    await groupRef.update({ votes: updatedVotes })
  }

  /**
   * Generate recommendations for a group
   */
  async generateRecommendations(groupId: string, searchRadius?: number): Promise<RecommendedPlace[]> {
    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }

    const group = groupDoc.data() as Group
    const recommendations = await recommendationService.generateGroupRecommendations(
      group,
      searchRadius || group.searchRadius
    )

    // Store recommendations in group
    await this.groupsCol.doc(groupId).update({
      recommendedPlaces: recommendations,
    })

    return recommendations
  }

  /**
   * Cast ranked choice votes
   */
  async castVotes(groupId: string, userId: string, rankedPlaceIds: string[]): Promise<void> {
    if (rankedPlaceIds.length === 0 || rankedPlaceIds.length > 3) {
      throw new Error('Must vote for 1-3 places')
    }

    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }

    // Convert to Firebase ID if needed
    const userData = await this.getUserByIdOrDiscordId(userId)
    const firebaseId = userData.id

    const group = groupDoc.data() as Group
    if (!group.members.includes(firebaseId)) {
      throw new Error('User not in group')
    }

    await this.groupsCol.doc(groupId).update({
      [`votes.${firebaseId}`]: rankedPlaceIds,
    })
  }

  /**
   * Get voting results (ranked choice counting)
   */
  async getVotingResults(groupId: string): Promise<{
    [placeId: string]: { score: number; votes: Array<{ userId: string; rank: number }> }
  }> {
    const groupDoc = await this.groupsCol.doc(groupId).get()

    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }

    const group = groupDoc.data() as Group
    const results: { [placeId: string]: { score: number; votes: Array<any> } } = {}

    // Ranked choice voting: 1st choice = 3pts, 2nd = 2pts, 3rd = 1pt
    Object.entries(group.votes).forEach(([userId, rankedPlaces]) => {
      ;(rankedPlaces as string[]).forEach((placeId, index) => {
        if (!results[placeId]) {
          results[placeId] = { score: 0, votes: [] }
        }

        const points = [3, 2, 1][index] || 0
        results[placeId].score += points
        results[placeId].votes.push({ userId, rank: index + 1 })
      })
    })

    return results
  }

  /**
   * Finalize group selection
   */
  async finalizeSelection(groupId: string, placeId: string, placeName: string, location?: { lat: number, lng: number }) {
    const groupDoc = await this.groupsCol.doc(groupId).get()
  
    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }
  
    const group = groupDoc.data() as Group
  
    const updateData: any = {
      'finalPlace.placeId': placeId,
      'finalPlace.placeName': placeName,
      'finalPlace.selectedAt': new Date().toISOString(),
      status: 'place_selected',
    }
    
    if (location) {
      updateData['finalPlace.location'] = location
    }
    
    await this.groupsCol.doc(groupId).update(updateData)
  
    // Update user stats - increment totalGroupsJoined for tracking
    for (const memberId of group.members) {
      await this.updateUserGroupStats(memberId, 0) // 0 means no change to count, just update
    }
  }

  /**
   * Archive group
   */
  async archiveGroup(groupId: string): Promise<void> {
    await this.groupsCol.doc(groupId).update({ status: 'archived', archivedAt: new Date().toISOString() })
  }

  /**
   * Disband group
   */
  async disbandGroup(groupId: string, userId: string): Promise<void> {
    const groupDoc = await this.groupsCol.doc(groupId).get()
  
    if (!groupDoc.exists) {
      throw new Error('Group not found')
    }
  
    // Convert to Firebase ID if needed
    const userData = await this.getUserByIdOrDiscordId(userId)
    const firebaseId = userData.id
  
    const group = groupDoc.data() as Group
    if (group.createdBy !== firebaseId) {
      throw new Error('Only creator can disband group')
    }
  
    // Update status to archived instead of deleting
    await this.groupsCol.doc(groupId).update({ 
      status: 'archived',
      archivedAt: new Date().toISOString()
    })
  }

  /**
   * Get groups in a community
   */
  async getCommunityGroups(communityId: string): Promise<Group[]> {
    const snapshot = await this.groupsCol.where('communityId', '==', communityId).get()

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group))
  }

  /**
   * Private: Update user group stats
   */
  private async updateUserGroupStats(userId: string, increment: number): Promise<void> {
    const userDoc = await this.usersCol.doc(userId).get()

    if (userDoc.exists) {
      const user = userDoc.data()
      await this.usersCol.doc(userId).update({
        totalGroupsJoined: (user?.totalGroupsJoined || 0) + increment,
      })
    }
  }
}

export const groupService = new GroupService()