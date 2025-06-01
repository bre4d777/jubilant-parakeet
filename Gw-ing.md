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

### 📨 Invite Manager
- Real-time invite tracking
- User statistics and leaderboards
- Bonus invite system
- Member join/leave tracking
- Guild rankings and analytics

### 🔧 Additional Features
- Full TypeScript support
- Event-driven architecture
- MongoDB integration
- Cross-compatible (ESM/CommonJS)
- Production-ready
- Extensive error handling

## Installation

```bash
npm install discord-giveaway-invite-manager
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

client.login('your-bot-token');
```

## API Reference

### DiscordUtility

Main class that initializes both managers.

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

---

## Giveaway Manager

### Methods

#### `start(options: GiveawayOptions): Promise<GiveawayData>`
Creates and starts a new giveaway.

```javascript
const giveaway = await utility.giveaways.start({
  prize: 'Discord Nitro',
  duration: 86400000, // 24 hours in milliseconds
  winnerCount: 1,
  channelId: '123456789012345678',
  guildId: '123456789012345678',
  hostId: '123456789012345678',
  requirements: {
    invites: 5,
    roles: ['123456789012345678'],
    restrictedRoles: ['987654321098765432']
  },
  embedColor: '#FF0000',
  description: 'Enter for a chance to win Discord Nitro!'
});
```

#### `end(giveawayId: string): Promise<GiveawayData>`
Manually ends a giveaway.

```javascript
const endedGiveaway = await utility.giveaways.end('giveaway-id');
```

#### `reroll(giveawayId: string, newWinnerCount?: number): Promise<GiveawayData>`
Rerolls winners for an ended giveaway.

```javascript
const rerolledGiveaway = await utility.giveaways.reroll('giveaway-id', 2);
```

#### `get(giveawayId: string): Promise<GiveawayData | null>`
Retrieves a giveaway by ID.

```javascript
const giveaway = await utility.giveaways.get('giveaway-id');
```

#### `getByMessageId(messageId: string): Promise<GiveawayData | null>`
Retrieves a giveaway by message ID.

```javascript
const giveaway = await utility.giveaways.getByMessageId('message-id');
```

#### `edit(giveawayId: string, options: Partial<GiveawayOptions>): Promise<GiveawayData>`
Edits an active giveaway.

```javascript
const editedGiveaway = await utility.giveaways.edit('giveaway-id', {
  prize: 'Updated Prize',
  winnerCount: 2
});
```

#### `delete(giveawayId: string): Promise<boolean>`
Deletes a giveaway completely.

```javascript
const deleted = await utility.giveaways.delete('giveaway-id');
```

#### `getGuildGiveaways(guildId: string, active?: boolean): Promise<GiveawayData[]>`
Gets all giveaways for a guild.

```javascript
const activeGiveaways = await utility.giveaways.getGuildGiveaways('guild-id', true);
const allGiveaways = await utility.giveaways.getGuildGiveaways('guild-id');
```

### Events

#### `giveawayStart`
Emitted when a giveaway starts.

```javascript
utility.giveaways.on('giveawayStart', (giveaway) => {
  console.log(`Giveaway started: ${giveaway.prize}`);
});
```

#### `giveawayEnd`
Emitted when a giveaway ends.

```javascript
utility.giveaways.on('giveawayEnd', (giveaway, winners) => {
  console.log(`Giveaway ended: ${giveaway.prize}, Winners: ${winners.length}`);
});
```

#### `giveawayReroll`
Emitted when a giveaway is rerolled.

```javascript
utility.giveaways.on('giveawayReroll', (giveaway, newWinners) => {
  console.log(`Giveaway rerolled: ${giveaway.prize}`);
});
```

#### `giveawayEntry`
Emitted when a user enters a giveaway.

```javascript
utility.giveaways.on('giveawayEntry', (giveaway, user) => {
  console.log(`${user.tag} entered giveaway: ${giveaway.prize}`);
});
```

#### `giveawayEntryRemoved`
Emitted when a user leaves a giveaway.

```javascript
utility.giveaways.on('giveawayEntryRemoved', (giveaway, user) => {
  console.log(`${user.tag} left giveaway: ${giveaway.prize}`);
});
```

---

## Invite Manager

### Methods

#### `getUserStats(userId: string, guildId: string): Promise<UserInviteStats>`
Gets invite statistics for a user.

```javascript
const stats = await utility.invites.getUserStats('user-id', 'guild-id');
console.log(`Total invites: ${stats.totalInvites}`);
```

#### `addBonusInvites(userId: string, guildId: string, amount: number): Promise<UserInviteStats>`
Adds bonus invites to a user.

```javascript
const updatedStats = await utility.invites.addBonusInvites('user-id', 'guild-id', 10);
```

#### `removeBonusInvites(userId: string, guildId: string, amount: number): Promise<UserInviteStats>`
Removes bonus invites from a user.

```javascript
const updatedStats = await utility.invites.removeBonusInvites('user-id', 'guild-id', 5);
```

#### `resetUserInvites(userId: string, guildId: string): Promise<UserInviteStats>`
Resets all invite stats for a user.

```javascript
const resetStats = await utility.invites.resetUserInvites('user-id', 'guild-id');
```

#### `getGuildLeaderboard(guildId: string, limit?: number): Promise<UserInviteStats[]>`
Gets the invite leaderboard for a guild.

```javascript
const leaderboard = await utility.invites.getGuildLeaderboard('guild-id', 10);
```

#### `getUserRank(userId: string, guildId: string): Promise<number>`
Gets a user's rank in the guild invite leaderboard.

```javascript
const rank = await utility.invites.getUserRank('user-id', 'guild-id');
```

### Events

#### `inviteCreate`
Emitted when an invite is created.

```javascript
utility.invites.on('inviteCreate', (inviteData) => {
  console.log(`Invite created: ${inviteData.inviteCode}`);
});
```

#### `memberJoin`
Emitted when a member joins via an invite.

```javascript
utility.invites.on('memberJoin', (member, inviter, invite) => {
  if (inviter) {
    console.log(`${member.user.tag} joined via ${inviter.tag}'s invite`);
  }
});
```

#### `memberLeave`
Emitted when a member leaves the server.

```javascript
utility.invites.on('memberLeave', (member, inviter) => {
  console.log(`${member.user.tag} left the server`);
});
```

---

## Type Definitions

### GiveawayOptions
```typescript
interface GiveawayOptions {
  prize: string;
  duration: number;
  winnerCount: number;
  channelId: string;
  guildId: string;
  hostId: string;
  requirements?: {
    invites?: number;
    roles?: string[];
    restrictedRoles?: string[];
  };
  embedColor?: string;
  description?: string;
}
```

### GiveawayData
```typescript
interface GiveawayData extends GiveawayOptions {
  _id?: string;
  messageId?: string;
  endTime: Date;
  entries: string[];
  ended: boolean;
  winners: string[];
  createdAt: Date;
}
```

### UserInviteStats
```typescript
interface UserInviteStats {
  userId: string;
  guildId: string;
  totalInvites: number;
  left: number;
  fake: number;
  regular: number;
  bonus: number;
}
```

### ManagerOptions
```typescript
interface ManagerOptions {
  mongoUrl: string;
  embedColor?: string;
  defaultDuration?: number;
}
```

---

## Examples

### Basic Giveaway
```javascript
// Start a simple giveaway
const giveaway = await utility.giveaways.start({
  prize: 'Discord Nitro',
  duration: 86400000, // 24 hours
  winnerCount: 1,
  channelId: 'channel-id',
  guildId: 'guild-id',
  hostId: 'host-user-id'
});
```

### Advanced Giveaway with Requirements
```javascript
// Start a giveaway with requirements
const advancedGiveaway = await utility.giveaways.start({
  prize: 'Premium Discord Bot',
  duration: 604800000, // 7 days
  winnerCount: 3,
  channelId: 'channel-id',
  guildId: 'guild-id',
  hostId: 'host-user-id',
  requirements: {
    invites: 10, // Requires 10+ invites
    roles: ['member-role-id'], // Must have member role
    restrictedRoles: ['banned-role-id'] // Cannot have banned role
  },
  embedColor: '#00FF00',
  description: 'Win an awesome premium Discord bot for your server!'
});
```

### Invite Tracking
```javascript
// Get user's invite stats
const stats = await utility.invites.getUserStats('user-id', 'guild-id');
console.log(`User has ${stats.totalInvites} total invites`);

// Add bonus invites
await utility.invites.addBonusInvites('user-id', 'guild-id', 5);

// Get leaderboard
const leaderboard = await utility.invites.getGuildLeaderboard('guild-id', 10);
leaderboard.forEach((user, index) => {
  console.log(`#${index + 1}: ${user.totalInvites} invites`);
});
```

### Event Handling
```javascript
// Listen to giveaway events
utility.giveaways.on('giveawayStart', (giveaway) => {
  console.log(`🎉 New giveaway started: ${giveaway.prize}`);
});

utility.giveaways.on('giveawayEnd', (giveaway, winners) => {
  console.log(`✅ Giveaway ended: ${giveaway.prize}`);
  winners.forEach(winner => {
    console.log(`🏆 Winner: ${winner.tag}`);
  });
});

// Listen to invite events
utility.invites.on('memberJoin', (member, inviter, invite) => {
  if (inviter) {
    console.log(`👋 ${member.user.tag} joined via ${inviter.tag}'s invite!`);
  }
});
```

## Requirements

- Node.js 16+
- Discord.js v14+
- MongoDB 4+

## Dependencies

- `discord.js` (peer dependency)
- `mongoose` for MongoDB integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For support, join our Discord server or create an issue on GitHub.

---

**Note**: This package handles all interactions internally. You don't need to manually handle button interactions for giveaways - the package manages everything automatically!
