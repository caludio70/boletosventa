import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestPayload {
  requestId: string;
  pdfBase64: string;
  supervisorEmail: string;
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requestId, pdfBase64, supervisorEmail }: RequestPayload = await req.json();

    console.log(`Processing approval email for request ${requestId} to ${supervisorEmail}`);

    if (!requestId || !pdfBase64 || !supervisorEmail) {
      throw new Error("Missing required fields: requestId, pdfBase64, supervisorEmail");
    }

    // Fetch the purchase request
    const { data: request, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      console.error("Error fetching request:", fetchError);
      throw new Error("Purchase request not found");
    }

    // Build approval/rejection URLs
    const baseUrl = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".supabase.co");
    const functionsUrl = `${supabaseUrl}/functions/v1`;
    const approveUrl = `${functionsUrl}/handle-purchase-approval?token=${request.approval_token}&action=approve`;
    const rejectUrl = `${functionsUrl}/handle-purchase-approval?token=${request.approval_token}&action=reject`;

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Compra - Aprobación</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { padding: 24px; }
    .info-grid { display: grid; gap: 16px; margin-bottom: 24px; }
    .info-item { background: #f8fafc; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #3b82f6; }
    .info-item label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item p { margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1e293b; }
    .total-box { background: #0ea5e9; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0; }
    .total-box label { font-size: 14px; opacity: 0.9; }
    .total-box p { font-size: 32px; font-weight: bold; margin: 8px 0 0; }
    .actions { display: flex; gap: 16px; justify-content: center; padding: 24px; background: #f8fafc; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; }
    .btn-approve { background: #22c55e; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚌 Solicitud de Compra</h1>
      <p>N° ${request.request_number}</p>
    </div>
    
    <div class="content">
      <div class="info-grid">
        <div class="info-item">
          <label>Cliente</label>
          <p>${request.buyer_name}</p>
        </div>
        <div class="info-item">
          <label>${request.buyer_id_type || 'DNI'}</label>
          <p>${request.buyer_id_number || 'N/A'}</p>
        </div>
        <div class="info-item">
          <label>Unidad</label>
          <p>${request.unit_quantity}x ${request.unit_brand} ${request.unit_model} (${request.unit_condition})</p>
        </div>
        <div class="info-item">
          <label>Carrocería</label>
          <p>${request.unit_bodywork || 'N/A'}</p>
        </div>
        <div class="info-item">
          <label>Precio Unidad</label>
          <p>U$S ${Number(request.price_usd).toLocaleString('es-AR')}</p>
        </div>
        <div class="info-item">
          <label>Adicionales</label>
          <p>U$S ${Number(request.total_additionals).toLocaleString('es-AR')}</p>
        </div>
        <div class="info-item">
          <label>Usados</label>
          <p>- U$S ${Number(request.total_used).toLocaleString('es-AR')}</p>
        </div>
      </div>
      
      <div class="total-box">
        <label>SALDO FINAL</label>
        <p>U$S ${Number(request.final_balance).toLocaleString('es-AR')}</p>
      </div>
      
      ${request.observations ? `<p style="color:#64748b;font-size:14px;"><strong>Observaciones:</strong> ${request.observations}</p>` : ''}
    </div>
    
    <div class="actions">
      <a href="${approveUrl}" class="btn btn-approve">✓ APROBAR</a>
      <a href="${rejectUrl}" class="btn btn-reject">✗ RECHAZAR</a>
    </div>
    
    <div class="footer">
      <p>AUTOBUS S.A. — Sistema de Gestión de Operaciones</p>
      <p>El PDF con el detalle completo está adjunto a este email.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email with PDF attachment using base64 content directly
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "AUTOBUS S.A. <onboarding@resend.dev>", // Change to your verified domain
      to: [supervisorEmail],
      subject: `Solicitud de Compra N° ${request.request_number} - ${request.buyer_name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `Solicitud_${request.request_number}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    console.log("Email sent successfully:", emailData);

    // Update the request with supervisor email
    await supabase
      .from("purchase_requests")
      .update({ supervisor_email: supervisorEmail })
      .eq("id", requestId);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-purchase-approval:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
