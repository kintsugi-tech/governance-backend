import { Proposal } from 'entity/Proposal';
import { cfg } from './constants';
import { Configuration, OpenAIApi } from 'openai';

const summarizeProposalDescription = async (proposal: Proposal): Promise<string> => {
  const configuration = new Configuration({
    apiKey: cfg.OpenAIAPIKey,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `Summarize this in 5 bullet points:\n\n${proposal.description}`,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const data = response.data.choices;
    return '\n' + data[0].text;
  } catch (error) {
    console.error('Error summarizing proposal', error);
    return 'error creating summury of the proposal';
  }
};

export default summarizeProposalDescription;
