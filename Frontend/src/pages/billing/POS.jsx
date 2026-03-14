import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** POS has been replaced by Sales Desk. Redirect automatically. */
export default function POS() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/sales/desk", { replace: true }); }, []);
  return null;
}
