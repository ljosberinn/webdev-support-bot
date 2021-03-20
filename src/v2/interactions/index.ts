/* eslint-disable no-void */
import type {
  ApplicationCommand,
  Client,
  Interaction,
  InteractionResponse,
} from 'discord.js';

import { InteractionType } from '../../enums';

export type CommandData = {
  name: string;
  description: string;
  options?: ApplicationCommand['options'];
  handler: (client: Client, interaction: Interaction) => Promise<void> | void;
};

const commands = new Map<string, CommandData>();

export function createHandleInteractionWebhook(client: Client) {
  return function handleInteractionWebhook(interaction: Interaction): void {
    if (
      interaction.type === InteractionType.APPLICATION_COMMAND &&
      interaction.data
    ) {
      const command = commands.get(interaction.data.name.toLowerCase());
      if (command) {
        return void command.handler(client, interaction);
      }
    }
  };
}

export function registerCommand(commandData: CommandData): void {
  commands.set(commandData.name.toLowerCase(), commandData);
}

export function getRegisteredCommands(): Map<string, CommandData> {
  return new Map(commands);
}

export function registerGuildCommand(
  client: Client,
  guild: string,
  commandData: CommandData
): Promise<ApplicationCommand> {
  return createCommand(client, guild, {
    data: {
      description: commandData.description,
      name: commandData.name,
      options: commandData.options,
    },
  });
}

export async function getCommands(
  client: Client,
  guild: string
): Promise<ApplicationCommand[]> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands.get() as Promise<ApplicationCommand[]>;
}

export async function createCommand(
  client: Client,
  guild: string,
  data: PostData<ApplicationCommand>
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands.post(data);
}
export async function editCommand(
  client: Client,
  guild: string,
  commandId: string,
  data: PostData<ApplicationCommand>
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands(commandId)
    .patch(data);
}

export async function deleteCommand(
  client: Client,
  guild: string,
  commandId: string
): Promise<ApplicationCommand> {
  return client.api
    .applications(client.user.id)
    .guilds(guild)
    .commands(commandId)
    .delete();
}

export async function createInteractionResponse(
  client: Client,
  guild: string,
  interaction: Interaction,
  response: PostData<InteractionResponse>
): Promise<unknown> {
  return client.api
    .interactions(interaction.id, interaction.token)
    .callback.post(response);
}
