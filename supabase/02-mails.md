# Mi pase: textos de los mails (castellano)

Se cargan en Supabase, en **Authentication → Emails → Templates**. Para cada plantilla: copiá el **Asunto** en *Subject* y el bloque de código completo en *Body* (pestaña "Source" si aparece), y guardá.

Mi pase usa dos plantillas:

- **Confirm signup**: le llega a quien activa su cuenta por primera vez.
- **Magic link**: le llega a quien ya activó su cuenta y pide un link nuevo ("Olvidé mi contraseña").

No borres `{{ .ConfirmationURL }}`: es el link personal de cada persona.

---

## Confirm signup

**Asunto:**

```
Activá tu cuenta de Mi pase · SUBE
```

**Cuerpo:**

```html
<div style="margin:0;padding:32px 16px;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#151512;border-radius:16px;padding:32px;color:#f5f5f0;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">COMUNIDAD DE PASAJEROS</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Activá tu cuenta de Mi pase</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">Tocá el botón para entrar a Mi pase y elegir tu contraseña. Desde ahí vas a poder mostrar tu boleto en los comercios adheridos de la comunidad.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Activar mi cuenta</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el link desde el mismo celular o computadora donde lo pediste. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Si no pediste activar tu cuenta, ignorá este mail.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#6b6b66;text-align:center;">SUBE · Un viaje colectivo por La Plata · laplatasube@gmail.com</p>
</div>
```

---

## Magic link

**Asunto:**

```
Tu link para entrar a Mi pase · SUBE
```

**Cuerpo:**

```html
<div style="margin:0;padding:32px 16px;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#151512;border-radius:16px;padding:32px;color:#f5f5f0;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#c1ff00;">COMUNIDAD DE PASAJEROS</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#f5f5f0;">Entrá a Mi pase</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#d6d6d0;">Pediste un link para entrar a Mi pase. Al tocar el botón vas a poder elegir una contraseña nueva.</p>
    <p style="margin:0 0 28px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#c1ff00;color:#0b0b0b;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px;">Entrar y elegir contraseña</a></p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#a8a8a2;">Abrí el link desde el mismo celular o computadora donde lo pediste. Vence en una hora.</p>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#a8a8a2;">Si no lo pediste vos, ignorá este mail: tu cuenta sigue segura.</p>
  </div>
  <p style="max-width:480px;margin:16px auto 0;font-size:12px;color:#6b6b66;text-align:center;">SUBE · Un viaje colectivo por La Plata · laplatasube@gmail.com</p>
</div>
```
