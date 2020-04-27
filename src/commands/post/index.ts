import questions from './questions';
import { createEmbed, createMarkdownCodeBlock } from '../../utils/discordTools';
import { cache } from '../../spam_filter';
import {
  Message,
  CollectorFilter,
  TextChannel,
  DMChannel,
  NewsChannel,
  Guild,
  GuildChannel,
} from 'discord.js';

const {
  AWAIT_MESSAGE_TIMEOUT,
  MOD_CHANNEL,
  JOB_POSTINGS_CHANNEL,
  MINIMAL_COMPENSATION,
  POST_LIMITER_IN_HOURS,
} = process.env;

type OutputField = {
  name: string;
  value: string;
  inline: boolean;
};

type Metadata = {
  username: string;
  discriminator: string;
  msgID: string;
};

type Channel = TextChannel | NewsChannel | DMChannel;

type Answers = Map<string, string>;

interface TargetChannel extends GuildChannel {
  send?: Function;
}

type CacheEntry = {
  key: string;
  value: Date;
};

enum Days {
  Sunday = 0,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

enum Months {
  January = 0,
  February,
  March,
  April,
  May,
  June,
  July,
  August,
  September,
  October,
  November,
  December,
}

const getCurrentDate = (): string => {
  const date = new Date();
  return `${Days[date.getDay()]}, ${
    Months[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
};

const trimContent = (s: string): string => s.trim();

const capitalize = (s: string): string =>
  `${s[0].toUpperCase()}${s.substring(1, s.length).toLowerCase()}`;

const getTargetChannel = (guild: Guild, name: string): TargetChannel =>
  guild.channels.cache.find(({ name: n }) => n === name);

const getReply = async (channel: Channel, filter: CollectorFilter) => {
  try {
    const res = await channel.awaitMessages(filter, {
      max: 1,
      time: parseInt(AWAIT_MESSAGE_TIMEOUT) * 1000, // Miliseconds
    });
    const content = trimContent(res.first().content);
    return content.toLowerCase() === 'cancel' ? false : content; // Return false if the user explicitly cancels the form
  } catch {
    channel.send('You have timed out. Please try again.');
  }
};

const sendAlert = (
  guild: Guild,
  channel: Channel,
  userInput: string,
  metadata: Metadata
): void => {
  const { username, discriminator, msgID } = metadata;
  const targetChannel: TargetChannel = getTargetChannel(guild, MOD_CHANNEL);
  const user = `@${username}#${discriminator}`;
  const url = `https://discordapp.com/channels/${guild.id}/${channel.id}/${msgID}`;
  targetChannel.send(
    createEmbed({
      url,
      description: `A user tried creating a job post whilst providing invalid compensation.`,
      title: 'Alert!',
      footerText: 'Job Posting Module',
      provider: 'spam',
      fields: [
        {
          name: 'User',
          value: user,
          inline: true,
        },
        {
          name: 'User Input',
          value: createMarkdownCodeBlock(userInput),
          inline: false,
        },
        {
          name: 'Command',
          value: createMarkdownCodeBlock(
            `?ban ${user} Attempting to create a job post with no compensation.`
          ),
          inline: false,
        },
        {
          name: 'Message Link',
          value: url,
          inline: false,
        },
      ],
    })
  );
};

const generateFields = (answers: Answers): Array<OutputField> => {
  let response: Array<OutputField> = [];
  for (let [key, value] of answers) {
    if (key === 'compensation')
      value = value.includes('$') ? value : `${value}$`;
    if (key !== 'remote' && value === 'no') value = 'Not provided.'; // If the value is "no", don't print that field
    response.push({
      name: capitalize(key),
      value: createMarkdownCodeBlock(value),
      inline: false,
    });
  }
  return response;
};

const createJobPost = (
  answers: Answers,
  guild: Guild,
  channelID: string,
  metadata: Metadata
) => {
  const { username, discriminator, msgID } = metadata;
  const targetChannel: TargetChannel = getTargetChannel(
    guild,
    JOB_POSTINGS_CHANNEL
  );
  if (!targetChannel) console.error('Channel does not exist.');
  const user = `@${username}#${discriminator}`;
  targetChannel.send(
    createEmbed({
      url: `https://discordapp.com/channels/${guild.id}/${channelID}/${msgID}`,
      description: `A user has created a new job post!`,
      title: 'New Job Posting!',
      footerText: 'Job Posting Module',
      provider: 'spam', // Using the spam provider because we only need the color/icon, which it provides anyway
      fields: [
        {
          name: 'User',
          value: user,
          inline: true,
        },
        {
          name: 'Created At',
          value: getCurrentDate(),
          inline: true,
        },
        ...generateFields(answers),
      ],
    })
  );
};

const formAndValidateAnswers = async (
  channel: Channel,
  filter: CollectorFilter,
  guild: Guild,
  send: Function,
  metadata: Metadata
): Promise<Answers | false> => {
  const { username, discriminator, msgID } = metadata;
  const answers = new Map();
  // Iterate over questions
  for (const key in questions) {
    // Check if the current question is the location question
    if (key === 'location') {
      // Check if the `isRemote` value has been set to "yes"
      const isRemote = answers.get('remote');
      // If the value is set to "yes", skip this iteration
      if (isRemote === 'yes') continue;
    }
    const q = questions[key];
    // Send out the question
    await send(q.body);
    // Await the input
    const reply = await getReply(channel, filter);
    // If the reply is equal to "cancel", cancel the form
    if (!reply) {
      await send('Explicitly cancelled job post form. Exiting.');
      return false;
    }
    // If there is a validation method appended to the question, use it
    if (!q.validate) {
      answers.set(key, reply);
      continue;
    }
    // If the input is not valid, cancel the form and notify the user.
    const isValid = q.validate(reply);
    // Alert the moderators if the compensation is invalid.
    if (key === 'compensation' && !isValid)
      sendAlert(guild, channel, reply, { username, discriminator, msgID });
    if (!isValid) {
      await send('Invalid input. Cancelling form.');
      return false;
    }
    // Otherwise, store the answer in the output map
    answers.set(key, reply);
  }
  return answers;
};

const generateCacheEntry = (key: string): CacheEntry => ({
  key: `jp-${key}`, // JP stands for Job Posting, for the sake of key differentiation
  value: new Date(),
});

const handleJobPostingRequest = async (msg: Message) => {
  const filter: CollectorFilter = (m) => m.author.id === msg.author.id;
  const send = (str) => msg.author.send(str);
  try {
    const { guild, id: msgID } = msg;
    const { username, discriminator, id } = msg.author;
    // Generate cache entry
    const entry = generateCacheEntry(id);
    // Check if the user has been cached
    const isCached = cache.get(entry.key);
    if (isCached) {
      send(
        'You cannot create a job posting right now. Please try again later.'
      );
      return;
    }
    // Store the post attempt in the cache
    cache.set(
      entry.key,
      entry.value,
      parseFloat(POST_LIMITER_IN_HOURS) * 360 // Convert hours into seconds (H*60*60)
    );
    // Notify the user regarding the rules, and get the channel
    const { channel }: Message = await send(
      'Heads up!\nPosts without financial compensation are not allowed. Also, attempting to create a post with compensation that is lower than ' +
        MINIMAL_COMPENSATION +
        '$ is not allowed.\nTrying to circumvent these rules in any way will result in a ban.\nIf you are not willing to continue, type `cancel`.\nOtherwise, type `ok` or anything else to continue.'
    );
    const { id: channelID } = msg.channel;
    const proceed = await getReply(channel, filter);
    if (!proceed) return send('Canceled.');
    const answers = await formAndValidateAnswers(channel, filter, guild, send, {
      username,
      discriminator,
      msgID,
    });
    if (!answers) return; // Just return if the iteration breaks due to invalid input
    // Notify the user that the form is now complete
    await send('Your job posting has been created!');
    return createJobPost(answers, guild, channelID, {
      username,
      discriminator,
      msgID,
    });
  } catch (error) {
    console.error(error);
  }
};

export default handleJobPostingRequest;