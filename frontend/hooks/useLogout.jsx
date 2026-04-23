import { logout } from "../src/services/fetchAPI";

export const useLogout = () => {
  return async () => {
    const token = localStorage.getItem("token");
    const response = await logout(token);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return response;
  };
};

