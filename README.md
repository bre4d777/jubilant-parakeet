# Discord Giveaway & Invite Manager

A complete, type-safe Discord utility package for managing giveaways and invite tracking with MongoDB integration. Built with TypeScript and supports both ESM and CommonJS.

## Features

### 🎉 Giveaway Manager
- Create, edit, end, and reroll giveaways
- Interactive button-based entries
- Advanced requirements (invites, roles, restricted roles)
- Automatic scheduling and management
- Event-driven architecture
- Full CRUD operations
- Cross-guild support
- Persistent storage with MongoDB

### 📨 Invite Manager
- Real-time invite tracking
- User statistics and leaderboards
- Bonus invite system
- Member join/leave tracking
- Guild rankings and analytics
- Fake invite detection
- Cross-guild invite management

### 🔧 Additional Features
- Full TypeScript support
- Event-driven architecture
- MongoDB integration with Mongoose
- Cross-compatible (ESM/CommonJS)
- Production-ready with error handling
- Automatic reconnection handling
- Memory-efficient caching system

## Installation

```bash
npm install discord-giveaway-invite-manager discord.js mongoose
```

## Required Dependencies

- `discord.js` ^14.0.0 (peer dependency)
- `mongoose` ^8.0.0

## Bot Permissions Required

Your bot needs the following permissions:
- `SEND_MESSAGES`
- `EMBED_LINKS`
- `USE_EXTERNAL_EMOJIS`
- `ADD_REACTIONS`
- `MANAGE_MESSAGES`
- `READ_MESSAGE_HISTORY`
- `MANAGE_GUILD` (for invite tracking)

## Required Intents

```javascript
import { GatewayIntentBits } from 'discord.js';

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.MessageContent // If you need message content
];
```

## Quick Start

```javascript
import { Client, GatewayIntentBits } from 'discord.js';
import { DiscordUtility } from 'discord-giveaway-invite-manager';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers
  ]
});

const utility = new DiscordUtility(client, {
  mongoUrl: 'mongodb://localhost:27017/discord-bot',
  embedColor: '#FF69B4',
  defaultDuration: 86400000 // 24 hours
});

// Wait for bot to be ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login('your-bot-token');
```

## API Reference

### DiscordUtility

Main class that initializes both managers and handles MongoDB connection.

#### Constructor
```typescript
new DiscordUtility(client: Client, options: ManagerOptions)
```

#### Properties
- `giveaways: GiveawayManager` - Giveaway management instance
- `invites: InviteManager` - Invite management instance

#### Methods
- `disconnect(): Promise<void>` - Disconnect from MongoDB
- `isConnected(): boolean` - Check MongoDB connection status

#### Example
```javascript
const utility = new DiscordUtility(client, {
  mongoUrl: 'mongodb://localhost:27017/discord-bot',
  embedColor: '#FF69B4', // Default embed color
  defaultDuration: 86400000 // Default giveaway duration (24 hours)
});

// Check connection status
if (utility.isConnected()) {
  console.log('Connected to MongoDB');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await utility.disconnect();
  process.exit(0);
});
```

---

## Giveaway Manager

### Methods

#### `start(options: GiveawayOptions): Promise<GiveawayData>`
Creates and starts a new giveaway with automatic button handling.

**Parameters:**
- `options: GiveawayOptions` - Giveaway configuration

**Returns:** `Promise<GiveawayData>` - Created giveaway data

```javascript
const giveaway = await utility.giveaways.start({
  prize: 'Discord Nitro',
  duration: 86400000, // 24 hours in milliseconds
  winnerCount: 1,
  channelId: '123456789012345678',
  guildId: '123456789012345678',
  hostId: '123456789012345678',
  requirements: {
    invites: 5, // Minimum invites required
    roles: ['123456789012345678'], // Required roles
    restrictedRoles: ['987654321098765432'] // Roles that can't enter
  },
  embedColor: '#FF0000',
  description: 'Enter for a chance to win Discord Nitro!'
});

console.log(`Giveaway created with ID: ${giveaway._id}`);
```

#### `end(giveawayId: string): Promise<GiveawayData>`
Manually ends an active giveaway and picks winners.

```javascript
try {
  const endedGiveaway = await utility.giveaways.end('giveaway-id');
  console.log(`Giveaway ended with ${endedGiveaway.winners.length} winners`);
} catch (error) {
  console.error('Failed to end giveaway:', error.message);
}
```

#### `reroll(giveawayId: string, newWinnerCount?: number): Promise<GiveawayData>`
Rerolls winners for an ended giveaway.

**Parameters:**
- `giveawayId: string` - The giveaway ID
- `newWinnerCount?: number` - Optional new winner count (defaults to original)

```javascript
// Reroll with same winner count
const rerolled = await utility.giveaways.reroll('giveaway-id');

// Reroll with different winner count
const rerolledMore = await utility.giveaways.reroll('giveaway-id', 3);
```

#### `get(giveawayId: string): Promise<GiveawayData | null>`
Retrieves a giveaway by its database ID.

```javascript
const giveaway = await utility.giveaways.get('giveaway-id');
if (giveaway) {
  console.log(`Prize: ${giveaway.prize}, Entries: ${giveaway.entries.length}`);
}
```

#### `getByMessageId(messageId: string): Promise<GiveawayData | null>`
Retrieves a giveaway by its Discord message ID.

```javascript
const giveaway = await utility.giveaways.getByMessageId('message-id');
if (giveaway) {
  console.log(`Found giveaway in message: ${giveaway.prize}`);
}
```

#### `edit(giveawayId: string, options: Partial<GiveawayOptions>): Promise<GiveawayData>`
Edits an active giveaway and updates the Discord message.

**Note:** Cannot edit ended giveaways.

```javascript
const editedGiveaway = await utility.giveaways.edit('giveaway-id', {
  prize: 'Updated Prize Name',
  winnerCount: 2,
  description: 'Updated description!',
  duration: 172800000 // Extend to 48 hours
});
```

#### `delete(giveawayId: string): Promise<boolean>`
Completely removes a giveaway from database and Discord.

```javascript
const deleted = await utility.giveaways.delete('giveaway-id');
if (deleted) {
  console.log('Giveaway successfully deleted');
}
```

#### `getGuildGiveaways(guildId: string, active?: boolean): Promise<GiveawayData[]>`
Gets all giveaways for a specific guild.

**Parameters:**
- `guildId: string` - Guild ID
- `active?: boolean` - Filter by active status (optional)

```javascript
// Get all active giveaways
const activeGiveaways = await utility.giveaways.getGuildGiveaways('guild-id', true);

// Get all ended giveaways
const endedGiveaways = await utility.giveaways.getGuildGiveaways('guild-id', false);

// Get all giveaways
const allGiveaways = await utility.giveaways.getGuildGiveaways('guild-id');
```

### Events

The GiveawayManager extends EventEmitter and provides the following events:

#### `giveawayStart`
Emitted when a new giveaway is created and started.

```javascript
utility.giveaways.on('giveawayStart', (giveaway) => {
  console.log(`🎉 New giveaway started: ${giveaway.prize}`);
  console.log(`Duration: ${giveaway.duration}ms`);
  console.log(`Winners: ${giveaway.winnerCount}`);
});
```

#### `giveawayEnd`
Emitted when a giveaway ends (automatically or manually).

```javascript
utility.giveaways.on('giveawayEnd', (giveaway, winners) => {
  console.log(`✅ Giveaway ended: ${giveaway.prize}`);
  console.log(`Total entries: ${giveaway.entries.length}`);
  console.log(`Winners (${winners.length}):`);
  winners.forEach((winner, index) => {
    console.log(`${index + 1}. ${winner.tag} (${winner.id})`);
  });
});
```

#### `giveawayReroll`
Emitted when giveaway winners are rerolled.

```javascript
utility.giveaways.on('giveawayReroll', (giveaway, newWinners) => {
  console.log(`🔄 Giveaway rerolled: ${giveaway.prize}`);
  console.log(`New winners: ${newWinners.map(w => w.tag).join(', ')}`);
});
```

#### `giveawayEntry`
Emitted when a user successfully enters a giveaway.

```javascript
utility.giveaways.on('giveawayEntry', (giveaway, user) => {
  console.log(`➕ ${user.tag} entered giveaway: ${giveaway.prize}`);
  console.log(`Total entries: ${giveaway.entries.length}`);
});
```

#### `giveawayEntryRemoved`
Emitted when a user leaves a giveaway.

```javascript
utility.giveaways.on('giveawayEntryRemoved', (giveaway, user) => {
  console.log(`➖ ${user.tag} left giveaway: ${giveaway.prize}`);
  console.log(`Remaining entries: ${giveaway.entries.length}`);
});
```

---

## Invite Manager

### Methods

#### `getUserStats(userId: string, guildId: string): Promise<UserInviteStats>`
Gets comprehensive invite statistics for a user in a specific guild.

```javascript
const stats = await utility.invites.getUserStats('user-id', 'guild-id');
console.log(`User Statistics:
- Total Invites: ${stats.totalInvites}
- Regular Invites: ${stats.regular}
- Bonus Invites: ${stats.bonus}
- Left Server: ${stats.left}
- Fake Invites: ${stats.fake}`);
```

#### `addBonusInvites(userId: string, guildId: string, amount: number): Promise<UserInviteStats>`
Adds bonus invites to a user (useful for rewards, events, etc.).

```javascript
// Add 10 bonus invites
const updatedStats = await utility.invites.addBonusInvites('user-id', 'guild-id', 10);
console.log(`Added 10 bonus invites. New total: ${updatedStats.totalInvites}`);
```

#### `removeBonusInvites(userId: string, guildId: string, amount: number): Promise<UserInviteStats>`
Removes bonus invites from a user (cannot go below 0).

```javascript
// Remove 5 bonus invites
const updatedStats = await utility.invites.removeBonusInvites('user-id', 'guild-id', 5);
console.log(`Removed bonus invites. New total: ${updatedStats.totalInvites}`);
```

#### `resetUserInvites(userId: string, guildId: string): Promise<UserInviteStats>`
Completely resets all invite statistics for a user.

```javascript
const resetStats = await utility.invites.resetUserInvites('user-id', 'guild-id');
console.log('User invite stats have been reset to zero');
```

#### `getGuildLeaderboard(guildId: string, limit?: number): Promise<UserInviteStats[]>`
Gets the top inviters for a guild, sorted by total invites.

**Parameters:**
- `guildId: string` - Guild ID
- `limit?: number` - Maximum number of results (default: 10)

```javascript
// Get top 10 inviters
const leaderboard = await utility.invites.getGuildLeaderboard('guild-id', 10);

console.log('🏆 Invite Leaderboard:');
leaderboard.forEach((user, index) => {
  console.log(`${index + 1}. <@${user.userId}> - ${user.totalInvites} invites`);
});
```

#### `getUserRank(userId: string, guildId: string): Promise<number>`
Gets a user's position in the guild invite leaderboard.

```javascript
const rank = await utility.invites.getUserRank('user-id', 'guild-id');
console.log(`User is ranked #${rank} in the server`);
```

### Events

#### `inviteCreate`
Emitted when a new invite is created and tracked.

```javascript
utility.invites.on('inviteCreate', (inviteData) => {
  console.log(`📋 New invite created: ${inviteData.inviteCode}`);
  console.log(`Created by: ${inviteData.userId}`);
});
```

#### `inviteUpdate`
Emitted when an invite's usage count is updated.

```javascript
utility.invites.on('inviteUpdate', (oldData, newData) => {
  console.log(`📊 Invite updated: ${newData.inviteCode}`);
  console.log(`Uses: ${oldData.uses} → ${newData.uses}`);
});
```

#### `memberJoin`
Emitted when a member joins via a tracked invite.

```javascript
utility.invites.on('memberJoin', (member, inviter, invite) => {
  if (inviter && invite) {
    console.log(`👋 ${member.user.tag} joined via ${inviter.tag}'s invite (${invite.inviteCode})`);
  } else {
    console.log(`👋 ${member.user.tag} joined but couldn't determine inviter`);
  }
});
```

#### `memberLeave`
Emitted when a member leaves the server.

```javascript
utility.invites.on('memberLeave', (member, inviter) => {
  console.log(`👋 ${member.user.tag} left the server`);
  if (inviter) {
    console.log(`Originally invited by: ${inviter.tag}`);
  }
});
```

---

## Type Definitions

### ManagerOptions
Configuration options for the DiscordUtility instance.

```typescript
interface ManagerOptions {
  mongoUrl: string;           // MongoDB connection string
  embedColor?: string;        // Default embed color (hex)
  defaultDuration?: number;   // Default giveaway duration (ms)
}
```

### GiveawayOptions
Configuration for creating a new giveaway.

```typescript
interface GiveawayOptions {
  prize: string;              // What the winner receives
  duration: number;           // Duration in milliseconds
  winnerCount: number;        // Number of winners to pick
  channelId: string;          // Channel to post giveaway
  guildId: string;            // Guild ID
  hostId: string;             // User who created the giveaway
  requirements?: {            // Optional entry requirements
    invites?: number;         // Minimum invites needed
    roles?: string[];         // Required role IDs
    restrictedRoles?: string[]; // Roles that cannot enter
  };
  embedColor?: string;        // Custom embed color
  description?: string;       // Additional description
}
```

### GiveawayData
Complete giveaway data as stored in database.

```typescript
interface GiveawayData extends GiveawayOptions {
  _id?: string;              // Database ID
  messageId?: string;        // Discord message ID
  endTime: Date;             // When giveaway ends
  entries: string[];         // User IDs who entered
  ended: boolean;            // Whether giveaway has ended
  winners: string[];         // Winner user IDs
  createdAt: Date;           // Creation timestamp
}
```

### UserInviteStats
User's invite statistics for a guild.

```typescript
interface UserInviteStats {
  userId: string;            // Discord user ID
  guildId: string;           // Discord guild ID
  totalInvites: number;      // Total invite count
  left: number;              // People who left after joining via invite
  fake: number;              // Detected fake invites
  regular: number;           // Regular invites (people who joined)
  bonus: number;             // Manually added bonus invites
}
```

### InviteData
Individual invite tracking data.

```typescript
interface InviteData {
  guildId: string;           // Guild where invite was created
  userId: string;            // User who created the invite
  inviteCode: string;        // Discord invite code
  uses: number;              // Current usage count
  totalInvites: number;      // Total successful invites
  left: number;              // How many people left
  fake: number;              // Fake invites detected
  createdAt: Date;           // When invite was created
  updatedAt: Date;           // Last update timestamp
}
```

---

## Advanced Examples

### Comprehensive Giveaway System
```javascript
// Create a giveaway with all features
async function createAdvancedGiveaway() {
  try {
    const giveaway = await utility.giveaways.start({
      prize: '🎮 Gaming Setup Worth $2000',
      duration: 604800000, // 7 days
      winnerCount: 3,
      channelId: 'your-channel-id',
      guildId: 'your-guild-id',
      hostId: 'host-user-id',
      requirements: {
        invites: 15,
        roles: ['member-role-id', 'active-role-id'],
        restrictedRoles: ['muted-role-id', 'banned-role-id']
      },
      embedColor: '#00FF00',
      description: `🎉 **MEGA GIVEAWAY** 🎉
      
Win an amazing gaming setup including:
• High-end Gaming PC
• Mechanical Keyboard
• Gaming Mouse & Mousepad
• Premium Headset

**Requirements:**
• 15+ invites to the server
• Be an active member
• No restricted roles

Good luck everyone! 🍀`
    });

    console.log(`Advanced giveaway created: ${giveaway._id}`);
    return giveaway;
  } catch (error) {
    console.error('Failed to create giveaway:', error);
  }
}
```

### Complete Invite Tracking System
```javascript
// Set up comprehensive invite tracking
function setupInviteTracking() {
  // Track member joins
  utility.invites.on('memberJoin', async (member, inviter, invite) => {
    const welcomeChannel = member.guild.channels.cache.get('welcome-channel-id');
    
    if (inviter && invite && welcomeChannel) {
      // Update inviter stats
      const stats = await utility.invites.getUserStats(inviter.id, member.guild.id);
      
      // Send welcome message
      welcomeChannel.send({
        embeds: [{
          title: '👋 Welcome to the server!',
          description: `Welcome ${member}! You were invited by ${inviter} who now has **${stats.totalInvites}** total invites!`,
          color: 0x00FF00,
          timestamp: new Date()
        }]
      });

      // Give rewards for invite milestones
      if (stats.totalInvites === 10) {
        await utility.invites.addBonusInvites(inviter.id, member.guild.id, 5);
        // Give special role or other rewards
      }
    }
  });

  // Track member leaves
  utility.invites.on('memberLeave', async (member, inviter) => {
    const logChannel = member.guild.channels.cache.get('log-channel-id');
    
    if (logChannel) {
      logChannel.send({
        embeds: [{
          title: '👋 Member Left',
          description: `${member.user.tag} left the server`,
          color: 0xFF0000,
          timestamp: new Date()
        }]
      });
    }
  });
}
```

### Event-Driven Giveaway Management
```javascript
// Set up comprehensive giveaway event handling
function setupGiveawayEvents() {
  utility.giveaways.on('giveawayStart', (giveaway) => {
    // Log to admin channel
    const logChannel = client.channels.cache.get('admin-log-channel');
    if (logChannel) {
      logChannel.send({
        embeds: [{
          title: '🎉 New Giveaway Started',
          fields: [
            { name: 'Prize', value: giveaway.prize, inline: true },
            { name: 'Duration', value: `${giveaway.duration / 3600000} hours`, inline: true },
            { name: 'Winners', value: giveaway.winnerCount.toString(), inline: true },
            { name: 'Channel', value: `<#${giveaway.channelId}>`, inline: true },
            { name: 'Host', value: `<@${giveaway.hostId}>`, inline: true },
            { name: 'ID', value: giveaway._id, inline: true }
          ],
          color: 0x00FF00,
          timestamp: new Date()
        }]
      });
    }
  });

  utility.giveaways.on('giveawayEnd', async (giveaway, winners) => {
    // Send congratulations to winners
    if (winners.length > 0) {
      winners.forEach(async (winner) => {
        try {
          await winner.send({
            embeds: [{
              title: '🎉 Congratulations!',
              description: `You won **${giveaway.prize}** in ${client.guilds.cache.get(giveaway.guildId)?.name}!`,
              color: 0xFFD700,
              timestamp: new Date()
            }]
          });
        } catch (error) {
          console.log(`Couldn't DM winner ${winner.tag}`);
        }
      });
    }

    // Update database or external systems
    console.log(`Giveaway ${giveaway._id} ended with ${winners.length} winners`);
  });

  utility.giveaways.on('giveawayEntry', (giveaway, user) => {
    // Could implement anti-spam or analytics here
    console.log(`Entry logged: ${user.tag} -> ${giveaway.prize}`);
  });
}
```

---

## Database Schema

The package automatically creates the following MongoDB collections:

### Giveaways Collection
```javascript
{
  _id: ObjectId,
  prize: String,
  duration: Number,
  winnerCount: Number,
  channelId: String,
  guildId: String,
  hostId: String,
  messageId: String,
  endTime: Date,
  entries: [String],
  ended: Boolean,
  winners: [String],
  requirements: {
    invites: Number,
    roles: [String],
    restrictedRoles: [String]
  },
  embedColor: String,
  description: String,
  createdAt: Date
}
```

### Invites Collection
```javascript
{
  _id: ObjectId,
  guildId: String,
  userId: String,
  inviteCode: String,
  uses: Number,
  totalInvites: Number,
  left: Number,
  fake: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### UserInviteStats Collection
```javascript
{
  _id: ObjectId,
  userId: String,
  guildId: String,
  totalInvites: Number,
  left: Number,
  fake: Number,
  regular: Number,
  bonus: Number
}
```

---

## Error Handling

The package includes comprehensive error handling:

```javascript
// Giveaway errors
try {
  await utility.giveaways.start(options);
} catch (error) {
  switch (error.message) {
    case 'Channel not found':
      console.log('Invalid channel ID provided');
      break;
    case 'Giveaway not found':
      console.log('Giveaway ID does not exist');
      break;
    case 'Giveaway already ended':
      console.log('Cannot modify ended giveaway');
      break;
    case 'Cannot edit ended giveaway':
      console.log('Giveaway has already finished');
      break;
    default:
      console.error('Unexpected error:', error);
  }
}

// Database connection errors
utility.on('error', (error) => {
  console.error('Database error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await utility.disconnect();
  process.exit(0);
});
```

---

## Performance Considerations

### Memory Usage
- Invite cache is automatically managed and cleaned
- Giveaway timers are efficiently handled with native setTimeout
- Database queries are optimized with proper indexing

### Database Optimization
```javascript
// The package automatically creates these indexes:
// - { guildId: 1, userId: 1 } on invites
// - { guildId: 1, userId: 1 } (unique) on user stats
// - { messageId: 1 } on giveaways
// - { guildId: 1, ended: 1 } on giveaways
```

### Rate Limiting
The package respects Discord's rate limits by:
- Using efficient bulk operations where possible
- Caching frequently accessed data
- Batching database operations

---


---

## Troubleshooting

### Common Issues

#### Bot not responding to button clicks
- Ensure you have the correct intents enabled
- Verify the bot has permission to read message history
- Check that the bot can send messages in the channel

#### Invite tracking not working
- Bot needs `MANAGE_GUILD` permission
- Ensure `GuildInvites` and `GuildMembers` intents are enabled
- Check that the bot was online when invites were created

#### MongoDB connection issues
- Verify your connection string is correct
- Ensure MongoDB is running and accessible
- Check firewall settings if using remote database

#### Giveaways not ending automatically
- Verify the bot stays online
- Check system clock is accurate
- Ensure sufficient memory for timer storage

### Debug Mode
Enable debug logging:

```javascript
const utility = new DiscordUtility(client, {
  mongoUrl: 'your-connection-string',
  debug: true // Enable debug logging
});
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Update documentation if needed
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request




---


---

**Note**: This package handles all Discord interactions internally. You don't need to manually handle button interactions for giveaways - the package manages everything automatically including entry validation, winner selection, and message updates!
