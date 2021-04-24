import type { ApplicationCommandOptionChoice, Client } from 'discord.js';

import { ApplicationCommandOptionType } from '../../../enums';
import type { CommandData, Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { flexbox } from './handlers/flexbox';
import { jquery } from './handlers/jquery';
import { lockfile } from './handlers/lockfile';
import { modules } from './handlers/modules';
import { sass } from './handlers/sass';
import { vscode } from './handlers/vscode';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  jquery,
  vscode,
  modules,
  sass,
  flexbox,
  lockfile,
]);

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const aboutInteraction: CommandData = {
  description:
    'Quick response for common "why" or "Tell me about..." questions',
  handler: async (client: Client, interaction: Interaction): Promise<void> => {
    const topic = interaction.data.options[0].value;
    const user = interaction.data.options[1]?.value;
    const content = aboutMessages.get(topic);

    if (content) {
      interaction.reply(
        `${user ? `<@${user}>\n` : ''} ${valueOrCall(content).trim()}`
      );
      return;
    }

    interaction.reply({
      content: `An error occured when trying to call \`/about ${topic}`,
    });
  },
  name: 'about',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
    {
      name: 'tag',
      description: 'Optional Person to Tag',
      type: ApplicationCommandOptionType.USER,
    },
  ],
};

registerCommand(aboutInteraction);
