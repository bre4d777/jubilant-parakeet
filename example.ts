// TypeScript Implementation
import { 
  Client, 
  GatewayIntentBits, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  User,
  TextChannel,
  GuildMember,
  ApplicationCommandOptionChoiceData
} from 'discord.js';
import { DiscordUtility } from 'discord-giveaway-invite-manager';
import { config } from 'dotenv';

// Load environment variables
config();

// Type definitions
interface GiveawayOptions {
  prize: string;
  duration: number;
  winnerCount: number;
  channelId: string;
  guildId: string;
  hostId: string;
  embedColor: string;
  description?: string;
  requirements?: {
    invites?: number;
    roles?: string[];
    restrictedRoles?: string[];
  };
}

interface GiveawayData {
  _id: string;
  prize: string;
  endTime: Date;
  channelId: string;
  entries: string[];
  winners: string[];
  winnerCount: number;
  guildId: string;
}

interface InviteStats {
  totalInvites: number;
  regular: number;
  bonus: number;
  left: number;
  fake: number;
}

interface LeaderboardUser {
  userId: string;
  totalInvites: number;
}

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize the Discord Utility with MongoDB connection
const utility = new DiscordUtility(client, {
  mongoUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/discord-bot',
  embedColor: '#FF69B4',
  defaultDuration: 86400000 // 24 hours default
});

// Store slash commands
const commands: SlashCommandBuilder[] = [];

// Giveaway command
const giveawayCommand = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Manage giveaways')
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Start a new giveaway')
      .addStringOption(option =>
        option.setName('prize')
          .setDescription('What is being given away')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('winners')
          .setDescription('Number of winners')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20))
      .addStringOption(option =>
        option.setName('duration')
          .setDescription('Duration (e.g., 1d, 12h, 30m)')
          .setRequired(true))
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('Channel to post giveaway')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Additional description')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('min_invites')
          .setDescription('Minimum invites required to enter')
          .setRequired(false)
          .setMinValue(0))
      .addRoleOption(option =>
        option.setName('required_role')
          .setDescription('Role required to enter')
          .setRequired(false))
      .addRoleOption(option =>
        option.setName('restricted_role')
          .setDescription('Role that cannot enter')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('end')
      .setDescription('End a giveaway early')
      .addStringOption(option =>
        option.setName('giveaway_id')
          .setDescription('Giveaway ID to end')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reroll')
      .setDescription('Reroll giveaway winners')
      .addStringOption(option =>
        option.setName('giveaway_id')
          .setDescription('Giveaway ID to reroll')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('new_winner_count')
          .setDescription('New number of winners')
          .setRequired(false)
          .setMinValue(1)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List active giveaways'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit an active giveaway')
      .addStringOption(option =>
        option.setName('giveaway_id')
          .setDescription('Giveaway ID to edit')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('new_prize')
          .setDescription('New prize name')
          .setRequired(false))
      .addIntegerOption(option =>
        option.setName('new_winners')
          .setDescription('New winner count')
          .setRequired(false)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

commands.push(giveawayCommand);

// Invite command
const inviteCommand = new SlashCommandBuilder()
  .setName('invites')
  .setDescription('Manage invites and view statistics')
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('View invite statistics')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to check (defaults to yourself)')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('leaderboard')
      .setDescription('View invite leaderboard')
      .addIntegerOption(option =>
        option.setName('limit')
          .setDescription('Number of users to show')
          .setRequired(false)
          .setMinValue(5)
          .setMaxValue(50)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Add bonus invites to a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to give bonus invites')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('amount')
          .setDescription('Number of bonus invites to add')
          .setRequired(true)
          .setMinValue(1)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove bonus invites from a user')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to remove bonus invites from')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('amount')
          .setDescription('Number of bonus invites to remove')
          .setRequired(true)
          .setMinValue(1)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset')
      .setDescription('Reset a user\'s invite statistics')
      .addUserOption(option =>
        option.setName('user')
          .setDescription('User to reset')
          .setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

commands.push(inviteCommand);

// Utility functions
function parseDuration(durationStr: string): number {
  const regex = /(\d+)([dhm])/g;
  let totalMs = 0;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(durationStr)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'd': totalMs += value * 24 * 60 * 60 * 1000; break;
      case 'h': totalMs += value * 60 * 60 * 1000; break;
      case 'm': totalMs += value * 60 * 1000; break;
    }
  }
  
  return totalMs || 86400000; // Default to 24 hours if parsing fails
}

function formatDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
}

// Bot ready event
client.once('ready', async (): Promise<void> => {
  if (!client.user) return;
  
  console.log(`🤖 ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds with ${client.users.cache.size} users`);
  
  // Register slash commands
  try {
    console.log('🔄 Refreshing application (/) commands...');
    await client.application?.commands.set(commands);
    console.log('✅ Successfully reloaded application (/) commands');
  } catch (error) {
    console.error('❌ Error refreshing commands:', error);
  }
  
  // Check database connection
  if (utility.isConnected()) {
    console.log('✅ Connected to MongoDB');
  } else {
    console.log('❌ Failed to connect to MongoDB');
  }
});

// Slash command handler
client.on('interactionCreate', async (interaction): Promise<void> => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName, options } = interaction;
  
  try {
    if (commandName === 'giveaway') {
      const subcommand = options.getSubcommand();
      
      if (subcommand === 'start') {
        await interaction.deferReply();
        
        const prize = options.getString('prize', true);
        const winners = options.getInteger('winners', true);
        const durationStr = options.getString('duration', true);
        const channel = options.getChannel('channel') || interaction.channel;
        const description = options.getString('description');
        const minInvites = options.getInteger('min_invites');
        const requiredRole = options.getRole('required_role');
        const restrictedRole = options.getRole('restricted_role');
        
        if (!channel || !interaction.guildId) {
          await interaction.editReply('❌ Invalid channel or guild!');
          return;
        }
        
        const duration = parseDuration(durationStr);
        
        const giveawayOptions: GiveawayOptions = {
          prize,
          duration,
          winnerCount: winners,
          channelId: channel.id,
          guildId: interaction.guildId,
          hostId: interaction.user.id,
          embedColor: '#FF69B4'
        };
        
        if (description) giveawayOptions.description = description;
        
        if (minInvites || requiredRole || restrictedRole) {
          giveawayOptions.requirements = {};
          if (minInvites) giveawayOptions.requirements.invites = minInvites;
          if (requiredRole) giveawayOptions.requirements.roles = [requiredRole.id];
          if (restrictedRole) giveawayOptions.requirements.restrictedRoles = [restrictedRole.id];
        }
        
        const giveaway: GiveawayData = await utility.giveaways.start(giveawayOptions);
        
        const embed = new EmbedBuilder()
          .setTitle('🎉 Giveaway Started!')
          .setDescription(`Prize: **${prize}**\nDuration: ${formatDuration(duration)}\nWinners: ${winners}`)
          .addFields([
            { name: 'Giveaway ID', value: giveaway._id, inline: true },
            { name: 'Channel', value: `<#${channel.id}>`, inline: true },
            { name: 'Ends', value: `<t:${Math.floor((Date.now() + duration) / 1000)}:R>`, inline: true }
          ])
          .setColor('#00FF00')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'end') {
        await interaction.deferReply();
        
        const giveawayId = options.getString('giveaway_id', true);
        const giveaway: GiveawayData = await utility.giveaways.end(giveawayId);
        
        const embed = new EmbedBuilder()
          .setTitle('🏁 Giveaway Ended!')
          .setDescription(`**${giveaway.prize}** has been ended early!`)
          .addFields([
            { name: 'Winners', value: giveaway.winners.length.toString(), inline: true },
            { name: 'Total Entries', value: giveaway.entries.length.toString(), inline: true }
          ])
          .setColor('#FFA500')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'reroll') {
        await interaction.deferReply();
        
        const giveawayId = options.getString('giveaway_id', true);
        const newWinnerCount = options.getInteger('new_winner_count');
        
        const giveaway: GiveawayData = await utility.giveaways.reroll(giveawayId, newWinnerCount);
        
        const embed = new EmbedBuilder()
          .setTitle('🔄 Giveaway Rerolled!')
          .setDescription(`**${giveaway.prize}** winners have been rerolled!`)
          .addFields([
            { name: 'New Winners', value: giveaway.winners.length.toString(), inline: true },
            { name: 'Total Entries', value: giveaway.entries.length.toString(), inline: true }
          ])
          .setColor('#9932CC')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'list') {
        await interaction.deferReply();
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        const giveaways: GiveawayData[] = await utility.giveaways.getGuildGiveaways(interaction.guildId, true);
        
        if (giveaways.length === 0) {
          await interaction.editReply('❌ No active giveaways found!');
          return;
        }
        
        const embed = new EmbedBuilder()
          .setTitle('📋 Active Giveaways')
          .setColor('#00BFFF')
          .setTimestamp();
        
        giveaways.slice(0, 10).forEach((giveaway, index) => {
          embed.addFields([{
            name: `${index + 1}. ${giveaway.prize}`,
            value: `**ID:** ${giveaway._id}\n**Channel:** <#${giveaway.channelId}>\n**Ends:** <t:${Math.floor(giveaway.endTime.getTime() / 1000)}:R>\n**Entries:** ${giveaway.entries.length}`,
            inline: true
          }]);
        });
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'edit') {
        await interaction.deferReply();
        
        const giveawayId = options.getString('giveaway_id', true);
        const newPrize = options.getString('new_prize');
        const newWinners = options.getInteger('new_winners');
        
        const editOptions: Partial<GiveawayOptions> = {};
        if (newPrize) editOptions.prize = newPrize;
        if (newWinners) editOptions.winnerCount = newWinners;
        
        const giveaway: GiveawayData = await utility.giveaways.edit(giveawayId, editOptions);
        
        const embed = new EmbedBuilder()
          .setTitle('✏️ Giveaway Edited!')
          .setDescription(`Giveaway **${giveaway.prize}** has been updated!`)
          .setColor('#FFD700')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
      
    } else if (commandName === 'invites') {
      const subcommand = options.getSubcommand();
      
      if (subcommand === 'stats') {
        await interaction.deferReply();
        
        const user = options.getUser('user') || interaction.user;
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        const stats: InviteStats = await utility.invites.getUserStats(user.id, interaction.guildId);
        const rank: number = await utility.invites.getUserRank(user.id, interaction.guildId);
        
        const embed = new EmbedBuilder()
          .setTitle(`📊 Invite Statistics for ${user.displayName}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields([
            { name: '🎯 Total Invites', value: stats.totalInvites.toString(), inline: true },
            { name: '👥 Regular Invites', value: stats.regular.toString(), inline: true },
            { name: '🎁 Bonus Invites', value: stats.bonus.toString(), inline: true },
            { name: '👋 Left Server', value: stats.left.toString(), inline: true },
            { name: '🚫 Fake Invites', value: stats.fake.toString(), inline: true },
            { name: '🏆 Server Rank', value: `#${rank}`, inline: true }
          ])
          .setColor('#4169E1')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'leaderboard') {
        await interaction.deferReply();
        
        const limit = options.getInteger('limit') || 10;
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        const leaderboard: LeaderboardUser[] = await utility.invites.getGuildLeaderboard(interaction.guildId, limit);
        
        if (leaderboard.length === 0) {
          await interaction.editReply('❌ No invite data found!');
          return;
        }
        
        const embed = new EmbedBuilder()
          .setTitle('🏆 Invite Leaderboard')
          .setColor('#FFD700')
          .setTimestamp();
        
        let description = '';
        for (let i = 0; i < leaderboard.length; i++) {
          const user = leaderboard[i];
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          description += `${medal} <@${user.userId}> - **${user.totalInvites}** invites\n`;
        }
        
        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'add') {
        await interaction.deferReply();
        
        const user = options.getUser('user', true);
        const amount = options.getInteger('amount', true);
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        const stats: InviteStats = await utility.invites.addBonusInvites(user.id, interaction.guildId, amount);
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Bonus Invites Added!')
          .setDescription(`Added **${amount}** bonus invites to ${user}`)
          .addFields([
            { name: 'New Total', value: stats.totalInvites.toString(), inline: true },
            { name: 'Bonus Invites', value: stats.bonus.toString(), inline: true }
          ])
          .setColor('#00FF00')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'remove') {
        await interaction.deferReply();
        
        const user = options.getUser('user', true);
        const amount = options.getInteger('amount', true);
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        const stats: InviteStats = await utility.invites.removeBonusInvites(user.id, interaction.guildId, amount);
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Bonus Invites Removed!')
          .setDescription(`Removed **${amount}** bonus invites from ${user}`)
          .addFields([
            { name: 'New Total', value: stats.totalInvites.toString(), inline: true },
            { name: 'Bonus Invites', value: stats.bonus.toString(), inline: true }
          ])
          .setColor('#FFA500')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'reset') {
        await interaction.deferReply();
        
        const user = options.getUser('user', true);
        
        if (!interaction.guildId) {
          await interaction.editReply('❌ Invalid guild!');
          return;
        }
        
        await utility.invites.resetUserInvites(user.id, interaction.guildId);
        
        const embed = new EmbedBuilder()
          .setTitle('🔄 Invites Reset!')
          .setDescription(`Reset all invite statistics for ${user}`)
          .setColor('#FF6347')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    }
  } catch (error: any) {
    console.error('Command error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(error.message || 'An unexpected error occurred')
      .setColor('#FF0000')
      .setTimestamp();
    
    if (interaction.deferred) {
      await interaction.editReply({ embeds: [errorEmbed] });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

// Setup comprehensive event listeners
function setupEventListeners(): void {
  // Giveaway Events
  utility.giveaways.on('giveawayStart', (giveaway: GiveawayData) => {
    console.log(`🎉 Giveaway started: ${giveaway.prize} (ID: ${giveaway._id})`);
  });
  
  utility.giveaways.on('giveawayEnd', (giveaway: GiveawayData, winners: User[]) => {
    console.log(`🏁 Giveaway ended: ${giveaway.prize} with ${winners.length} winners`);
    
    // Send congratulatory DMs to winners
    winners.forEach(async (winner: User) => {
      try {
        await winner.send({
          embeds: [{
            title: '🎉 Congratulations!',
            description: `You won **${giveaway.prize}** in ${client.guilds.cache.get(giveaway.guildId)?.name}!`,
            color: 0xFFD700,
            timestamp: new Date()
          }]
        });
      } catch (error: any) {
        console.log(`Couldn't DM winner ${winner.tag}: ${error.message}`);
      }
    });
  });
  
  utility.giveaways.on('giveawayReroll', (giveaway: GiveawayData, newWinners: User[]) => {
    console.log(`🔄 Giveaway rerolled: ${giveaway.prize} with ${newWinners.length} new winners`);
  });
  
  utility.giveaways.on('giveawayEntry', (giveaway: GiveawayData, user: User) => {
    console.log(`➕ ${user.tag} entered giveaway: ${giveaway.prize}`);
  });
  
  utility.giveaways.on('giveawayEntryRemoved', (giveaway: GiveawayData, user: User) => {
    console.log(`➖ ${user.tag} left giveaway: ${giveaway.prize}`);
  });
  
  // Invite Events
  utility.invites.on('memberJoin', async (member: GuildMember, inviter?: User, invite?: any) => {
    console.log(`👋 ${member.user.tag} joined the server`);
    
    if (inviter && invite) {
      console.log(`Invited by: ${inviter.tag} (Code: ${invite.inviteCode})`);
      
      // Find welcome channel
      const welcomeChannel = member.guild.channels.cache.find(ch => 
        ch.name.includes('welcome') || ch.name.includes('general')
      ) as TextChannel | undefined;
      
      if (welcomeChannel) {
        const stats: InviteStats = await utility.invites.getUserStats(inviter.id, member.guild.id);
        
        const embed = new EmbedBuilder()
          .setTitle('👋 Welcome!')
          .setDescription(`Welcome ${member}! You were invited by ${inviter} who now has **${stats.totalInvites}** total invites!`)
          .setThumbnail(member.user.displayAvatarURL())
          .setColor('#00FF00')
          .setTimestamp();
        
        welcomeChannel.send({ embeds: [embed] }).catch(console.error);
        
        // Milestone rewards
        if ([10, 25, 50, 100].includes(stats.totalInvites)) {
          const bonusAmount = stats.totalInvites >= 100 ? 10 : stats.totalInvites >= 50 ? 5 : 3;
          await utility.invites.addBonusInvites(inviter.id, member.guild.id, bonusAmount);
          
          const milestoneEmbed = new EmbedBuilder()
            .setTitle('🎉 Milestone Reward!')
            .setDescription(`${inviter} reached **${stats.totalInvites}** invites and earned **${bonusAmount}** bonus invites!`)
            .setColor('#FFD700')
            .setTimestamp();
          
          welcomeChannel.send({ embeds: [milestoneEmbed] }).catch(console.error);
        }
      }
    }
  });
  
  utility.invites.on('memberLeave', (member: GuildMember, inviter?: User) => {
    console.log(`👋 ${member.user.tag} left the server`);
    if (inviter) {
      console.log(`Originally invited by: ${inviter.tag}`);
    }
  });
  
  utility.invites.on('inviteCreate', (inviteData: any) => {
    console.log(`📋 New invite created: ${inviteData.inviteCode} by user ${inviteData.userId}`);
  });
  
  utility.invites.on('inviteUpdate', (oldData: any, newData: any) => {
    console.log(`📊 Invite updated: ${newData.inviteCode} (${oldData.uses} → ${newData.uses} uses)`);
  });
}

// Error handling
client.on('error', (error: Error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await utility.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await utility.disconnect();
  process.exit(0);
});

// Initialize everything
setupEventListeners();

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN is not set in environment variables');
  process.exit(1);
}

client.login(token);
