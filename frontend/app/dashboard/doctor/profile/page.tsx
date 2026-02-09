'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/src/auth/auth.context';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { UserRole } from '@/src/types/user.types';
import { userService } from '@/src/services/user.service';
import { authService } from '@/src/services/auth.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/src/utils/api-error';
import { Loader2, User, Save, Lock, ArrowLeft, Briefcase, Award, DollarSign, Camera } from 'lucide-react';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { CITIES, SPECIALTIES } from '@/src/constants/healthcare.constants';
import UserAvatar from '@/src/components/common/UserAvatar';

export default function DoctorProfilePage() {
    const { user, logout, checkAuthStatus } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        city: '',
        bio: '',
        specialty: '',
        experience: 0,
        qualification: '',
        consultationFee: 500,
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            // Safety check: if profile data is missing, trigger a refresh
            if (!user.doctorProfile) {
                checkAuthStatus();
                return;
            }

            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                city: user.city || '',
                bio: user.doctorProfile?.bio || '',
                specialty: user.doctorProfile?.specialty || '',
                experience: user.doctorProfile?.experience || 0,
                qualification: user.doctorProfile?.qualification || '',
                consultationFee: user.doctorProfile?.consultationFee || 500,
            });
        }
    }, [user, checkAuthStatus]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const hasChanges = useMemo(() => {
        if (!user) return false;
        return (
            profileData.firstName !== (user.firstName || '') ||
            profileData.lastName !== (user.lastName || '') ||
            profileData.phoneNumber !== (user.phoneNumber || '') ||
            profileData.city !== (user.city || '') ||
            profileData.bio !== (user.doctorProfile?.bio || '') ||
            profileData.specialty !== (user.doctorProfile?.specialty || '') ||
            profileData.experience !== (user.doctorProfile?.experience || 0) ||
            profileData.qualification !== (user.doctorProfile?.qualification || '') ||
            profileData.consultationFee !== (user.doctorProfile?.consultationFee || 500)
        );
    }, [profileData, user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await userService.updateProfile(profileData);
            await checkAuthStatus(); // Refresh local user state
            toast.success('Professional profile updated successfully');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type?.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size should be less than 2MB');
            return;
        }

        try {
            setUploadingImage(true);
            await userService.uploadProfileImage(file);
            await checkAuthStatus();
            toast.success('Profile picture updated');
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setUploadingImage(false);
        }
    };

    const isPasswordValid = useMemo(() => {
        return (
            passwordData.currentPassword.length > 0 &&
            passwordData.newPassword.length >= 8 &&
            passwordData.newPassword === passwordData.confirmPassword
        );
    }, [passwordData]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password changed successfully. Please login again.');
            logout();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Navbar */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={APP_ROUTES.DASHBOARD.BASE} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <h1 className="text-xl font-bold text-gray-800">Doctor Profile</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                src={user?.profileImage}
                                firstName={user?.firstName}
                                size="sm"
                                className="bg-indigo-600 text-white font-bold"
                            />
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                Dr. {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar/Info */}
                        <aside className="lg:w-1/3 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
                                <div className="relative w-24 h-24 mx-auto mb-4 group">
                                    <UserAvatar
                                        src={user?.profileImage}
                                        firstName={user?.firstName}
                                        size="xl"
                                        className="bg-indigo-50 text-indigo-600 border-4 border-white shadow-md font-black"
                                    />
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors border-2 border-white group-hover:scale-110 motion-safe:transition-transform">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                    </label>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Dr. {user?.firstName} {user?.lastName}</h2>
                                <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                                    {profileData.specialty || 'General Practitioner'}
                                </div>
                            </div>

                            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
                                <h3 className="font-bold mb-2">Public Bio</h3>
                                <p className="text-indigo-100 text-sm leading-relaxed italic">
                                    &quot;{profileData.bio || 'No bio provided yet. Add one to help patients know you better.'}&quot;
                                </p>
                            </div>
                        </aside>

                        {/* Main Forms */}
                        <div className="flex-1 space-y-8">
                            {/* Professional Info Form */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Professional Details</h3>
                                </div>

                                <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">First Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleProfileChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Last Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleProfileChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Specialty</span>
                                            </label>
                                            <select
                                                name="specialty"
                                                value={profileData.specialty}
                                                onChange={handleProfileChange}
                                                className="select border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                            >
                                                <option value="">Select Specialty</option>
                                                {SPECIALTIES.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Qualification</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="qualification"
                                                value={profileData.qualification}
                                                onChange={handleProfileChange}
                                                placeholder="e.g. MBBS, MD"
                                                className="input border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Experience (Years)</span>
                                            </label>
                                            <div className="relative">
                                                <Award className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="number"
                                                    name="experience"
                                                    value={profileData.experience}
                                                    onChange={handleProfileChange}
                                                    min="0"
                                                    className="input border-2 border-gray-200 h-11 pl-10 w-full focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Consultation Fee (₹)</span>
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="number"
                                                    name="consultationFee"
                                                    value={profileData.consultationFee}
                                                    onChange={handleProfileChange}
                                                    min="0"
                                                    step="50"
                                                    className="input border-2 border-gray-200 h-11 pl-10 w-full focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label pt-0 pb-1.5">
                                            <span className="label-text font-semibold text-gray-700">Professional Bio</span>
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={profileData.bio}
                                            onChange={handleProfileChange}
                                            rows={4}
                                            placeholder="Write a brief professional summary..."
                                            className="textarea border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none resize-none min-h-[120px]"
                                        />
                                    </div>

                                    <div className="divider text-gray-400 text-[10px] font-bold uppercase tracking-widest">Contact Information</div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Phone Number</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={profileData.phoneNumber}
                                                onChange={handleProfileChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">City</span>
                                            </label>
                                            <select
                                                name="city"
                                                value={profileData.city}
                                                onChange={handleProfileChange}
                                                className="select border-2 border-gray-200 h-11 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 bg-white transition-all outline-none"
                                            >
                                                <option value="">Select City</option>
                                                {CITIES.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving || !hasChanges}
                                            className="btn btn-primary h-12 px-8 flex items-center gap-2 rounded-xl shadow-lg shadow-indigo-100 border-none transition-all hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:bg-gray-300 bg-indigo-600 hover:enabled:bg-indigo-700"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* Password Change Form */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Security Settings</h3>
                                </div>

                                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Current Password</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-red-500 focus:ring-4 focus:ring-red-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">New Password</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-red-500 focus:ring-4 focus:ring-red-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Confirm Password</span>
                                            </label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-red-500 focus:ring-4 focus:ring-red-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading || !isPasswordValid}
                                            className="btn btn-error h-12 px-8 flex items-center gap-2 rounded-xl shadow-lg shadow-red-100 border-none transition-all hover:enabled:-translate-y-0.5 text-white disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
