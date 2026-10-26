# Mi pase: textos de los mails (castellano)

Se cargan en Supabase, en **Authentication → Emails → Templates**. Para cada plantilla: copiá el **Asunto** en *Subject* y el bloque de código completo en *Body* (pestaña "Source" si aparece), y guardá.

Mi pase usa dos plantillas:

- **Confirm signup**: le llega a quien activa su cuenta por primera vez.
- **Magic link**: le llega a quien ya activó su cuenta y pide un link nuevo ("Olvidé mi contraseña").

Cada plantilla tiene **dos versiones en una**: la del equipo de trabajo (más formal) y la de la Comunidad de pasajeros. Supabase elige sola cuál mandar: las cuentas que se dan de alta desde "Credenciales del equipo" o desde el acceso del equipo reciben la primera.

No borres `{{ .ConfirmationURL }}` ni las líneas `{{ if … }}`, `{{ else }}` y `{{ end }}`.

---

## Confirm signup

**Asunto:**

```
{{ if .Data.equipo }}Activación de tu cuenta del equipo · SUBE{{ else }}Activá tu cuenta de Mi pase · SUBE{{ end }}
```

**Cuerpo:**

```html
<div style="margin:0;padding:32px 16px;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#151512;border-radius:16px;padding:32px;color:#f5f5f0;">
{{ if .Data.equipo }}
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">EQUIPO DE TRABAJO · SUBE</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Activación de tu cuenta del equipo</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">La coordinación te dio de alta en el equipo de trabajo de SUBE. Con el botón vas a activar tu cuenta y definir tu contraseña. Después vas a tener acceso a tu credencial y al portal de trabajo.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Activar cuenta</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el enlace desde el mismo dispositivo en el que lo vas a usar. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Para ingresar más adelante, guardá esta dirección: {{ .RedirectTo }}#redaccion. Si no esperabas este mail, ignoralo.</p>
{{ else }}
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">COMUNIDAD DE PASAJEROS</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Activá tu cuenta de Mi pase</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">Tocá el botón para entrar a Mi pase y elegir tu contraseña. Desde ahí vas a poder mostrar tu boleto en los comercios adheridos de la comunidad.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Activar mi cuenta</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el link desde el mismo celular o computadora donde lo pediste. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Si no pediste activar tu cuenta, ignorá este mail.</p>
{{ end }}
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#6b6b66;text-align:center;">SUBE · Un viaje colectivo por La Plata · laplatasube@gmail.com</p>
</div>
```

---

## Magic link

**Asunto:**

```
{{ if .Data.equipo }}Restablecer contraseña · Equipo SUBE{{ else }}Tu link para entrar a Mi pase · SUBE{{ end }}
```

**Cuerpo:**

```html
<div style="margin:0;padding:32px 16px;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#151512;border-radius:16px;padding:32px;color:#f5f5f0;">
{{ if .Data.equipo }}
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">EQUIPO DE TRABAJO · SUBE</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Restablecer tu contraseña</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">Recibimos un pedido para ingresar a tu cuenta del equipo. Con el botón vas a poder definir una contraseña nueva.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Definir contraseña</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el enlace desde el mismo dispositivo en el que lo pediste. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Si no hiciste este pedido, ignorá este mail: tu cuenta sigue protegida.</p>
{{ else }}
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">COMUNIDAD DE PASAJEROS</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Entrá a Mi pase</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">Pediste un link para entrar a Mi pase. Al tocar el botón vas a poder elegir una contraseña nueva.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Entrar y elegir contraseña</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el link desde el mismo celular o computadora donde lo pediste. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Si no lo pediste vos, ignorá este mail: tu cuenta sigue segura.</p>
{{ end }}
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#6b6b66;text-align:center;">SUBE · Un viaje colectivo por La Plata · laplatasube@gmail.com</p>
</div>
```
