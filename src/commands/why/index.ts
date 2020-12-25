import type {
  ApplicationCommandOptionChoice,
  Client,
  Interaction,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';

import type { CommandData } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { map } from '../../utils/map';
import { jquery } from './handlers/jquery';
import { modules } from './handlers/modules';
import { sass } from './handlers/sass';

export const whyMessages: Map<string, string> = new Map([
  jquery,
  sass,
  modules,
]);
const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

export const createWhyInteractionHandler = (
  client: Client,
  guild: string
): CommandData => ({
  description: 'quick response for common "Why" questions',
  handler: async (interaction: Interaction): Promise<void> => {
    const content = whyMessages.get(interaction.data.options[0].value);
    if (content) {
      // eslint-disable-next-line no-void
      void createInteractionResponse(client, guild, interaction, {
        data: {
          data: {
            content,
          },
          type: 4,
        },
      });
    }
  },
  name: 'why',
  options: [
    {
      choices: [...mapTransformToChoices(whyMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: 3,
    },
  ],
});