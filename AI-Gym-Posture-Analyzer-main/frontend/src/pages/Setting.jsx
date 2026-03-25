// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Setting({ profileData, onUpdateSuccess }) {
    const { token } = useAuth();
    const {t} = useLanguage();
    
    // Local state for form inputs
    const [formData, setFormData] = useState({
        age: '',
        height: '',
        weight: ''
    });
    const [status, setStatus] = useState(''); // For success/error messages

    // Load current data when component mounts or profileData changes
    useEffect(() => {
        if (profileData) {
            setFormData({
                age: profileData.age || '',
                height: profileData.height || '',
                weight: profileData.weight || ''
            });
        }
    }, [profileData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Saving...');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/update_profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus('Profile updated successfully!');
                // Trigger a profile refresh in the parent Dashboard
                if (onUpdateSuccess) onUpdateSuccess();
            } else {
                const errorData = await response.json();
                setStatus(`Error: ${errorData.message}`);
            }
        } catch (error) {
            setStatus('Failed to connect to server.');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h1 className="text-[#cfb4a0] mt-10 mb-8 font-bold text-5xl text-center">{t('settings')}</h1>

            <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">{t('edit_profile')}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Age */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('dash_age')}</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#cfb498] outline-none transition"
                            />
                        </div>

                        {/* Height */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('dash_height')} (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#cfb498] outline-none transition"
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">{t('dash_weight')} (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#cfb498] outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <p className={`text-center font-semibold ${status.includes('success') ? 'text-green-600' : 'text-blue-600'}`}>
                            {status}
                        </p>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            className="px-6 py-3 bg-[#cfb498] text-white font-bold rounded-lg shadow hover:bg-[#bfa38a] transition-all transform hover:scale-[1.02]"
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Setting;