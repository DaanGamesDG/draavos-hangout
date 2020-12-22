import { Message, MessageEmbed } from 'discord.js';
import BaseCommand from '../../utils/structures/BaseCommand';
import DiscordClient from '../../client/client';
import FuzzySearch from 'fuzzy-search';
import ms from 'ms';

const server = 'https://draavo.cf/discord';
const youtube = "https://draavo.cf";


export default class HelpCommand extends BaseCommand {
  constructor() {
    super('help', {
      category: 'General',
      aliases: ['commandslist', "commands"],
      ownerOnly: false,
      channelType: 'both',
      usage: "[command name or alias]",
    });
  }

  async run(client: DiscordClient, message: Message, args: Array<string>) {
  	const prefix = process.env.DISCORD_BOT_PREFIX;

    let embed = new MessageEmbed()
      .setTitle(`${message.guild ? message.guild.name : message.author.username}'s help menu`)
      .setThumbnail(message.guild ? message.guild.iconURL({ dynamic: true, size: 4096 }) : client.user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setColor(message.member ? message.member.displayHexColor : 'BLUE')
    
    embed.addField(`Bot Commands — ( ${client.owners.includes(message.author.id) 
      ? client.cs.size 
      : (client.cs.size - client.cs.filter(c => c.options.ownerOnly).size)} )`, 
      `> ❓ | \`<>\` means this part of the command is needed | \`[]\` means that this part of the command is optional and not needed. \n > 🔗 | Useful Links: [Discord Server](${server}) | [youtube](${youtube})`
    );
    
    if (args[0]) {
      const cmd = client.commands.get(args[0].toLowerCase()); 
      if (!cmd) {
        const result = noResult(client.cs.array(), args[0]);
        return message.channel.send(`> 🔎 | No command was found for your search query. ${result.length ? `Did you mean to search for: ${result.map(c => `\`${c.name}\``).join(', ')}` : ""}`);
      };
      const options = cmd.options;

      const usage = options.usage ? " " + options.usage.split(/\|/g).join(" ") : "";
      const desc = options.description ? options.description.split(/\s+/) : "No description found for this command".split(/\s+/);
      const description = (desc[desc.length - 1].includes(".") || desc[desc.length - 1].includes("?") || desc[desc.length - 1].includes("!"))
      ? desc.join(" ") : desc.join(" ") + ".";

      embed.setDescription([
        `> 🏷 | **Name**: \`${cmd.name}\``,
        `> 📂 | **Category**: \`${options.category}\``,
        `> 📄 | **Aliases**: ${options.aliases.length ? options.aliases.map(alias => `\`${alias}\``).join(' ') : '`—`'}\n`,
        `> ⌚ | **Timeout**: \`${!options.timeout? '—' : ms(options.timeout)}\``,
        `> 📖 | **description**: ${description}`,
        `> 📋 | **usage**: \`${cmd.name}${usage}\`\n`,
        `> ${options.ownerOnly ? '🔒' : '🔓'} | **Owner Only**: \`${options.ownerOnly}\``,
        `> 👮‍♂️ | **User Permissions**: ${options.userPermissions ? client.utils.formatPerms(options.userPermissions) : '`—`'}`,
        `> ❗ | **Client Permissions**: ${options.clientPermissions ? client.utils.formatPerms(options.clientPermissions) : '`—`'}`,
      ]);
      
      return message.channel.send(embed);
    } else {
      let categories: string[];
      if (!client.owners.includes(message.author.id)) categories = removeDuplicates(client.cs.filter(cmd => !cmd.options.ownerOnly).map(cmd => cmd.options.category));
      else categories = removeDuplicates(client.cs.map(cmd => cmd.options.category));

      embed.setDescription(`> 🤖 | The prefix for this server are: \`${prefix}\` & ${client.user.toString()}. You can check the commands list by saying \`${prefix}help [command name / alias]\`.`);
      
      if (!client.owners.includes(message.author.id)) for (const category of categories) embed.addField(
        `${category} — ( ${client.cs.filter(cmd => cmd.options.category === category && !cmd.options.ownerOnly).size} )`, 
        client.cs.filter(cmd => cmd.options.category === category).filter(c => !c.options.ownerOnly).map(cmd => `\`${cmd.name}\``).join(' ')
      );
      else if (client.owners.includes(message.author.id)) for (const category of categories) embed.addField(
        `${category} — ( ${client.cs.filter(cmd => cmd.options.category === category).size} )`, 
        client.cs.filter(cmd => cmd.options.category === category).map(cmd => `\`${cmd.name}\``).join(' ')
      );

      return message.channel.send(embed);
    }
  }
}

function removeDuplicates(arr: Array<string>): Array<string> {
  return [...new Set(arr)];
}

function noResult(commands: Array<BaseCommand>, input: string) {
  const searcher = new FuzzySearch(commands, ['options.aliases', 'name'], {
    caseSensitive: true,
    sort: true,
  });
  return searcher.search(input);
}