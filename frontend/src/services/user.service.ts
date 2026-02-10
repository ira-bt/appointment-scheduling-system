import { apiClient } from '../utils/api-client';
import { API } from '../constants/api-routes';
import { User, UpdateProfileRequest } from '../types/user.types';

export const userService = {
    updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
        const response = await apiClient.put(API.USERS.UPDATE_PROFILE, data);
        const responseData = response.data as { data: User };
        return responseData.data;
    },
    uploadProfileImage: async (file: File): Promise<User> => {
        const formData = new FormData();
        formData.append('profileImage', file);
        const response = await apiClient.post(API.USERS.UPLOAD_PROFILE_IMAGE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        const responseData = response.data as { data: User };
        return responseData.data;
    },
};
