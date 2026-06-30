import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  Partials, 
  Events, 
  REST, 
  Routes, 
  ActivityType, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { storage } from './storage';
import fs from 'fs/promises';
import path from 'path';

const cooldowns = new Map();
let isFileBusy = false; 

export const botClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
  presence: {
    activities: [{ 
      name: "BOT CURRENTLY GETTING UPDATE SOON", 
      type: ActivityType.Streaming,
      url: "https://www.twitch.tv/discord" 
    }],
    status: "online", 
  },
});

export let isBotOnline = false;

async function getAndMarkFileAccount(userTag: string) {
  if (isFileBusy) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  isFileBusy = true;
  try {
    const filePath = path.resolve(process.cwd(), '2010.txt');
    const usedFilePath = path.resolve(process.cwd(), 'used_accounts.txt');
    
    const data = await fs.readFile(filePath, 'utf-8');
    let lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length === 0) return null;

    const originalLine = lines.shift()!; 
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');

    const parts = originalLine.split(':');
    if (parts.length < 2) return null;

    const username = parts[0].trim();
    const password = parts[1].trim().split(/\s+/)[0];

    await fs.appendFile(usedFilePath, `${originalLine} | Taken by: ${userTag}\n`, 'utf-8');

    return { username, password };
  } catch (error: any) {
    console.warn("[bot] 2010.txt error:", error.message);
    return null;
  } finally {
    isFileBusy = false;
  }
}

export async function initBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) return;

  botClient.on('error', (error) => {
    console.error('[bot] Discord client error (non-fatal):', error.message);
  });

  botClient.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    isBotOnline = true;
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: [
          { name: 'gen', description: 'Generate a Roblox account' },
          { name: 'gen2026', description: 'Generate a 2026 Roblox account' },
          { name: 'gen2025', description: 'Generate a 2025 Roblox account' },
          { name: 'gen2010', description: 'Generate a 2010 Roblox account' },
          { 
            name: 'follow', 
            description: 'Follow a Roblox user',
            options: [
              { name: 'user', description: 'Roblox user or id', type: 3, required: true },
              { name: 'amount', description: 'Amount to follow', type: 4, required: true, max_value: 100 }
            ]
          },
        ] }
      );
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error("Failed to register commands:", error);
    }
  });

  botClient.on(Events.InteractionCreate, async interaction => {
    try {
      if (interaction.isChatInputCommand()) {
        if (!interaction.guildId) return;

        const commandName = interaction.commandName;

        if (commandName === 'follow') {
          const target = interaction.options.getString('user', true);
          const amount = interaction.options.getInteger('amount', true);
          
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          let robloxId = target;
          let username = target;
          let fullBodyUrl = '';

          try {
            const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usernames: [target], excludeBannedUsers: false })
            });
            const userData = await userRes.json();

            if (userData.data?.[0]) {
              robloxId = userData.data[0].id;
              username = userData.data[0].name;
            }

            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=720x720&format=Png&isCircular=false`);
            const thumbData = await thumbRes.json();
            if (thumbData.data?.[0]) fullBodyUrl = thumbData.data[0].imageUrl;
          } catch (e) {
            return interaction.editReply({ content: "Error fetching Roblox user data." });
          }

          const confirmEmbed = new EmbedBuilder()
            .setColor(0xA020F0) 
            .setTitle('follow service altgen')
            .setDescription('click buttons below this if you agree or not to start')
            .setImage(fullBodyUrl);

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`f_yes_${robloxId}_${amount}_${username}`).setLabel('Yes Its me').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('f_no').setLabel('cancel').setStyle(ButtonStyle.Danger)
          );

          await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
          return;
        }

        const isGenCommand = ['gen', 'gen2026', 'gen2025', 'gen2010'].includes(commandName);
        
        if (isGenCommand) {
          const userId = interaction.user.id;
          const userTag = interaction.user.tag; 
          const now = Date.now();
          const cooldownAmount = 5 * 60 * 1000;
          const usageLimit = 2;

          if (!cooldowns.has(userId)) cooldowns.set(userId, { count: 0, lastUsed: 0 });
          const userData = cooldowns.get(userId);

          if (userData.count >= usageLimit && now < userData.lastUsed + cooldownAmount) {
            const timeLeft = Math.round((userData.lastUsed + cooldownAmount - now) / 1000);
            return interaction.reply({ 
              content: `Cooldown active. Wait **${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s**.`, 
              flags: MessageFlags.Ephemeral
            });
          }

          await interaction.deferReply();

          let account: any = null;
          let yearLabel = commandName === 'gen' ? "alt" : commandName.replace('gen', ''); 

          if (commandName === 'gen2010') {
            account = await getAndMarkFileAccount(userTag);
          }

          if (!account) {
            let targetYear = parseInt(yearLabel) || 2026;
            account = commandName === 'gen' 
              ? await storage.getUnusedAccount() 
              : await storage.getUnusedAccountByYear(targetYear);
          }
          
          if (!account) {
            const outOfStockEmbed = new EmbedBuilder()
              .setColor(0xED4245)
              .setTitle('Out of Stock')
              .setDescription('no accounts available right now, check back later.');
            await interaction.editReply({ embeds: [outOfStockEmbed] });
            setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
            return;
          }

          userData.count++;
          userData.lastUsed = Date.now();
          cooldowns.set(userId, userData);

          let robloxId: any = null, headshot: any = null, accountAge = "Unknown", createdDate = "Unknown", isBanned = false;

          try {
            const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usernames: [account.username], excludeBannedUsers: false })
            });
            const userDataRes = await userRes.json();
            
            if (userDataRes.data?.[0]) {
              const robloxUser = userDataRes.data[0];
              robloxId = robloxUser.id;
              isBanned = robloxUser.isBanned === true; 

              const detailRes = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
              const detailData = await detailRes.json();
              
              if (detailData.isBanned) isBanned = true;

              if (detailData.created) {
                const created = new Date(detailData.created);
                createdDate = created.toLocaleDateString();
                accountAge = `${Math.ceil(Math.abs(Date.now() - created.getTime()) / 86400000)} days`;
              }
              const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=420x420&format=Png`);
              const thumbData = await thumbRes.json();
              if (thumbData.data?.[0]) headshot = thumbData.data[0].imageUrl;
            }
          } catch (e: any) { console.error("Roblox API Error:", e.message); }

          const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

          const dmEmbed = new EmbedBuilder()
            .setColor(isBanned ? 0xFFFF00 : 0x2ecc71)
            .setTitle(isBanned ? 'Account Generated (Banned)' : 'Account Generated')
            .setDescription(isBanned ? 'this account is currently banned.' : 'here are your account details.')
            .addFields(
              { name: 'Username', value: account.username, inline: false },
              { name: 'Password', value: `||${account.password}||`, inline: false },
              { name: 'Cookie', value: 'N/A', inline: false },
              { name: 'Account Age', value: `${accountAge}`, inline: false },
              { name: 'Created Date', value: `${createdDate}`, inline: false }
            )
            .setFooter({ text: `AltGen Bot | Today at ${timeString}` });

          if (headshot) {
            dmEmbed.setThumbnail(headshot);
          }

          const dmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setLabel('Roblox Login').setURL('https://www.roblox.com/login').setStyle(ButtonStyle.Link),
            new ButtonBuilder().setCustomId(`inventory_${robloxId || 'unknown'}`).setLabel('Inventory').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`copy_combo_${account.username}_${account.password}`).setLabel('Copy Combo').setStyle(ButtonStyle.Primary) 
          );

          try {
            await interaction.user.send({ embeds: [dmEmbed], components: [dmRow] });
            const successEmbed = new EmbedBuilder()
              .setColor(0x57F287)
              .setTitle('Account Generated')
              .setDescription('check your dms for the account details.');

            await interaction.editReply({ 
              embeds: [successEmbed], 
              components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel('View Message').setURL('https://discord.com/channels/@me').setStyle(ButtonStyle.Link)
              )] 
            });
          } catch {
            const failEmbed = new EmbedBuilder()
              .setColor(0x95A5A6)
              .setTitle('Something went wrong')
              .setDescription('make sure your dms are open and try again.');
            await interaction.editReply({ embeds: [failEmbed] });
          }
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('f_yes_')) {
          const parts = interaction.customId.split('_');
          const robloxId = parts[2];
          const amount = parts[3];
          const username = parts.slice(4).join('_'); 
          
          let avatarUrl = '';
          try {
            const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${robloxId}&size=720x720&format=Png&isCircular=false`);
            const thumbData = await thumbRes.json();
            if (thumbData.data?.[0]) avatarUrl = thumbData.data[0].imageUrl;
          } catch (e) {
            console.error("Failed to fetch thumbnail");
          }

          const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

          const finalEmbed = new EmbedBuilder()
            .setColor(0xA020F0) 
            .setTitle('Followers Request Processing')
            .setThumbnail(avatarUrl)
            .addFields(
              { name: 'Username', value: username, inline: true },
              { name: 'Amount', value: amount, inline: true }
            )
            .setFooter({ text: `thanks for using altgen bot! | today at '${timeString}'` });

          const finalRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('Telegram Group')
              .setEmoji('1496627233773719563')
              .setURL('https://t.me/expCommunity') 
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setLabel('Discord Server')
              .setEmoji('1496792051226771538')
              .setURL('https://discord.gg/HVB4rn6Ad5') 
              .setStyle(ButtonStyle.Link)
          );

          await interaction.deferUpdate();
          await interaction.deleteReply().catch(() => {});
          await interaction.channel?.send({ 
            embeds: [finalEmbed], 
            components: [finalRow] 
          });
        }
        
        if (interaction.customId === 'f_no') {
          await interaction.deferUpdate();
          await interaction.deleteReply().catch(() => {});
        }

        if (interaction.customId.startsWith('copy_combo_')) {
          const parts = interaction.customId.split('_');
          await interaction.reply({ content: `\`${parts[2]}:${parts[3]}\``, flags: MessageFlags.Ephemeral });
        }
        if (interaction.customId.startsWith('inventory_')) {
          const userId = interaction.customId.split('_')[1];
          if (userId === 'unknown') return interaction.reply({ content: "No Roblox ID.", flags: MessageFlags.Ephemeral });
          await interaction.reply({ content: `https://www.roblox.com/users/${userId}/inventory`, flags: MessageFlags.Ephemeral });
        }
      }
    } catch (err: any) { console.error('[bot] Interaction Error:', err.message); }
  });

  try {
    await botClient.login(token);
  } catch (e) {
    console.error("Failed to login to Discord:", e);
  }
}
