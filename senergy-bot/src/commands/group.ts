import {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    CommandInteraction,
    ChatInputCommandInteraction,
    ButtonInteraction,
    StringSelectMenuInteraction,
    TextChannel,
    CategoryChannel,
    Client
} from 'discord.js'
import { api } from '../services/api'

export const command = new SlashCommandBuilder()
    .setName('group')
    .setDescription('Create a group to plan an outing')
    .addStringOption(option =>
        option
            .setName('location')
            .setDescription('City or area (e.g., "Seattle", "Downtown")')
            .setRequired(true)
    )

interface GroupSession {
    creatorId: string
    location: string
    members: Set<string>
    channelId: string
    groupId?: string
    recommendations?: any[]
    votes: Map<string, string[]> // userId -> ranked placeIds
}

// Store active group sessions
const activeSessions = new Map<string, GroupSession>()

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    try {
        const location = interaction.options.getString('location', true)
        const creator = interaction.user

        // Verify user is registered
        const userRecord = await api.getUserProfileByDiscordId(creator.id)
        if (!userRecord || !userRecord.id) {
            return interaction.editReply({
                content: '❌ You must register first! Use `/register`',
            })
        }

        // Check if user has completed personality quiz
        if (!userRecord.personalityType) {
            return interaction.editReply({
                content: '❌ Complete your personality quiz first! Use `/profile`',
            })
        }

        // Create the group planning channel
        const guild = interaction.guild
        if (!guild) {
            return interaction.editReply({
                content: '❌ This command must be used in a server',
            })
        }

        // Find or create "SENERGY GROUPS" category
        let category = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === 'SENERGY GROUPS'
        ) as CategoryChannel

        if (!category) {
            category = await guild.channels.create({
                name: 'SENERGY GROUPS',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                ],
            })
        }

        // Create private channel
        const channelName = `group-${location.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`
        const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone role - deny access to all
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: creator.id, // Only the creator can see initially
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: interaction.client.user!.id, // Allow bot to see the channel
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ],
        })

        // Initialize session
        const session: GroupSession = {
            creatorId: creator.id,
            location,
            members: new Set([creator.id]),
            channelId: channel.id,
            votes: new Map(),
        }
        activeSessions.set(channel.id, session)

        // Send welcome message in the channel
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x6366f1)
            .setTitle('🎯 Group Planning Session')
            .setDescription(
                `Planning an outing in **${location}**!\n\n` +
                `👤 **Creator:** ${creator}\n` +
                `📍 **Location:** ${location}\n\n` +
                `Use the buttons below to add members to your group.`
            )
            .setFooter({ text: 'Senergy Group Planner' })
            .setTimestamp()

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('group_add_members')
                .setLabel('Add Members')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👥'),
            new ButtonBuilder()
                .setCustomId('group_generate_recs')
                .setLabel('Get Recommendations')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎯'),
            new ButtonBuilder()
                .setCustomId('group_cancel')
                .setLabel('Cancel Group')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        )

        await channel.send({ embeds: [welcomeEmbed], components: [row] })

        // Reply to user
        await interaction.editReply({
            content: `✅ Group channel created! Check out ${channel}`,
        })
    } catch (error: any) {
        console.error('Group creation error:', error)
        await interaction.editReply({
            content: '❌ Failed to create group: ' + error.message,
        })
    }
}

// Button handler for adding members
export async function handleAddMembers(interaction: ButtonInteraction) {
    const session = activeSessions.get(interaction.channelId!)
    if (!session) {
      return interaction.reply({ content: '❌ Session not found', ephemeral: true })
    }
  
    if (interaction.user.id !== session.creatorId) {
      return interaction.reply({ content: '❌ Only the creator can add members', ephemeral: true })
    }
  
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ Guild not found', ephemeral: true })
    }
  
    await interaction.deferReply({ ephemeral: true })
  
    try {
      // Only fetch if cache is empty or small
      if (interaction.guild.members.cache.size < 10) {
        await interaction.guild.members.fetch()
        console.log('✅ Fetched guild members')
      }
  
      // Get all members except bot and current members
      const availableMembers = interaction.guild.members.cache
        .filter(member => 
          !member.user.bot && 
          !session.members.has(member.id)
        )
        .map(member => ({
          id: member.id,
          displayName: member.displayName,
          username: member.user.username
        }))
        .slice(0, 25) // Discord limit for select menu
  
      if (availableMembers.length === 0) {
        return interaction.editReply({
          content: '❌ No available members to add (all members are already in the group or are bots)'
        })
      }
  
      // Create select menu with available members
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`group_add_member_select_${interaction.channelId}`)
        .setPlaceholder('Select members to add')
        .setMinValues(1)
        .setMaxValues(Math.min(availableMembers.length, 10))
        .addOptions(
          availableMembers.map(member => ({
            label: member.displayName,
            description: `@${member.username}`,
            value: member.id,
          }))
        )
  
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)
  
      await interaction.editReply({
        content: '👥 **Select members to add to the group:**\n\n⚠️ Only members who have registered with Senergy can be added.',
        components: [row],
      })
  
    } catch (error: any) {
      console.error('Error fetching members:', error)
      
      // Handle rate limit gracefully
      if (error.name === 'GatewayRateLimitError') {
        return interaction.editReply({
          content: '❌ Too many requests. Please wait a moment and try again.',
        })
      }
      
      await interaction.editReply({
        content: '❌ Failed to fetch server members. Please try again in a moment.',
      })
    }
  }

  export async function handleAddMemberSelect(interaction: StringSelectMenuInteraction) {
    await interaction.deferUpdate()
  
    const channelId = interaction.customId.split('_').pop()!
    const session = activeSessions.get(channelId)
  
    if (!session) {
      return interaction.followUp({ content: '❌ Session not found', ephemeral: true })
    }
  
    const selectedUserIds = interaction.values
    const channel = interaction.channel as TextChannel
  
    let addedCount = 0
    let skippedUsers: string[] = []
  
    for (const userId of selectedUserIds) {
      try {
        const user = await interaction.client.users.fetch(userId)
  
        // Check if user is registered - HANDLE 404 gracefully
        let userProfile
        try {
          userProfile = await api.getUserProfileByDiscordId(userId)
        } catch (error: any) {
          // User not found in database (404 error)
          if (error.response?.status === 404 || !userProfile) {
            skippedUsers.push(`**${user.username}** - Not registered (use \`/register\`)`)
            continue
          }
          throw error // Re-throw if it's a different error
        }
  
        if (!userProfile || !userProfile.id) {
          skippedUsers.push(`**${user.username}** - Not registered (use \`/register\`)`)
          continue
        }
  
        if (!userProfile.personalityType) {
          skippedUsers.push(`**${user.username}** - Hasn't completed personality quiz`)
          continue
        }
  
        // Add channel permission
        await channel.permissionOverwrites.create(userId, {
          ViewChannel: true,
          SendMessages: true,
        })
  
        session.members.add(userId)
        addedCount++
  
        // Send notification DM
        try {
          await user.send(
            `🎯 You've been added to a group planning session in **${interaction.guild?.name}**!\n` +
            `📍 Location: **${session.location}**\n` +
            `Check out ${channel} to participate.`
          )
        } catch (err) {
          console.log(`Could not DM ${user.tag}`)
        }
      } catch (error) {
        console.error(`Error adding user ${userId}:`, error)
        skippedUsers.push(`User ID ${userId} - Error occurred`)
      }
    }
  
    // Update channel message
    const responseEmbed = new EmbedBuilder()
      .setColor(addedCount > 0 ? 0x10b981 : 0xf59e0b)
      .setTitle(addedCount > 0 ? '✅ Members Added!' : '⚠️ No Members Added')
      .setDescription(
        `**Added:** ${addedCount} member(s)\n\n` +
        `**Current Group Members (${session.members.size}):**\n` +
        Array.from(session.members)
          .map(id => `• <@${id}>`)
          .join('\n') +
        (skippedUsers.length > 0 ? `\n\n**⚠️ Skipped:**\n${skippedUsers.map(s => `• ${s}`).join('\n')}` : '')
      )
  
    if (skippedUsers.length > 0) {
      responseEmbed.setFooter({ 
        text: 'Users must register at the web app and complete the personality quiz first' 
      })
    }
  
    await channel.send({ embeds: [responseEmbed] })
  
    // Clear the select menu
    await interaction.editReply({ 
      content: addedCount > 0 
        ? `✅ Added ${addedCount} member(s) to the group!` 
        : '⚠️ No members were added. See the message above for details.',
      components: [] 
    })
  }

// Button handler for generating recommendations
export async function handleGenerateRecommendations(interaction: ButtonInteraction) {
  await interaction.deferReply()

  const session = activeSessions.get(interaction.channelId!)
  if (!session) {
    return interaction.editReply('❌ Session not found')
  }

  if (session.members.size < 2) {
    return interaction.editReply('❌ You need at least 2 members (including yourself) to generate recommendations.')
  }

  try {
    // Get all member profiles
    const memberProfiles: any[] = []
    const memberProfileMap = new Map<string, any>()
    
    for (const memberId of session.members) {
      const profile = await api.getUserProfileByDiscordId(memberId)
      if (profile) {
        memberProfiles.push(profile)
        memberProfileMap.set(profile.id, { discordId: memberId, profile })
      }
    }

    console.log('[Recommendations] Member profiles:', memberProfiles.map(p => ({ id: p.id, name: p.displayName })))

    // Calculate group centroid location
    const locationsWithRatings = memberProfiles
      .filter(p => p.lastRatedPlaceLocation)
      .map(p => p.lastRatedPlaceLocation!)

    if (locationsWithRatings.length === 0) {
      return interaction.editReply(
        '❌ No location data available. Members need to rate places first to establish their location.'
      )
    }

    const avgLat = locationsWithRatings.reduce((sum, loc) => sum + loc.lat, 0) / locationsWithRatings.length
    const avgLng = locationsWithRatings.reduce((sum, loc) => sum + loc.lng, 0) / locationsWithRatings.length

    const firstMemberId = Array.from(session.members)[0]
    const token = await api.getUserToken(firstMemberId)

    if (!token) {
      return interaction.editReply('❌ Failed to authenticate. Please try again.')
    }

    // Create group in backend - use Firebase user IDs, not Discord IDs
    const firebaseUserIds = memberProfiles.map(p => p.id)
    console.log('[Recommendations] Creating group with Firebase IDs:', firebaseUserIds)

    const groupData = await api.createGroup(
      token,
      firebaseUserIds,
      { lat: avgLat, lng: avgLng },
      session.location
    )

    session.groupId = groupData.id
    console.log('[Recommendations] Group created:', groupData.id)

    // Generate recommendations
    const recommendations = await api.generateRecommendations(token, groupData.id)
    session.recommendations = recommendations

    console.log('[Recommendations] Got recommendations:', recommendations.length)
    console.log('[Recommendations] First recommendation memberScores:', recommendations[0]?.memberScores)

    if (!recommendations || recommendations.length === 0) {
      return interaction.editReply('❌ No recommendations found for your group. Try a different location or add more members.')
    }

    // Send personalized messages to each member
    let successCount = 0
    let failCount = 0
    
    for (const memberId of session.members) {
      try {
        const member = await interaction.client.users.fetch(memberId)
        
        // Find this Discord user's Firebase ID
        let firebaseUserId: string | null = null
        for (const [fbId, data] of memberProfileMap) {
          if (data.discordId === memberId) {
            firebaseUserId = fbId
            break
          }
        }

        if (!firebaseUserId) {
          console.log(`[Recommendations] Could not find Firebase ID for Discord user ${memberId}`)
          failCount++
          continue
        }

        console.log(`[Recommendations] Processing Discord user ${memberId} -> Firebase user ${firebaseUserId}`)

        // Create personalized embed for this member
        const personalEmbed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle('🎯 Your Personalized Recommendations')
          .setDescription(
            `Hey **${member.username}**! Based on your unique taste profile, here are places we think you'll love.\n\n` +
            `*These recommendations are personalized just for you.*`
          )
          .setFooter({ text: '💡 Head to the group channel to cast your vote!' })

        let hasValidScores = false

        recommendations.slice(0, 3).forEach((rec: any, index: number) => {
          const medal = ['🥇', '🥈', '🥉'][index]
          
          // Find user's score using Firebase user ID
          const userScore = rec.memberScores?.find((ms: any) => ms.userId === firebaseUserId)
          
          console.log(`[Recommendations] Place ${rec.placeName}:`)
          console.log(`  - Looking for userId: ${firebaseUserId}`)
          console.log(`  - Available scores:`, rec.memberScores?.map((ms: any) => ms.userId))
          console.log(`  - Found score:`, userScore)
          
          if (userScore) {
            hasValidScores = true
            
            // Parse reasoning if it contains bullet points
            const reasoningLines = rec.reasoning.split('•').map((line: string) => line.trim()).filter((line: string) => line)
            const mainReasoning = reasoningLines[0] || rec.reasoning
            const bulletPoints = reasoningLines.slice(1)
            
            let fieldValue = `**Match Score:** ${userScore.score.toFixed(1)}/10 ⭐\n` +
                           `**Confidence:** ${userScore.confidence}%\n\n`
            
            if (bulletPoints.length > 0) {
              fieldValue += `**Why this matches you:**\n${mainReasoning}\n`
              bulletPoints.forEach((point: string) => {
                fieldValue += `• ${point}\n`
              })
            } else {
              fieldValue += `**Why this matches you:**\n${mainReasoning}\n`
            }
            
            fieldValue += `\n📍 ${rec.address || 'Address unavailable'}`
            
            personalEmbed.addFields({
              name: `${medal} ${rec.placeName}`,
              value: fieldValue,
              inline: false,
            })
          } else {
            // Fallback: show group score
            const reasoningLines = rec.reasoning.split('•').map((line: string) => line.trim()).filter((line: string) => line)
            const mainReasoning = reasoningLines[0] || rec.reasoning
            const bulletPoints = reasoningLines.slice(1)
            
            let fieldValue = `**Group Score:** ${rec.predictedScore.toFixed(1)}/10 ⭐\n` +
                           `**Confidence:** ${Math.round(rec.confidenceScore * 100)}%\n\n`
            
            if (bulletPoints.length > 0) {
              fieldValue += `**Why your group might like this:**\n${mainReasoning}\n`
              bulletPoints.forEach((point: string) => {
                fieldValue += `• ${point}\n`
              })
            } else {
              fieldValue += `**Why your group might like this:**\n${mainReasoning}\n`
            }
            
            fieldValue += `\n📍 ${rec.address || 'Address unavailable'}`
            
            personalEmbed.addFields({
              name: `${medal} ${rec.placeName}`,
              value: fieldValue,
              inline: false,
            })
          }
        })

        if (!hasValidScores) {
          console.log(`[Recommendations] Warning: No personalized scores found for user ${memberId} (${firebaseUserId})`)
        }

        // Create voting buttons for DM
        const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Vote in Group Channel')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/channels/${interaction.guildId}/${interaction.channelId}`)
        )

        await member.send({ embeds: [personalEmbed], components: [voteRow] })
        successCount++
        console.log(`[Recommendations] Successfully sent DM to ${member.username}`)
      } catch (error) {
        console.error(`[Recommendations] Failed to DM member ${memberId}:`, error)
        failCount++
      }
    }

    console.log(`[Recommendations] DM Results: ${successCount} success, ${failCount} failed`)

    // Send group notification in channel
    const groupEmbed = new EmbedBuilder()
      .setColor(successCount > 0 ? 0x10b981 : 0xf59e0b)
      .setTitle(successCount > 0 ? '✅ Recommendations Generated!' : '⚠️ Recommendations Ready')
      .setDescription(
        successCount > 0
          ? `🎉 Personalized recommendations sent to **${successCount}** member${successCount > 1 ? 's' : ''}!\n\n` +
            `Each person received custom scores based on their unique preferences. Time to vote for your favorites!`
          : `Recommendations are ready, but some members couldn't receive DMs.\n\n` +
            `Make sure your DMs are open and use the vote button below!`
      )

    if (failCount > 0) {
      groupEmbed.addFields({
        name: '📬 DM Issues',
        value: `Could not send DMs to ${failCount} member${failCount > 1 ? 's' : ''}. They can still participate using the buttons below!`,
        inline: false
      })
    }

    const voteRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('group_vote')
        .setLabel('Cast Your Vote')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🗳️'),
      new ButtonBuilder()
        .setCustomId('group_view_results')
        .setLabel('View Results')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    )

    await interaction.editReply({ embeds: [groupEmbed], components: [voteRow] })
  } catch (error: any) {
    console.error('Generate recommendations error:', error)
    console.error('Error stack:', error.stack)
    await interaction.editReply('❌ Failed to generate recommendations: ' + error.message)
  }
}

// Button handler for voting
export async function handleVote(interaction: ButtonInteraction) {
    const session = activeSessions.get(interaction.channelId!)
    if (!session || !session.recommendations) {
        return interaction.reply({ content: '❌ No recommendations found', ephemeral: true })
    }

    if (!session.members.has(interaction.user.id)) {
        return interaction.reply({ content: '❌ You are not a member of this group', ephemeral: true })
    }

    // Create select menu for ranked choice voting
    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('group_vote_select_1')
    .setPlaceholder('Select your 1st choice')
    .addOptions(
        session.recommendations.slice(0, 3).map((rec: any, index: number) => ({
            label: rec.placeName,
            value: rec.placeId,
            emoji: ['🥇', '🥈', '🥉'][index],
        }))
    )

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)

    await interaction.reply({
        content: '🗳️ **Ranked Choice Voting**\n\nSelect your top 3 choices in order of preference:',
        components: [row],
        ephemeral: true,
    })
}

// Handle vote selection
export async function handleVoteSelect(interaction: StringSelectMenuInteraction) {
    const session = activeSessions.get(interaction.channelId!)
    if (!session) return

    const placeId = interaction.values[0]
    const currentStep = parseInt(interaction.customId.split('_').pop()!)

    // Initialize user's votes if not exists
    if (!session.votes.has(interaction.user.id)) {
        session.votes.set(interaction.user.id, [])
    }

    const userVotes = session.votes.get(interaction.user.id)!
    userVotes.push(placeId)

    if (currentStep < 3) {
        // Ask for next choice
        const nextStep = currentStep + 1
        const usedPlaces = new Set(userVotes)

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`group_vote_select_${nextStep}`)
            .setPlaceholder(`Select your ${['', '1st', '2nd', '3rd'][nextStep]} choice`)
            .addOptions(
                session.recommendations!
                    .slice(0, 3)
                    .filter((rec: any) => !usedPlaces.has(rec.placeId))
                    .map((rec: any, index: number) => ({
                        label: rec.placeName,
                        value: rec.placeId,
                        description: `Score: ${rec.predictedScore}/10`,
                        emoji: ['🥇', '🥈', '🥉'][index],
                    }))
            )

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)

        await interaction.update({
            content: `✅ Choice ${currentStep} recorded!\n\n🗳️ Now select your ${['', '1st', '2nd', '3rd'][nextStep]} choice:`,
            components: [row],
        })
    } else {
        // Voting complete
        await interaction.update({
            content: '✅ Your votes have been recorded! Thank you for participating.',
            components: [],
        })

        // Check if all members have voted
        if (session.votes.size === session.members.size) {
            await finalizeVoting(interaction.client, interaction.channelId!, session)
        }
    }
}

// Finalize voting and determine winner
// Finalize voting and determine winner
async function finalizeVoting(
  client: Client,
  channelId: string,
  session: GroupSession
) {
  const channel = await client.channels.fetch(channelId) as TextChannel

  // Calculate ranked choice results
  const scores = new Map<string, number>()
  const voteDetails = new Map<string, Array<{userId: string, rank: number}>>()
  
  for (const [userId, rankedPlaces] of session.votes) {
    rankedPlaces.forEach((placeId, index) => {
      const points = [3, 2, 1][index] || 0
      scores.set(placeId, (scores.get(placeId) || 0) + points)
      
      // Track who voted for what
      if (!voteDetails.has(placeId)) {
        voteDetails.set(placeId, [])
      }
      voteDetails.get(placeId)!.push({ userId, rank: index + 1 })
    })
  }

  // Sort by score
  const sortedResults = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([placeId, score]) => {
      const place = session.recommendations!.find((r: any) => r.placeId === placeId)
      const votes = voteDetails.get(placeId) || []
      return { place, score, votes }
    })

  const winner = sortedResults[0]

  // Create detailed results embed
  const resultsEmbed = new EmbedBuilder()
    .setColor(0x10b981)
    .setTitle('🎉 The Votes Are In!')
    .setDescription(
      `After careful deliberation, your group has chosen:\n\n` +
      `# ${winner.place.placeName}\n\n` +
      `**Final Score:** ${winner.score} points\n` +
      `**Address:** ${winner.place.address}\n\n` +
      `**How the voting went:**\n` +
      winner.votes
        .sort((a, b) => a.rank - b.rank)
        .map(v => `${['🥇', '🥈', '🥉'][v.rank - 1]} <@${v.userId}> ranked this #${v.rank}`)
        .join('\n')
    )
    .addFields(
      {
        name: '📊 Full Results',
        value: sortedResults
          .map((r, i) => `${i + 1}. **${r.place.placeName}** - ${r.score} points`)
          .join('\n'),
        inline: false
      }
    )
    .setFooter({ text: 'Have an amazing time! 🎉' })
    .setTimestamp()

  // Get Google Maps link with directions
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    winner.place.address
  )}`

  // Get search link as backup
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    winner.place.placeName + ' ' + winner.place.address
  )}`

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('Get Directions')
      .setStyle(ButtonStyle.Link)
      .setURL(mapsUrl)
      .setEmoji('🧭'),
    new ButtonBuilder()
      .setLabel('View on Maps')
      .setStyle(ButtonStyle.Link)
      .setURL(searchUrl)
      .setEmoji('🗺️'),
    new ButtonBuilder()
      .setCustomId('group_rate_after')
      .setLabel('Rate This Place Later')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⭐')
  )

  await channel.send({ 
    content: `🎊 **Decision Time!** ${Array.from(session.members).map(id => `<@${id}>`).join(' ')}`,
    embeds: [resultsEmbed], 
    components: [actionRow] 
  })

  // Send final details DM to all members
  for (const memberId of session.members) {
    try {
      const member = await client.users.fetch(memberId)
      
      const dmEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🎯 Your Group Has Decided!')
        .setDescription(
          `You're heading to **${winner.place.placeName}**!\n\n` +
          `**Address:** ${winner.place.address}\n\n` +
          `Click the button below to get directions from your location.`
        )
        .setFooter({ text: 'Have fun! Don\'t forget to rate the place afterwards.' })

      const dmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Get Directions')
          .setStyle(ButtonStyle.Link)
          .setURL(mapsUrl)
          .setEmoji('🧭')
      )

      await member.send({ embeds: [dmEmbed], components: [dmRow] })
    } catch (error) {
      console.error(`Could not DM member ${memberId}:`, error)
    }
  }
}

// Button handler for viewing results
export async function handleViewResults(interaction: ButtonInteraction) {
    const session = activeSessions.get(interaction.channelId!)
    if (!session) {
        return interaction.reply({ content: '❌ Session not found', ephemeral: true })
    }

    const totalMembers = session.members.size
    const votedCount = session.votes.size

    const embed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle('📊 Voting Status')
        .setDescription(
            `**Progress:** ${votedCount}/${totalMembers} members have voted\n\n` +
            `**Voted:**\n` +
            Array.from(session.votes.keys())
                .map(id => `✅ <@${id}>`)
                .join('\n') +
            `\n\n**Pending:**\n` +
            Array.from(session.members)
                .filter(id => !session.votes.has(id))
                .map(id => `⏳ <@${id}>`)
                .join('\n')
        )

    await interaction.reply({ embeds: [embed], ephemeral: true })
}

// Button handler for canceling group
export async function handleCancel(interaction: ButtonInteraction) {
    const session = activeSessions.get(interaction.channelId!)
    if (!session) {
        return interaction.reply({ content: '❌ Session not found', ephemeral: true })
    }

    if (interaction.user.id !== session.creatorId) {
        return interaction.reply({ content: '❌ Only the creator can cancel the group', ephemeral: true })
    }

    await interaction.reply('⏰ This channel will be deleted in 10 seconds...')

    setTimeout(async () => {
        const channel = interaction.channel as TextChannel
        activeSessions.delete(interaction.channelId!)
        await channel.delete()
    }, 10000)
}