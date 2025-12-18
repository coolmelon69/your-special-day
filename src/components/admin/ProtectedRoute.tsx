import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/utils/adminAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
