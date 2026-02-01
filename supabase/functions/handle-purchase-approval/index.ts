import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action");
    const reason = url.searchParams.get("reason");

    console.log(`Processing approval action: ${action} for token: ${token}`);

    if (!token || !action) {
      return buildHtmlResponse("Error", "Parámetros inválidos. Falta token o acción.", "error");
    }

    if (action !== "approve" && action !== "reject") {
      return buildHtmlResponse("Error", "Acción no válida. Use 'approve' o 'reject'.", "error");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the request by approval token
    const { data: request, error: fetchError } = await supabase
      .from("purchase_requests")
      .select("*")
      .eq("approval_token", token)
      .single();

    if (fetchError || !request) {
      console.error("Request not found:", fetchError);
      return buildHtmlResponse("Error", "Solicitud no encontrada o token inválido.", "error");
    }

    if (request.status !== "pending") {
      const statusText = request.status === "approved" ? "APROBADA" : "RECHAZADA";
      return buildHtmlResponse(
        "Ya procesada",
        `Esta solicitud ya fue ${statusText} el ${new Date(request.approved_at).toLocaleString('es-AR')}.`,
        "warning"
      );
    }

    // If rejecting and no reason provided, show rejection form
    if (action === "reject" && !reason && req.method === "GET") {
      return buildRejectionForm(token, request);
    }

    // Update the request
    const updateData = {
      status: action === "approve" ? "approved" : "rejected",
      approved_at: new Date().toISOString(),
      approved_by: "Supervisor via Email",
      rejection_reason: action === "reject" ? (reason || "Sin motivo especificado") : null,
    };

    const { error: updateError } = await supabase
      .from("purchase_requests")
      .update(updateData)
      .eq("id", request.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return buildHtmlResponse("Error", "No se pudo actualizar la solicitud.", "error");
    }

    const title = action === "approve" ? "✓ Solicitud Aprobada" : "✗ Solicitud Rechazada";
    const message = action === "approve"
      ? `La solicitud N° ${request.request_number} para ${request.buyer_name} ha sido APROBADA exitosamente.`
      : `La solicitud N° ${request.request_number} para ${request.buyer_name} ha sido RECHAZADA. Motivo: ${reason || 'Sin motivo especificado'}`;
    const type = action === "approve" ? "success" : "rejected";

    console.log(`Request ${request.id} ${action}ed successfully`);

    return buildHtmlResponse(title, message, type);
  } catch (error: any) {
    console.error("Error in handle-purchase-approval:", error);
    return buildHtmlResponse("Error", `Ocurrió un error: ${error.message}`, "error");
  }
});

function buildHtmlResponse(title: string, message: string, type: "success" | "error" | "warning" | "rejected"): Response {
  const colors = {
    success: { bg: "#22c55e", icon: "✓" },
    error: { bg: "#ef4444", icon: "✗" },
    warning: { bg: "#f59e0b", icon: "⚠" },
    rejected: { bg: "#ef4444", icon: "✗" },
  };

  const { bg, icon } = colors[type];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - AUTOBUS S.A.</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    }
    .header {
      background: ${bg};
      color: white;
      padding: 40px 24px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      color: #475569;
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      padding: 16px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #94a3b8;
      font-size: 12px;
    }
    .logo {
      margin-top: 16px;
      font-weight: bold;
      color: #1e3a5f;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p>${message}</p>
    </div>
    <div class="footer">
      <p>Sistema de Gestión de Operaciones</p>
      <p class="logo">🚌 AUTOBUS S.A.</p>
    </div>
  </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function buildRejectionForm(token: string, request: any): Response {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rechazar Solicitud - AUTOBUS S.A.</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: #ef4444;
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 { font-size: 20px; }
    .content { padding: 24px; }
    .info { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .info p { color: #475569; font-size: 14px; margin: 4px 0; }
    .info strong { color: #1e293b; }
    label { display: block; font-weight: 600; color: #374151; margin-bottom: 8px; }
    textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      min-height: 100px;
    }
    textarea:focus { outline: none; border-color: #ef4444; }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn {
      flex: 1;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
    }
    .btn-cancel { background: #e2e8f0; color: #475569; }
    .btn-reject { background: #ef4444; color: white; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>✗ Rechazar Solicitud</h1>
    </div>
    <div class="content">
      <div class="info">
        <p><strong>Solicitud N°:</strong> ${request.request_number}</p>
        <p><strong>Cliente:</strong> ${request.buyer_name}</p>
        <p><strong>Unidad:</strong> ${request.unit_brand} ${request.unit_model}</p>
        <p><strong>Saldo:</strong> U$S ${Number(request.final_balance).toLocaleString('es-AR')}</p>
      </div>
      <form id="rejectForm">
        <label for="reason">Motivo del rechazo (opcional)</label>
        <textarea id="reason" name="reason" placeholder="Ingrese el motivo del rechazo..."></textarea>
        <div class="actions">
          <a href="javascript:history.back()" class="btn btn-cancel">Cancelar</a>
          <button type="submit" class="btn btn-reject">Confirmar Rechazo</button>
        </div>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('rejectForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const reason = encodeURIComponent(document.getElementById('reason').value);
      window.location.href = '?token=${token}&action=reject&reason=' + reason;
    });
  </script>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
