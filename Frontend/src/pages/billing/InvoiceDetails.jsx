import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import Loader from "../../components/ui/Loader";
import { getInvoiceById } from "../../services/billingService";
import Invoice from "../../components/Invoice/Invoice";

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getInvoiceById(id)
      .then(setInvoice)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  if (notFound || !invoice) {
    return (
      <PageShell title="Invoice Not Found" subtitle={`No invoice found with ID: ${id}`}>
        <div style={{ background:"#fff", borderRadius:"18px", border:"1px solid rgba(26,26,46,.08)", padding:"48px", textAlign:"center", maxWidth:"440px" }}>
          <div style={{ fontSize:"48px", marginBottom:"16px" }}>🧾</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:"18px", fontWeight:800, color:"#1a1a2e", marginBottom:"8px" }}>Invoice Not Found</div>
          <div style={{ fontSize:"13px", color:"rgba(26,26,46,.45)", marginBottom:"20px" }}>The invoice you're looking for doesn't exist or has been deleted.</div>
          <button onClick={() => navigate(-1)} style={{ padding:"10px 22px", borderRadius:"12px", border:"none", background:"#1a1a2e", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Figtree',sans-serif" }}>← Go Back</button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Invoice #${invoice.invoiceNumber || id.slice(-8).toUpperCase()}`}
      subtitle={invoice.createdAt ? new Date(invoice.createdAt).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}
    >
      <Invoice data={invoice} onBack={() => navigate(-1)} />
    </PageShell>
  );
}
