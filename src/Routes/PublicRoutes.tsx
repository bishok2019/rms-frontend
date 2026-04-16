import { Route, Routes } from "react-router";
import Login from "../pages/Authentication/Pages/Login";
import Register from "../pages/Authentication/Pages/Register";
import ForgotPassword from "../pages/Authentication/Pages/ForgotPassword";
import ResetPassword from "../pages/Authentication/Pages/ResetPassword";

const PublicRoutes = () => {
  return (
    <Routes>
      <Route>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
    </Routes>
  );
};

export default PublicRoutes;
