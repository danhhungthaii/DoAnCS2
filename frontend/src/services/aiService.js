import api from './api';

export const sendChatMessage = async (messages) => {
  const response = await api.post('/ai/chat', { messages });
  return response;
};

export const getChatSuggestions = async () => {
  const response = await api.get('/ai/suggestions');
  return response;
};
