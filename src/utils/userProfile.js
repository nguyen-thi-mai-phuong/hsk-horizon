// src/utils/userProfile.js - User profile persistence
const USER_PROFILE_KEY = 'userProfile';

export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveUserProfile(profile) {
  if (!profile) return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}
