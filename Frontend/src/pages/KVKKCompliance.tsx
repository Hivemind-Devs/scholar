import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield } from '@mui/icons-material';
export default function KVKKCompliance() {
  const { language, t } = useLanguage();
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Shield sx={{ fontSize: 40, color: '#0D47A1' }} />
          <Typography variant="h3" sx={{ color: '#0D47A1', fontWeight: 600 }}>
            {t('kvkkComplianceTitle')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('kvkkComplianceSubtitle')}
        </Typography>
        <Alert severity="info" sx={{ mb: 4 }}>
          {t('kvkkComplianceNotice')}
        </Alert>
        {language === 'tr' ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Veri Sorumlusu
              </Typography>
              <Typography paragraph>
                <strong>Veri Sorumlusu:</strong> Hivemind - YÖK Akademik Araştırma Platformu<br />
                <strong>Adres:</strong> İstanbul Teknik Üniversitesi, Maslak Kampüsü, 34469 Maslak/İstanbul<br />
                <strong>E-posta:</strong> kvkk@fediva.tr<br />
                <strong>Web:</strong> https://scholar.fediva.tr
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Kişisel Verilerin İşlenme Amaçları
              </Typography>
              <Typography paragraph>
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </Typography>
              <Typography paragraph>
                • Platform hizmetlerinin sunulması<br />
                • Kullanıcı hesabı yönetimi ve kimlik doğrulama<br />
                • Akademik araştırma ve eşleştirme hizmetleri<br />
                • Kişiselleştirilmiş öneri sistemleri<br />
                • İstatistiksel analiz ve raporlama<br />
                • Platform güvenliğinin sağlanması<br />
                • Yasal yükümlülüklerin yerine getirilmesi<br />
                • İletişim ve bilgilendirme
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. Kişisel Verilerin Toplanma Yöntemi
              </Typography>
              <Typography paragraph>
                Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:
              </Typography>
              <Typography paragraph>
                • Web sitesi kayıt formları<br />
                • OAuth kimlik doğrulama servisleri (Google, GitHub)<br />
                • Platform kullanım etkileşimleri<br />
                • Çerezler ve benzer teknolojiler<br />
                • API entegrasyonları<br />
                • Kullanıcı geri bildirimleri ve önerileri
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. İşlenen Kişisel Veri Kategorileri
              </Typography>
              <Typography paragraph>
                <strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi<br />
                <strong>İletişim Bilgileri:</strong> E-posta adresi<br />
                <strong>Müşteri İşlem Bilgileri:</strong> Arama geçmişi, kaydedilmiş aramalar<br />
                <strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, oturum bilgileri, şifre (şifrelenmiş)<br />
                <strong>Görsel ve İşitsel Kayıtlar:</strong> Profil fotoğrafı (isteğe bağlı)<br />
                <strong>Mesleki Deneyim:</strong> Akademik ilgi alanları, araştırma konuları
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. Kişisel Verilerin Aktarılması
              </Typography>
              <Typography paragraph>
                Kişisel verileriniz aşağıdaki durumlarda üçüncü kişilere aktarılabilir:
              </Typography>
              <Typography paragraph>
                <strong>Yurt İçi Aktarım:</strong><br />
                • Bulut hizmet sağlayıcıları (veri depolama)<br />
                • Teknik destek hizmeti sağlayıcıları<br />
                • Yasal yükümlülükler kapsamında kamu kurumları
              </Typography>
              <Typography paragraph>
                <strong>Yurt Dışı Aktarım:</strong><br />
                • OAuth servisleri (Google, GitHub) - KVKK md. 9'a uygun olarak<br />
                • Bulut altyapı hizmetleri - Yeterli koruma bulunan ülkeler
              </Typography>
              <Typography paragraph>
                Yurt dışına veri aktarımlarında KVKK'nın 9. maddesinde öngörülen şartlar sağlanmaktadır.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Kişisel Veri Sahibinin Hakları (KVKK Madde 11)
              </Typography>
              <Typography paragraph>
                KVKK'nın 11. maddesi uyarınca, kişisel veri sahibi olarak aşağıdaki haklara sahipsiniz:
              </Typography>
              <Typography paragraph>
                a) Kişisel verilerinizin işlenip işlenmediğini öğrenme,<br />
                b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,<br />
                c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,<br />
                d) Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,<br />
                e) Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,<br />
                f) KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,<br />
                g) (e) ve (f) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,<br />
                h) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,<br />
                i) Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. Haklarınızı Kullanma Yöntemi
              </Typography>
              <Typography paragraph>
                KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:
              </Typography>
              <Typography paragraph>
                <strong>Başvuru Yöntemleri:</strong><br />
                • E-posta: kvkk@yokplatform.edu.tr<br />
                • Posta: İstanbul Teknik Üniversitesi, Maslak, 34469 İstanbul<br />
                • Platform üzerinden başvuru formu
              </Typography>
              <Typography paragraph>
                <strong>Başvuru Süreci:</strong><br />
                • Başvurular kimlik teyidi sonrası değerlendirilir<br />
                • Yanıt süresi: En geç 30 gün<br />
                • Başvurunun reddi halinde gerekçe bildirilir<br />
                • Karardan memnun değilseniz Kişisel Verileri Koruma Kurulu'na şikâyet edilebilir
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. Veri Güvenliği Önlemleri
              </Typography>
              <Typography paragraph>
                KVKK'nın 12. maddesi gereği kişisel verilerinizin güvenliğini sağlamak için:
              </Typography>
              <Typography paragraph>
                • SSL/TLS şifreleme protokolleri<br />
                • Güvenlik duvarları ve saldırı tespit sistemleri<br />
                • Erişim kontrolü ve yetkilendirme sistemleri<br />
                • Düzenli güvenlik denetimleri<br />
                • Şifreleme algoritmaları (AES-256)<br />
                • Veri yedekleme ve kurtarma sistemleri<br />
                • Personel eğitimleri ve gizlilik taahhütnameleri<br />
                • Penetrasyon testleri
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                9. Çerez Politikası
              </Typography>
              <Typography paragraph>
                Platformumuz kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Çerez kullanımı 
                hakkında detaylı bilgi için Çerez Politikamızı inceleyebilirsiniz.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                10. Veri Saklama Süreleri
              </Typography>
              <Typography paragraph>
                Kişisel verileriniz:
              </Typography>
              <Typography paragraph>
                • İlgili mevzuatta öngörülen süreler boyunca<br />
                • İşlenme amacının gerekli kıldığı süre boyunca<br />
                • En fazla 10 yıl süreyle saklanır
              </Typography>
              <Typography paragraph>
                Saklama süresinin sona ermesi veya işleme amacının ortadan kalkması halinde verileriniz 
                silinir, yok edilir veya anonim hale getirilir.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                11. Veri İhlali Bildirimi
              </Typography>
              <Typography paragraph>
                Kişisel veri güvenliğini ihlal edebilecek bir durumun tespiti halinde:
              </Typography>
              <Typography paragraph>
                • Durum derhal Kişisel Verileri Koruma Kurumu'na bildirilir<br />
                • Etkilenen kişilere en kısa sürede bilgilendirme yapılır<br />
                • Gerekli önlemler alınır ve dokümante edilir
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                12. Politika Güncellemeleri
              </Typography>
              <Typography paragraph>
                Bu KVKK Uyumluluk Bildirimi, yasal değişiklikler veya platform güncellemeleri nedeniyle 
                revize edilebilir. Güncellemeler platform üzerinden duyurulacaktır.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                13. İletişim Bilgileri
              </Typography>
              <Typography paragraph>
                <strong>KVKK Başvuru ve Bilgi:</strong><br />
                E-posta: kvkk@fediva.tr<br />
                Web: https://scholar.fediva.tr<br />
                Adres: İstanbul Teknik Üniversitesi, Maslak Kampüsü, 34469 Maslak/İstanbul
              </Typography>
              <Typography paragraph>
                <strong>Kişisel Verileri Koruma Kurumu:</strong><br />
                Web: https://www.kvkk.gov.tr/
                E-posta: kvkk@kvkk.gov.tr
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Data Controller
              </Typography>
              <Typography paragraph>
                <strong>Data Controller:</strong> Hivemind - YÖK Academic Research Platform<br />
                <strong>Address:</strong> Istanbul Technical University, Maslak Campus, 34469 Maslak/Istanbul<br />
                <strong>Email:</strong> kvkk@fediva.tr<br />
                <strong>Web:</strong> https://scholar.fediva.tr
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Purposes of Processing Personal Data
              </Typography>
              <Typography paragraph>
                Your personal data is processed for the following purposes:
              </Typography>
              <Typography paragraph>
                • Providing Platform services<br />
                • User account management and authentication<br />
                • Academic research and matching services<br />
                • Personalized recommendation systems<br />
                • Statistical analysis and reporting<br />
                • Ensuring Platform security<br />
                • Fulfilling legal obligations<br />
                • Communication and notification
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. Methods of Collecting Personal Data
              </Typography>
              <Typography paragraph>
                Your personal data is collected through:
              </Typography>
              <Typography paragraph>
                • Website registration forms<br />
                • OAuth authentication services (Google, GitHub)<br />
                • Platform usage interactions<br />
                • Cookies and similar technologies<br />
                • API integrations<br />
                • User feedback and suggestions
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. Categories of Personal Data Processed
              </Typography>
              <Typography paragraph>
                <strong>Identity Information:</strong> Name, surname, email address<br />
                <strong>Contact Information:</strong> Email address<br />
                <strong>Customer Transaction Information:</strong> Search history, saved searches<br />
                <strong>Transaction Security Information:</strong> IP address, session data, password (encrypted)<br />
                <strong>Visual and Audio Records:</strong> Profile photo (optional)<br />
                <strong>Professional Experience:</strong> Academic interests, research topics
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. Transfer of Personal Data
              </Typography>
              <Typography paragraph>
                Your personal data may be transferred to third parties in the following cases:
              </Typography>
              <Typography paragraph>
                <strong>Domestic Transfer:</strong><br />
                • Cloud service providers (data storage)<br />
                • Technical support service providers<br />
                • Public institutions within legal obligations
              </Typography>
              <Typography paragraph>
                <strong>International Transfer:</strong><br />
                • OAuth services (Google, GitHub) - in accordance with KVKK Art. 9<br />
                • Cloud infrastructure services - Countries with adequate protection
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Rights of Data Subjects (KVKK Article 11)
              </Typography>
              <Typography paragraph>
                Under Article 11 of KVKK, you have the right to:
              </Typography>
              <Typography paragraph>
                a) Learn whether your personal data is being processed,<br />
                b) Request information if it has been processed,<br />
                c) Learn the purpose of processing and whether it is used correctly,<br />
                d) Know third parties to whom your data is transferred,<br />
                e) Request correction if data is incomplete or incorrect,<br />
                f) Request deletion or destruction of data,<br />
                g) Request notification of corrections/deletions to third parties,<br />
                h) Object to automated decision-making,<br />
                i) Request compensation for damages from unlawful processing.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. How to Exercise Your Rights
              </Typography>
              <Typography paragraph>
                <strong>Application Methods:</strong><br />
                • Email: kvkk@fediva.tr<br />
                • Web: https://scholar.fediva.tr<br />
                • Mail: Istanbul Technical University, Maslak, 34469 Istanbul<br />
                • Application form on Platform
              </Typography>
              <Typography paragraph>
                <strong>Application Process:</strong><br />
                • Applications are evaluated after identity verification<br />
                • Response time: Maximum 30 days<br />
                • Justification provided if rejected<br />
                • You can file a complaint with the Personal Data Protection Authority
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. Data Security Measures
              </Typography>
              <Typography paragraph>
                In accordance with KVKK Article 12, we implement:
              </Typography>
              <Typography paragraph>
                • SSL/TLS encryption protocols<br />
                • Firewalls and intrusion detection systems<br />
                • Access control and authorization systems<br />
                • Regular security audits<br />
                • Encryption algorithms (AES-256)<br />
                • Data backup and recovery systems<br />
                • Staff training and confidentiality agreements<br />
                • Penetration testing
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                9. Cookie Policy
              </Typography>
              <Typography paragraph>
                Our Platform uses cookies to improve user experience. Please review our Cookie Policy 
                for detailed information.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                10. Data Retention Periods
              </Typography>
              <Typography paragraph>
                Your personal data is retained:
              </Typography>
              <Typography paragraph>
                • For the periods stipulated in relevant legislation<br />
                • For as long as required by the processing purpose<br />
                • For a maximum of 10 years
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                11. Data Breach Notification
              </Typography>
              <Typography paragraph>
                In case of a personal data security breach:
              </Typography>
              <Typography paragraph>
                • The situation is immediately reported to the Personal Data Protection Authority<br />
                • Affected individuals are notified as soon as possible<br />
                • Necessary measures are taken and documented
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                12. Contact Information
              </Typography>
              <Typography paragraph>
                <strong>KVKK Applications and Information:</strong><br />
                Email: kvkk@fediva.tr<br />
                Web: https://scholar.fediva.tr<br />
                Address: Istanbul Technical University, Maslak Campus, 34469 Maslak/Istanbul
              </Typography>
              <Typography paragraph>
                <strong>Personal Data Protection Authority:</strong><br />
                Web: https://www.kvkk.gov.tr/
                Email: kvkk@kvkk.gov.tr
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}