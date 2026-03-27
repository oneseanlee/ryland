import { useParams, Navigate } from "react-router-dom";

export default function ReferralRedirect() {
  const { ref } = useParams<{ ref: string }>();
  return <Navigate to={`/assessment?ref=${ref || ""}`} replace />;
}
