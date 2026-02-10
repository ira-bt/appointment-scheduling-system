'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/src/auth/auth.context';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';
import { UserRole } from '@/src/types/user.types';
import { userService } from '@/src/services/user.service';
import { authService } from '@/src/services/auth.service';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/src/utils/api-error';
import { Loader2, User, Save, Lock, ArrowLeft, Camera } from 'lucide-react';
import Link from 'next/link';
import { APP_ROUTES } from '@/src/constants/app-routes';
import { CITIES, BLOOD_TYPES } from '@/src/constants/healthcare.constants';
import UserAvatar from '@/src/components/common/UserAvatar';

export default function PatientProfilePage() {
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
        bloodType: '',
        allergies: '',
        medicalHistory: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
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
            if (!user.patientProfile) {
                checkAuthStatus();
                return;
            }

            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                city: user.city || '',
                bloodType: user.patientProfile?.bloodType || '',
                allergies: user.patientProfile?.allergies || '',
                medicalHistory: user.patientProfile?.medicalHistory || '',
                emergencyContactName: user.patientProfile?.emergencyContactName || '',
                emergencyContactPhone: user.patientProfile?.emergencyContactPhone || '',
            });
        }
    }, [user, checkAuthStatus]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
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
            profileData.bloodType !== (user.patientProfile?.bloodType || '') ||
            profileData.allergies !== (user.patientProfile?.allergies || '') ||
            profileData.medicalHistory !== (user.patientProfile?.medicalHistory || '') ||
            profileData.emergencyContactName !== (user.patientProfile?.emergencyContactName || '') ||
            profileData.emergencyContactPhone !== (user.patientProfile?.emergencyContactPhone || '')
        );
    }, [profileData, user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await userService.updateProfile(profileData);
            await checkAuthStatus(); // Refresh local user state
            toast.success('Profile updated successfully');
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
        <ProtectedRoute allowedRoles={[UserRole.PATIENT]}>
            <div className="min-h-screen bg-gray-50 pb-20">
                {/* Navbar */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={APP_ROUTES.DASHBOARD.BASE} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                src={user?.profileImage}
                                firstName={user?.firstName}
                                size="sm"
                                className="bg-blue-600 text-white font-bold"
                            />
                            <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                {user?.firstName} {user?.lastName}
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
                                        className="bg-blue-50 text-blue-600 border-4 border-white shadow-md"
                                    />
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white group-hover:scale-110 motion-safe:transition-transform">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                    </label>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
                                    {user?.role} Account
                                </div>
                            </div>

                            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
                                <h3 className="font-bold mb-2">Privacy & Security</h3>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    Your data is encrypted and secure. We never share your medical history with third parties without your consent.
                                </p>
                            </div>
                        </aside>

                        {/* Main Forms */}
                        <div className="flex-1 space-y-8">
                            {/* Profile Info Form */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
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
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
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
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Phone Number</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={profileData.phoneNumber}
                                                onChange={handleProfileChange}
                                                placeholder="+91 XXXXX XXXXX"
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
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
                                                className="select border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                            >
                                                <option value="">Select City</option>
                                                {CITIES.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="divider text-gray-400 text-[10px] font-bold uppercase tracking-widest">Medical Details</div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Blood Type</span>
                                            </label>
                                            <select
                                                name="bloodType"
                                                value={profileData.bloodType}
                                                onChange={handleProfileChange}
                                                className="select border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                            >
                                                <option value="">Select Blood Type</option>
                                                {BLOOD_TYPES.map(type => (
                                                    <option key={type} value={type}>{type.replace('_POS', '+').replace('_NEG', '-')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Allergies</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="allergies"
                                                value={profileData.allergies}
                                                onChange={handleProfileChange}
                                                placeholder="e.g. Peanuts, Penicillin"
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label pt-0 pb-1.5">
                                            <span className="label-text font-semibold text-gray-700">Medical History</span>
                                        </label>
                                        <textarea
                                            name="medicalHistory"
                                            value={profileData.medicalHistory}
                                            onChange={handleProfileChange}
                                            rows={3}
                                            placeholder="Past surgeries, chronic conditions, etc."
                                            className="textarea border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none resize-none min-h-[100px]"
                                        />
                                    </div>

                                    <div className="divider text-gray-400 text-[10px] font-bold uppercase tracking-widest">Emergency Contact</div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Contact Name</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="emergencyContactName"
                                                value={profileData.emergencyContactName}
                                                onChange={handleProfileChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label pt-0 pb-1.5">
                                                <span className="label-text font-semibold text-gray-700">Contact Phone</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="emergencyContactPhone"
                                                value={profileData.emergencyContactPhone}
                                                onChange={handleProfileChange}
                                                className="input border-2 border-gray-200 h-11 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 bg-white transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving || !hasChanges}
                                            className="btn btn-primary h-12 px-8 flex items-center gap-2 rounded-xl shadow-lg shadow-blue-100 border-none transition-all hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:bg-gray-300"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Update Profile
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* Password Change Form */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">Change Password</h3>
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
                                                className="input border-2 border-gray-200 h-11 focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 bg-white transition-all outline-none"
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
                                                className="input border-2 border-gray-200 h-11 focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 bg-white transition-all outline-none"
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
                                                className="input border-2 border-gray-200 h-11 focus:border-orange-500 focus:ring-4 focus:ring-orange-50/50 bg-white transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading || !isPasswordValid}
                                            className="btn btn-warning h-12 px-8 flex items-center gap-2 rounded-xl shadow-lg shadow-orange-100 border-none transition-all hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:bg-gray-300"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            Change Password
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
