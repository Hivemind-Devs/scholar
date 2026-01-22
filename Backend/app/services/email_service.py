import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Optional, List
from datetime import datetime
from app.core.config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.smtp_from_email = settings.smtp_from_email
        self.smtp_from_name = getattr(settings, 'smtp_from_name', 'Hivemind')
        self.smtp_use_tls = getattr(settings, 'smtp_use_tls', True)

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            cc: Optional list of CC email addresses
            bcc: Optional list of BCC email addresses
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        try:

            message = MIMEMultipart('alternative')

            message['From'] = formataddr((self.smtp_from_name, self.smtp_from_email))
            message['To'] = to_email
            message['Subject'] = subject
            
            if cc:
                message['Cc'] = ', '.join(cc)
            if bcc:
                message['Bcc'] = ', '.join(bcc)
            

            text_part = MIMEText(body, 'plain', 'utf-8')
            message.attach(text_part)
            

            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                message.attach(html_part)
            


            if self.smtp_port == 465:

                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_username,
                    password=self.smtp_password,
                    use_tls=True,
                    start_tls=False,
                )
            else:

                await aiosmtplib.send(
                    message,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_username,
                    password=self.smtp_password,
                    start_tls=self.smtp_use_tls,
                )
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    async def send_contact_form_email(
        self,
        sender_name: str,
        sender_email: str,
        subject: str,
        message: str,
        recipient_email: Optional[str] = None
    ) -> bool:
        """
        Send a contact form submission email to the admin/recipient.
        
        Args:
            sender_name: Name of the person submitting the form
            sender_email: Email of the person submitting the form
            subject: Subject of the message
            message: Message content
            recipient_email: Optional recipient email (defaults to from_email)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        recipient = recipient_email or self.smtp_from_email
        

        text_body = f"""
Contact Form Submission

From: {sender_name} ({sender_email})
Subject: {subject}

Message:
{message}
"""
        

        html_body = f"""
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4a90e2; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 20px; }}
        .info-box {{ background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #4a90e2; }}
        .message-box {{ background-color: #fff; padding: 15px; margin: 10px 0; border: 1px solid #ddd; }}
        .label {{ font-weight: bold; color: #4a90e2; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Yeni İletişim Formu</h1>
        </div>
        <div class="content">
            <div class="info-box">
                <p><span class="label">Gönderen:</span> {sender_name}</p>
                <p><span class="label">E-posta:</span> {sender_email}</p>
                <p><span class="label">Konu:</span> {subject}</p>
            </div>
            <div class="message-box">
                <p><span class="label">Mesaj:</span></p>
                <p>{message.replace(chr(10), '<br>')}</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=recipient,
            subject=f"Contact Form: {subject}",
            body=text_body,
            html_body=html_body
        )

    async def send_contact_confirmation_email(
        self,
        recipient_name: str,
        recipient_email: str,
        subject: str,
        message_content: str
    ) -> bool:
        """
        Send a confirmation email to the person who submitted the contact form.
        
        Args:
            recipient_name: Name of the person who submitted the form
            recipient_email: Email of the person who submitted the form
            subject: Subject of the original message
            message_content: The message content that was submitted
            
        Returns:
            True if email was sent successfully, False otherwise
        """

        text_body = f"""
Merhaba {recipient_name},

İletişim formunuzu aldık. Mesajınız için teşekkür ederiz.

Konu: {subject}

Mesajınız:
{message_content}

Mesajınızı inceledikten sonra en kısa sürede size dönüş yapacağız.

Saygılarımızla,
Hivemind Ekibi
"""
        

        html_body = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
        }}
        .highlight-box {{
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }}
        .highlight-box p {{
            margin: 0;
            color: #555;
            font-size: 16px;
        }}
        .info-section {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }}
        .info-section p {{
            margin: 10px 0;
            color: #666;
            font-size: 14px;
        }}
        .subject-badge {{
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-top: 10px;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer p {{
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }}
        .signature {{
            margin-top: 30px;
            color: #333;
            font-weight: 600;
        }}
        .divider {{
            height: 1px;
            background: linear-gradient(to right, transparent, #ddd, transparent);
            margin: 30px 0;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>✓ Mesajınız Alındı</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Merhaba <strong>{recipient_name}</strong>,
            </div>
            
            <div class="message">
                İletişim formunuzu aldık ve mesajınız için teşekkür ederiz. 
                Gönderdiğiniz bilgiler aşağıdaki gibidir:
            </div>
            
            <div class="info-section">
                <p style="margin-top: 0;"><strong>Konu:</strong></p>
                <span class="subject-badge">{subject}</span>
            </div>
            
            <div class="message-box" style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #e9ecef;">
                <p style="margin-top: 0; font-weight: 600; color: #333; margin-bottom: 15px;"><strong>Mesajınız:</strong></p>
                <p style="margin: 0; color: #555; line-height: 1.8; white-space: pre-wrap;">{message_content.replace(chr(10), '<br>')}</p>
            </div>
            
            <div class="highlight-box">
                <p>
                    ✨ Mesajınızı inceledikten sonra <strong>en kısa sürede</strong> size dönüş yapacağız. 
                    Genellikle 24 saat içinde yanıt vermeye çalışıyoruz.
                </p>
            </div>
            
            <div class="divider"></div>
            
            <div class="signature">
                <p>Saygılarımızla,</p>
                <p style="color: #667eea; margin-top: 10px;">Hivemind Ekibi</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
            <p>Lütfen bu e-postaya yanıt vermeyin.</p>
            <p style="margin-top: 15px; color: #999; font-size: 12px;">
                © {datetime.now().year} Hivemind. Tüm hakları saklıdır.
            </p>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=recipient_email,
            subject=f"Mesajınız Alındı: {subject}",
            body=text_body,
            html_body=html_body
        )

    async def send_welcome_email(
        self,
        recipient_name: str,
        recipient_email: str
    ) -> bool:
        """
        Send a welcome email to newly registered users.
        
        Args:
            recipient_name: Name of the newly registered user
            recipient_email: Email of the newly registered user
            
        Returns:
            True if email was sent successfully, False otherwise
        """

        text_body = f"""
Merhaba {recipient_name},

YÖK Akademik Araştırma Platformu'na hoş geldiniz!

Hesabınız başarıyla oluşturuldu. Artık platformun tüm özelliklerinden yararlanabilirsiniz:

• Akademisyen arama ve filtreleme
• Profil detaylarını görüntüleme
• İlgi alanlarınızı belirleme
• Kişiselleştirilmiş öneriler alma
• Akademisyenleri kaydetme

Platformumuz hakkında sorularınız varsa, lütfen bizimle iletişime geçmekten çekinmeyin.

Tekrar hoş geldiniz!

Saygılarımızla,
Hivemind Ekibi
"""
        

        html_body = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
        }}
        .features {{
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }}
        .features ul {{
            margin: 0;
            padding-left: 20px;
            color: #555;
        }}
        .features li {{
            margin: 10px 0;
            font-size: 15px;
        }}
        .cta-button {{
            display: inline-block;
            background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%);
            color: #ffffff !important;
            padding: 12px 30px;
            text-decoration: none !important;
            border-radius: 5px;
            font-weight: 600;
            margin: 20px 0;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer p {{
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }}
        .signature {{
            margin-top: 30px;
            color: #333;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Hoş Geldiniz!</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Merhaba <strong>{recipient_name}</strong>,
            </div>
            
            <div class="message">
                YÖK Akademik Araştırma Platformu'na hoş geldiniz! Hesabınız başarıyla oluşturuldu.
            </div>
            
            <div class="features">
                <p style="margin-top: 0; font-weight: 600; color: #333; margin-bottom: 15px;">
                    Platformun özellikleri:
                </p>
                <ul>
                    <li>🔍 Akademisyen arama ve gelişmiş filtreleme</li>
                    <li>👤 Detaylı profil görüntüleme</li>
                    <li>🎯 Araştırma ilgi alanlarınızı belirleme</li>
                    <li>💡 Kişiselleştirilmiş danışman önerileri</li>
                    <li>⭐ İlginizi çeken akademisyenleri kaydetme</li>
                </ul>
            </div>
            
            <div class="message">
                Artık platformun tüm özelliklerinden yararlanabilirsiniz. Sorularınız için bizimle iletişime geçmekten çekinmeyin.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="cta-button" style="color: white !important; text-decoration: none;">Platforma Git</a>
            </div>
            
            <div class="signature">
                <p>Tekrar hoş geldiniz!</p>
                <p style="color: #0D47A1; margin-top: 10px;">Hivemind Ekibi</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
            <p>© {datetime.now().year} Hivemind - İstanbul Teknik Üniversitesi. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=recipient_email,
            subject="YÖK Akademik Platform'a Hoş Geldiniz!",
            body=text_body,
            html_body=html_body
        )

    async def send_password_reset_email(
        self,
        recipient_name: str,
        recipient_email: str,
        reset_code: str
    ) -> bool:
        """
        Send a password reset code email to the user.
        
        Args:
            recipient_name: Name of the user
            recipient_email: Email of the user
            reset_code: 6-digit reset code
            
        Returns:
            True if email was sent successfully, False otherwise
        """

        text_body = f"""
Merhaba {recipient_name},

Şifre sıfırlama talebiniz alındı. Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:

Kod: {reset_code}

Bu kod 15 dakika geçerlidir.

Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.

Saygılarımızla,
Hivemind Ekibi
"""
        

        html_body = f"""
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        .header {{
            background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.8;
        }}
        .code-box {{
            background: linear-gradient(135deg, #0D47A1 0%, #1976D2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        .code-box-label {{
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }}
        .code {{
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 0;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .warning p {{
            margin: 0;
            color: #856404;
            font-size: 14px;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }}
        .footer p {{
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }}
        .signature {{
            margin-top: 30px;
            color: #333;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Şifre Sıfırlama</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Merhaba <strong>{recipient_name}</strong>,
            </div>
            
            <div class="message">
                Şifre sıfırlama talebiniz alındı. Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:
            </div>
            
            <div class="code-box">
                <div class="code-box-label">Şifre Sıfırlama Kodu</div>
                <div class="code">{reset_code}</div>
            </div>
            
            <div class="warning">
                <p>⚠️ Bu kod 15 dakika geçerlidir. Güvenliğiniz için kodu kimseyle paylaşmayın.</p>
            </div>
            
            <div class="message">
                Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin. Şifreniz değişmeyecektir.
            </div>
            
            <div class="signature">
                <p>Saygılarımızla,</p>
                <p style="color: #0D47A1; margin-top: 10px;">Hivemind Ekibi</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir.</p>
            <p>© {datetime.now().year} Hivemind - İstanbul Teknik Üniversitesi. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>
"""
        
        return await self.send_email(
            to_email=recipient_email,
            subject="Şifre Sıfırlama Kodu",
            body=text_body,
            html_body=html_body
        )

