import { ref } from 'vue';
import { supabase } from '@/supabase/supabase';
import {
  handleError,
  fetchUserDetailsErrorMessages,
} from '@/store/error-handler';

import { UserMetadata } from '@/types/user';

export function useUserProfile() {
  const user = ref<UserMetadata>({
    id: '',
    firstName: '',
    lastName: '',
    username: '',
    avatarURL: '',
    email: '',
    bio: '',
    isAdmin: false,
  });

  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          handleError(
            profileError,
            fetchUserDetailsErrorMessages.fetchUserFailed
          )
        );
      }

      if (!userProfile) {
        throw new Error(fetchUserDetailsErrorMessages.noUserFound);
      }

      user.value = {
        id: userProfile.id,
        firstName: userProfile.firstname,
        lastName: userProfile.lastname,
        username: userProfile.username,
        email: userProfile.email,
        avatarURL: userProfile.avatar_url,
        bio: userProfile.bio,
        isAdmin: userProfile.is_admin,
      };
    } catch (error: any) {
      throw new Error(
        handleError(error, fetchUserDetailsErrorMessages.fetchUserFailed)
      );
    }
  };

  return {
    user,
    fetchUserProfile,
  };
}
