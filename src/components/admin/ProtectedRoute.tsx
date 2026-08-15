import { Navigate, useLocation } from "react-router-dom";
import {
  ADMIN_LOGIN_PATH,
  currentPathname,
  isAuthenticated,
  shouldRedirectToLogin,
} from "@/utils/adminAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (shouldRedirectToLogin(currentPathname(), authenticated)) {
    return <Navigate to={ADMIN_LOGIN_PATH} state={{ from: location }} replace />;
  }

  // Unauthenticated but already on the login path: this route is mid-exit under
  // AnimatePresence. Render nothing rather than redirect again.
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
