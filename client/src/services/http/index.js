import axios from 'axios';

export const API_URL = 'http://localhost:9000/'
const $api = axios.create({
    // withCredentials: true,
    baseURL: API_URL,
});


$api.interceptors.request.use((config) => {
    config.headers.tokenUser = `Bearer ${localStorage.getItem('tokenUser')}`;
    return config;
});
$api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {

            originalRequest._retry = true;

            try {
                const response = await axios.get(`${API_URL}api/refresh`, {withCredentials: true});
                localStorage.setItem('tokenUser', response.data.accessToken);

                // return $api(originalRequest);
                return $api.request(originalRequest);

            } catch (refreshError) {
                // Redirect to login or emit an event
                localStorage.removeItem("tokenUser");
                return (window.location.href = window.location.origin + '/login');
            }
        }

        return Promise.reject(error);
    }
);
export default $api;
