import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const fetchChats = async () => {
  const res = await axios.get(`${API_URL}/chats`);
  return res.data;
};

export const createNewChat = async () => {
  const res = await axios.post(`${API_URL}/chats`);
  return res.data;
};

export const sendMessage = async (chatId, message) => {
  const res = await axios.post(`${API_URL}/chats/${chatId}/messages`, { message });
  return res.data;
};
