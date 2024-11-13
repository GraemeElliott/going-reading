import { ref } from 'vue';
import { supabase } from '@/supabase/supabase';
import { UserMetadata, UserPartialData } from '@/types/user';
import { checkIfEmailExists, checkIfUsernameExists } from '@/store/auth-utils';

import {
  handleError,
  handleSupabaseError,
  updateUserDetailsErrorMessages,
} from '@/store/error-handler';
import { Ref } from 'vue';

export function useProfileUpdate(userMetadata: Ref<UserMetadata>) {
  const errorMessage = ref<string>('');
  const user = ref<UserPartialData | null>(null);

  const updateAccountDetails = async (values: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio?: string;
  }) => {
    try {
      if (values.email !== userMetadata.value.email) {
        await checkIfEmailExists(values.email, true);
      }

      if (values.username !== userMetadata.value.username) {
        await checkIfUsernameExists(values.username);
      }

      await updateAccount(values);
      return 'Account details successfully updated.';
    } catch (err: any) {
      throw new Error(
        handleError(err, updateUserDetailsErrorMessages.accountUpdateFailed)
      );
    }
  };

  const updateAccount = async (newMetadata: Partial<UserMetadata>) => {
    try {
      const { error: authError } = await supabase.auth.updateUser({
        email: newMetadata.email,
      });

      if (authError) {
        handleSupabaseError(authError, 'update user email');
      }

      const { error: dbError } = await supabase
        .from('users')
        .update({
          firstname: newMetadata.firstName,
          lastname: newMetadata.lastName,
          username: newMetadata.username,
          bio: newMetadata.bio,
          avatar_url: newMetadata.avatarURL,
        })
        .eq('id', user.value?.id);

      if (dbError) {
        handleSupabaseError(dbError, 'update user profile');
      }

      userMetadata.value = { ...userMetadata.value, ...newMetadata };
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.accountUpdateFailed
      );
    }
  };

  const updateAvatar = async (selectedAvatar: File) => {
    try {
      if (!user.value) {
        throw new Error('User is not logged in.');
      }
      const fileName = `${user.value.id}-${selectedAvatar.name}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedAvatar, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        throw new Error(
          handleError(error, updateUserDetailsErrorMessages.avatarUpdateFailed)
        );
      }

      const { data: publicURLData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (publicURLData?.publicUrl) {
        await updateAccount({ avatarURL: publicURLData.publicUrl });
      }
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.avatarUpdateFailed
      );
      throw err;
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw new Error(
          handleError(
            authError,
            updateUserDetailsErrorMessages.passwordUpdateFailed
          )
        );
      }
    } catch (err: any) {
      errorMessage.value = handleError(
        err,
        updateUserDetailsErrorMessages.passwordUpdateFailed
      );
      throw err;
    }
  };

  return {
    errorMessage,
    updateAccountDetails,
    updateAccount,
    updateAvatar,
    updatePassword,
  };
}
