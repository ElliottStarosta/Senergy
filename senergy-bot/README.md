# Senergy Discord Bot

Discord bot integration for the Senergy platform that allows users to interact with Senergy features directly from Discord.

## 📋 Overview

The Senergy Discord bot enables users to register, verify their accounts, view profiles, rate places, create groups, and get recommendations all within Discord. It provides a seamless integration between Discord and the Senergy platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Discord Bot Token
- Backend API running (see `senergy-api`)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Discord
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_guild_id (optional, for testing)

# Backend API
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

### Setting Up Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to `.env`
5. Enable the following bot permissions:
   - Send Messages
   - Embed Links
   - Read Message History
   - Use Slash Commands
   - Send Messages in Threads
6. Invite bot to your server with these permissions

### Running the Bot

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── bot.ts           # Main bot logic and event handlers
├── commands/        # Slash command handlers
│   └── group.ts    # Group management commands
├── services/        # Service modules
│   └── api.ts      # API client for backend communication
└── index.ts         # Entry point
```

## 🤖 Commands

### User Commands

- `/register` - Register for Senergy and get verification code
- `/verify [code]` - Link Discord account with verification code
- `/profile` - View your Senergy profile
- `/stats` - View your statistics and ratings count

### Rating Commands

- `/rate [place]` - Rate a place (opens interactive flow)

### Group Commands

- `/group create [location]` - Create a new group
- `/group join [groupId]` - Join an existing group
- `/group leave [groupId]` - Leave a group
- `/group list` - List all your groups
- `/group history` - View group history
- `/group recommend` - Get group recommendations

### Matching Commands

- `/find-squad [distance]` - Find similar users nearby
- `/help` - Show all available commands

## 🔧 Features

### Interactive Commands

Many commands use Discord's interactive components:
- Buttons for quick actions
- Select menus for choices
- Embeds for rich information display
- Ephemeral responses for private interactions

### Direct Messages

The bot can send DMs for:
- Welcome messages
- Group recommendations
- Rating reminders
- Verification codes

### Error Handling

- Graceful error messages
- User-friendly error descriptions
- Logging for debugging

## 🔐 Authentication Flow

1. User runs `/register` in Discord
2. Bot generates verification code
3. User registers on web app with Discord ID
4. User completes quiz on web app
5. User runs `/verify [code]` in Discord
6. Bot links Discord account to Senergy account

## 📡 API Integration

The bot communicates with the backend API via:
- Axios HTTP client
- Centralized API service (`src/services/api.ts`)
- JWT token management
- Error handling and retries

## 🛠️ Development

### Scripts

- `npm run dev` - Start bot with TypeScript (ts-node)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled bot
- `npm run watch` - Watch mode for development

### Key Dependencies

- **discord.js** - Discord API library
- **axios** - HTTP client for API calls
- **dotenv** - Environment variable management
- **TypeScript** - Type safety

## 🐛 Troubleshooting

**Bot not responding:**
- Verify `DISCORD_TOKEN` is correct
- Check bot is online in Discord
- Ensure bot has proper permissions
- Check console for error messages

**Commands not appearing:**
- Commands may take up to 1 hour to sync globally
- Use `DISCORD_GUILD_ID` for instant sync in development
- Restart bot after adding new commands

**API connection errors:**
- Verify `BACKEND_URL` is correct
- Ensure backend API is running
- Check network connectivity

**Verification not working:**
- Ensure user completed registration on web app
- Verify code hasn't expired (24 hours)
- Check code matches exactly

## 📚 Additional Resources

- [Discord Commands Documentation](../docs/DISCORD_COMMANDS.md)
- [API Documentation](../docs/API.md)
- [Discord.js Documentation](https://discord.js.org/)

## 🔒 Security Notes

- Never commit `.env` file
- Keep bot token secure
- Use environment variables for all secrets
- Implement rate limiting for production
