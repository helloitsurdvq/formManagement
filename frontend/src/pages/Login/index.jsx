import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useLogin } from "../../../hooks/useLogin";
import { useAuthContext } from "../../../hooks/useAuthContext";

import {
  Checkbox,
  FormControlLabel,
  TextField,
  Snackbar,
  Avatar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "../../components/Button";

function Copyright(props) {
  return (
    <p className="text-sm text-center text-gray-500" {...props}>
      {"Copyright © "}
      <a href="#" className="text-blue-500">
        Hello
      </a>{" "}
      {new Date().getFullYear()} {"."}
    </p>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorAlert, setErrorAlert] = useState(null);
  const login = useLogin();
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      const { role } = user;
      dispatch({ type: "LOGIN", payload: user });
      if (role === "admin") navigate("/");
      else navigate("/");
    } catch (err) {
      setErrorAlert(err.response?.data?.message || "Login failed");
    }
  };

  const handleAlertClose = () => {
    setErrorAlert(null);
  };

  return (
    <div className="flex flex-col h-screen px-6 py-6 md:flex-row">
      <div className="flex flex-1 items-center justify-center rounded-[15px] shadow-[rgba(0,_0,_0,_0.3)_0px_20px_60px]">
        <div className="w-4/5 max-w-md">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <Avatar sx={{ bgcolor: "#0077FF" }}>
                <LockOutlinedIcon />
              </Avatar>
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Log in</h1>
          </div>
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={!!errorAlert}
            autoHideDuration={5000}
            onClose={handleAlertClose}
            message={
              <div className="flex items-center">
                <WarningIcon color="error" style={{ marginRight: "8px" }} />
                <span>{errorAlert}</span>
              </div>
            }
          />
          <form className="mt-8" onSubmit={handleSubmit}>
            <div>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center mb-4">
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <div className="flex items-end justify-end flex-1">
                <Link
                  to="/notfound"
                  className="text-base font-semibold text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button label="Log In" type="submit" className="mt-5" />
            <div className="mt-4 text-center">
              Do not have an account?{" "}
              <Link to="" className="text-base font-semibold text-blue-500">
                Sign up
              </Link>
            </div>
          </form>
          <Copyright className="mt-5" />
        </div>
      </div>
    </div>
  );
}
