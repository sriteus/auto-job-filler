/**
 * Zustand store for candidate profile state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CandidateProfile, PersonalInfo, Education, Experience, Skills, Projects, Preferences, ApplicationAnswers } from '@ai-job-agent/shared';

interface ProfileState {
  profile: CandidateProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: CandidateProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePersonal: (personal: Partial<PersonalInfo>) => void;
  updateEducation: (education: Education) => void;
  updateExperience: (experience: Experience) => void;
  updateSkills: (skills: Skills) => void;
  updateProjects: (projects: Projects) => void;
  updatePreferences: (preferences: Preferences) => void;
  updateAnswers: (answers: ApplicationAnswers) => void;
  clearProfile: () => void;
}

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      updatePersonal: (personal) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, personal: { ...state.profile.personal, ...personal } }
            : null,
        })),

      updateEducation: (education) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, education } : null,
        })),

      updateExperience: (experience) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, experience } : null,
        })),

      updateSkills: (skills) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, skills } : null,
        })),

      updateProjects: (projects) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, projects } : null,
        })),

      updatePreferences: (preferences) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, preferences } : null,
        })),

      updateAnswers: (applicationAnswers) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, applicationAnswers } : null,
        })),

      clearProfile: () => set(initialState),
    }),
    {
      name: 'ai-job-agent-profile',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);