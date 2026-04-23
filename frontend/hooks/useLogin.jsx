import { login } from "../src/services/fetchAPI";

export const useLogin = () => {
  return async (email, password) => {
    const response = await login(email, password);
    const { user, token } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      ...user,
      token,
      role: user.role || user.type_of_account,
    };
  };
};