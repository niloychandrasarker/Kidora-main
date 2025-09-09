/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'kidora-token';
const USER_KEY = 'kidora-user';
const ADMIN_EMAIL = 'niloysarker.cs@gmail.com';

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
	const [user, setUser] = useState(() => {
		try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
	});
	const [isLoading, setIsLoading] = useState(true);

	// derive flags
	const isAuthenticated = !!token;
	const roleUpper = (user?.role || '').toString().toUpperCase();
	const { isAdmin, isSubAdmin } = useMemo(()=>{
		if(!user) return { isAdmin:false, isSubAdmin:false };
		const rolesArr = Array.isArray(user.roles) ? user.roles.map(r => String(r).toUpperCase()) : [];
		const admin = roleUpper === 'ADMIN' || rolesArr.includes('ADMIN') || user.isAdmin === true || String(user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
		return { isAdmin: admin, isSubAdmin: roleUpper === 'SUB_ADMIN' && !admin };
	}, [user, roleUpper]);
	const isAdminOrSub = isAdmin || isSubAdmin;

	// hydrate from storage once
	useEffect(() => {
		setIsLoading(false);
	}, []);

	// persist on change
	useEffect(() => {
		if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
	}, [token]);
	useEffect(() => {
		try {
			if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
		} catch {/* ignore */}
	}, [user]);

	const sendOtp = async (email) => {
		try {
			if (!email) return { success: false, message: 'Email required' };
			const res = await apiService.sendOtp(email);
			return res;
		} catch (e) {
			return { success: false, message: e?.message || 'Failed to send OTP' };
		}
	};

	const verifyOtp = async (email, otpCode) => {
		setIsLoading(true);
		try {
			if (!email || !otpCode) return { success: false, message: 'Email and OTP required' };
			const res = await apiService.verifyOtp(email, otpCode);
			// Backend shape: {success, data: { token, email, role, isAdmin, firstName, lastName }}
			const data = res?.data ?? res;
			const t = data?.token || data?.accessToken || '';
			const u = data?.user || {
				email: data?.email || email,
				role: data?.role || 'USER',
				isAdmin: data?.isAdmin || false,
				firstName: data?.firstName || '',
				lastName: data?.lastName || ''
			};
			if (t) setToken(t);
			setUser(u);
			return res;
		} catch (e) {
			return { success: false, message: e?.message || 'OTP verification failed' };
		} finally {
			setIsLoading(false);
		}
	};

	// Complete registration with profile fields and update context user
	const register = async (userData) => {
		// Attempt backend register; if it fails because user exists, fall back to profile update
		let registered = false;
		try {
			const res = await apiService.register({
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName,
				phone: userData.phone,
			});
			const data = res?.data ?? res;
			const t = data?.token || data?.accessToken || '';
			if (t) setToken(t);
			const next = {
				email: data?.email || userData.email,
				role: data?.role || 'USER',
				isAdmin: data?.isAdmin || false,
				firstName: data?.firstName || userData.firstName || '',
				lastName: data?.lastName || userData.lastName || '',
				phone: userData.phone || '',
			};
			setUser(next);
			registered = true;
		} catch {
			// ignore and try profile update
		}

		// Ensure profile fields are stored for the (now authenticated) user
		try {
			const upd = await updateProfile({
				firstName: userData.firstName || '',
				lastName: userData.lastName || '',
				phone: userData.phone || '',
			});
			if (!upd?.success) throw new Error(upd?.message || 'Profile update failed');
			// Refresh to make sure local user matches backend
			await refreshProfile();
			return { success: true };
		} catch (e) {
			return { success: registered, message: e?.message || 'Registration/profile update failed' };
		}
	};

	const logout = async () => {
		try { await apiService.logout(); } catch {/* best-effort */}
		setToken('');
		setUser(null);
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	};

	// Poll (lightweight) for role change if currently sub admin (e.g., demoted by an admin elsewhere)
	useEffect(() => {
		if(!isAuthenticated) return; 
		// Only need this if user is SUB_ADMIN
		if(!isSubAdmin) return; 
		let cancelled = false;
		const interval = setInterval(async () => {
			try {
				const res = await apiService.getProfile();
				const data = res?.data ?? res;
					if(!cancelled && data && data.role && data.role !== user?.role) {
						setUser(prev => ({ ...(prev||{}), role: data.role }));
					}
			} catch {/* ignore */}
		}, 10000); // every 10s
		return () => { cancelled = true; clearInterval(interval); };
	}, [isSubAdmin, isAuthenticated, user?.role]);

	// Fetch latest profile from backend and merge into user
	const refreshProfile = async () => {
		if (!token) return null;
		try {
			const res = await apiService.getProfile();
			const data = res?.data ?? res;
			if (!data) return null;
			const next = { ...(user || {}), ...data };
			setUser(next);
			return next;
		} catch {
			return null;
		}
	};

	// Update profile fields on backend, then sync context user
	const updateProfile = async (updates) => {
		try {
			const res = await apiService.updateProfile(updates);
			const data = res?.data ?? res;
			const next = { ...(user || {}), ...data };
			setUser(next);
			return { success: true, data: next };
		} catch (e) {
			return { success: false, message: e?.message || 'Profile update failed' };
		}
	};

	const value = {
		user,
		isLoading,
		isAuthenticated,
		isAdmin,
		isSubAdmin,
		isAdminOrSub,
		sendOtp,
		verifyOtp,
		register,
		logout,
		refreshProfile,
		updateProfile,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}

export default AuthProvider;

