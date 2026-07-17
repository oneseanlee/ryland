import { Navigate } from "react-router-dom";

/**
 * Legacy /homepage URL — permanently consolidates to /.
 * Google honors client-side JS redirects that fire immediately, and the
 * canonical + robots Disallow on /homepage reinforce the consolidation.
 */
const HomepageRedirect = () => <Navigate to="/" replace />;

export default HomepageRedirect;
