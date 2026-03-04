import api from './api';

const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

const updatePreferences = async (preferences) => {
  const response = await api.put('/users/preferences', { preferences });

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    user.preferences = response.data.preferences;
    localStorage.setItem('user', JSON.stringify(user));
    return user; // Returns merged object with token preserved
  }

  return response.data;
};

const getBookmarks = async () => {
  const response = await api.get('/users/bookmarks');
  return response.data;
};

const toggleBookmark = async (articleId) => {
  const response = await api.post('/users/bookmarks', { articleId });
  return response.data;
};

const updateAvatar = async (avatarUrl) => {
  const response = await api.put('/users/avatar', { avatarUrl });

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    user.avatar = response.data.avatar;
    localStorage.setItem('user', JSON.stringify(user));
    return user; // Returns merged object with token preserved
  }

  return response.data;
};

const resetProfile = async () => {
  const response = await api.delete('/users/reset');

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    user.preferences = response.data.preferences;
    user.bookmarkedArticles = response.data.bookmarkedArticles;
    // History is cleared on backend, no need to store locally
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  return response.data;
};

const submitOnboarding = async (categories) => {
  const response = await api.post('/users/onboarding', { categories });

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    user.onboardingCompleted = response.data.onboardingCompleted;
    user.explicitPreferences = response.data.explicitPreferences;
    user.preferences = response.data.preferences;
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
};

const trackInteraction = async (articleId, category, actionType) => {
  const response = await api.post('/users/interactions', { articleId, category, actionType });
  return response.data;
};

const getProfileGrowth = async (days = 7) => {
  const response = await api.get(`/users/profile/growth?days=${days}`);
  return response.data;
};

const getReadingInsights = async () => {
  const response = await api.get('/users/profile/reading-insights');
  return response.data;
};

const userService = {
  getProfile,
  updatePreferences,
  getBookmarks,
  toggleBookmark,
  updateAvatar,
  resetProfile,
  submitOnboarding,
  trackInteraction,
  getProfileGrowth,
  getReadingInsights,
};

export default userService;
