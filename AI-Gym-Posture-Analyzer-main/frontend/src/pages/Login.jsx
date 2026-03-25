import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function LoginPage({isLogin}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [age,setAge] = useState(null);
    const [height, setHeight] = useState(null);
    const [weight , setWeight] = useState(null);
    const [isLoginView, setIsLoginView] = useState(isLogin);
    const { login } = useAuth();
    const {t} = useLanguage();
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        const endpoint = isLoginView ? 'login' : 'register';
        try {
            // console.log("details",username, password, age, height, weight)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, age, height, weight }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.token) {
                    login(data.token); // Use the login function from context
                } else {
                    alert('Registration successful! Please log in.');
                    setIsLoginView(true);
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Auth error:", error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#cfb498] text-white">
            <div className="w-full max-w-md p-8 space-y-6  bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center text-black">{isLoginView ? t('login_heading') : t('register_heading')}</h1>
                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm text-black text-left font-medium">{t('login_subtitle1')}</label>
                        <input type="text" value={username?.undefined} onChange={(e) => setUsername(e.target.value)} required minLength="3" className="w-full px-3 py-2 mt-1 text-black bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-black" />
                    </div>
                    <div>
                        <label className="block text-sm text-black text-left font-medium">{t('login_subtitle2')}</label>
                        <input type="password" value={password?.undefined} onChange={(e) => setPassword(e.target.value)}pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}"  required  className="w-full px-3 py-2 mt-1 text-black  bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-black" title="Must contain at least one number and one uppercase and lowercase letter, and at least 5 or more characters"/>
                    </div>
                    {!isLoginView? 
                    <>
                        <div>
                            <label className="block text-sm text-black text-left font-medium">{t('login_age')}</label>
                            <input type="number" value={age?.undefined} onChange={(e) => setAge(e.target.value)} required min="15" className="w-full px-3 py-2 mt-1 text-black  bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-black" />
                        </div>
                        <div>
                            <label className="block text-sm text-black text-left font-medium">{t('login_height')}</label>
                            <input type="number" value={height?.undefined} onChange={(e) => setHeight(e.target.value)} required min="1" className="w-full px-3 py-2 mt-1 text-black  bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-black" />
                        </div>
                        <div>
                            <label className="block text-sm text-black text-left font-medium">{t('login_weight')}</label>
                            <input type="number" value={weight?.undefined} onChange={(e) => setWeight(e.target.value)} required min="1" className="w-full px-3 py-2 mt-1 text-black  bg-white border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-black" />
                        </div>
                    </>
                        : null}
                    <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-[#cfb498] rounded-md hover:bg-blue-700 cursor-pointer">
                        {isLoginView ? t('login_button') : t('register_button')}
                    </button>
                </form>
                <div className="text-sm text-center text-black">
                    <button onClick={() => navigate('/')} className="font-medium cursor-pointer text-gray-400 hover:underline mb-4">
                        &larr; {t('login_back')}
                    </button>
                    <p>
                        {isLoginView ? t('login_change1') : t('login_change2')}
                        <button onClick={() => setIsLoginView(!isLoginView)} className="ml-2  font-medium text-blue-400 hover:underline cursor-pointer">
                            {isLoginView ? 'Register' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;