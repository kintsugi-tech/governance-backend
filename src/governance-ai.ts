import { Proposal } from 'entity/Proposal';
import { cfg } from './constants';
import OpenAI from 'openai';

const summarizeProposalDescription = async (proposal: Proposal): Promise<string> => {
  const openai = new OpenAI({
    apiKey: cfg.OpenAIAPIKey, // This is also the default, can be omitted
  });

  try {
    const response = await openai.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: `Summarize this in 5 bullet points:\n\n${proposal.description}`,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const data = response.choices;
    return '\n' + data[0].text;
  } catch (error) {
    console.error('Error summarizing proposal', error);
    return 'error creating summury of the proposal';
  }
};

export default summarizeProposalDescription;
