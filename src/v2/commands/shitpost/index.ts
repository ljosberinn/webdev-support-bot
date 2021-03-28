import type {
  ApplicationCommandOptionChoice,
  Client,
  InteractionObject,
} from 'discord.js';

import {
  InteractionResponseType,
  ApplicationCommandOptionType,
} from '../../../enums';
import type { CommandData, Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
import { createInteractionResponse } from '../../interactions';
import { map } from '../../utils/map';
import type { ValueOrNullary } from '../../utils/valueOrCall';
import { valueOrCall } from '../../utils/valueOrCall';
import { flexbox } from '../about/handlers/flexbox';
import { jquery } from '../about/handlers/jquery';
import { lockfile } from '../about/handlers/lockfile';
import { modules } from '../about/handlers/modules';
import { sass } from '../about/handlers/sass';
import { vscode } from '../about/handlers/vscode';
import { code } from '../please/handlers/code';
import { format } from '../please/handlers/format';

const aboutMessages = new Map<string, ValueOrNullary<string>>([
  jquery,
  vscode,
  modules,
  sass,
  format,
  code,
  flexbox,
  lockfile,
]);

const shitpostReplacements = {
  jquery: /jquery/giu,
  vscode: /visual studio code|vscode/giu,
  modules: /module/giu,
  sass: /sass|scss/giu,
  format: /code|sql/giu,
  code: /code/giu,
  flexbox: /flexbox/giu,
  lockfile: /lockfile/giu,
};

const mapTransformToChoices = map(
  (item: string): ApplicationCommandOptionChoice => ({
    name: item,
    value: item,
  })
);

const shitpostInteraction: CommandData = {
  description:
    'Quick response for common "why" or "Tell me about..." questions',
  handler: async (client: Client, interaction: Interaction) => {
    const content = aboutMessages.get(interaction.data.options[0].value);

    if (content) {
      const shitpostContent = valueOrCall(content).replace(
        shitpostReplacements[interaction.data.options[0].value],
        interaction.data.options[1].value
      );
      interaction.reply(shitpostContent);
    }
  },
  name: 'shitpost',
  options: [
    {
      choices: [...mapTransformToChoices(aboutMessages.keys())],
      description: 'The topic to ask about',
      name: 'topic',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
    {
      name: 'replacement',
      description: 'Replacement word to use',
      required: true,
      type: ApplicationCommandOptionType.STRING,
    },
  ],
};

registerCommand(shitpostInteraction);
