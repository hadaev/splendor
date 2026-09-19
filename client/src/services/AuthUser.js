import $api from "./http";

export default class AuthUser {
    static async login(name, password) {
        console.log('AuthUser = ', name, password);
        return $api.post(
            'api/login',
            { name, password },
            {
                withCredentials: true,
                // credentials: "same-origin",
                credentials: 'include',
                // headers: {'Content-Type': 'application/json' }
            },
        );
    }

    static async registration(name, password) {
        return $api.post('api/registration', { name, password }, { withCredentials: true, credentials: 'include' });
    }

    // static async logout() {
    //     return $api.post('api/user/logout');
    // }
}