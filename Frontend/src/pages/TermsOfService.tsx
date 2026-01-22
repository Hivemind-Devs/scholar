import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
export default function TermsOfService() {
  const { language, t } = useLanguage();
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0' }}>
        <Typography variant="h3" gutterBottom sx={{ color: '#0D47A1', fontWeight: 600, mb: 4 }}>
          {t('termsOfServiceTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('lastUpdated')}
        </Typography>
        {language === 'tr' ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Kabul ve Anlaşma
              </Typography>
              <Typography paragraph>
                YÖK Akademik Araştırma İstihbarat Platformu'nu ("Platform") kullanarak, bu Kullanım Koşullarını 
                kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız, Platform'u kullanmamalısınız.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Platform Hizmetleri
              </Typography>
              <Typography paragraph>
                Platform aşağıdaki hizmetleri sunar:
              </Typography>
              <Typography paragraph>
                • Akademisyen arama ve keşfetme<br />
                • Gelişmiş filtreleme ve sıralama özellikleri<br />
                • Akademisyen profil bilgilerini görüntüleme<br />
                • İşbirliği ağlarını görselleştirme<br />
                • Kişiselleştirilmiş danışman önerileri<br />
                • Kaydedilmiş aramalar ve bildirimler<br />
                • Kullanıcı hesabı yönetimi
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. Kullanıcı Hesapları
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                3.1 Hesap Oluşturma
              </Typography>
              <Typography paragraph>
                • Hesap oluşturmak için doğru ve güncel bilgiler sağlamalısınız<br />
                • 18 yaşından büyük olmalısınız<br />
                • Hesap bilgilerinizi gizli tutmalısınız<br />
                • Hesabınızı başkalarıyla paylaşmamalısınız
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                3.2 Hesap Sorumlulukları
              </Typography>
              <Typography paragraph>
                Hesabınız altında gerçekleşen tüm aktivitelerden siz sorumlusunuz. Yetkisiz kullanımı 
                derhal bildirmelisiniz.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. Kabul Edilebilir Kullanım
              </Typography>
              <Typography paragraph>
                Platform'u kullanırken aşağıdakileri YAPAMAZSINIZ:
              </Typography>
              <Typography paragraph>
                • Yanlış veya yanıltıcı bilgiler göndermek<br />
                • Başkalarının haklarını ihlal etmek<br />
                • Spam veya taciz edici içerik göndermek<br />
                • Sisteme zarar vermeye çalışmak<br />
                • Otomatik araçlarla veri toplamak (scraping)<br />
                • Platform güvenliğini tehlikeye atmak<br />
                • Fikri mülkiyet haklarını ihlal etmek<br />
                • Yasa dışı amaçlarla kullanmak
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. İçerik ve Fikri Mülkiyet
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.1 Platform İçeriği
              </Typography>
              <Typography paragraph>
                Tüm Platform içeriği (tasarım, kod, veri yapısı) bizim mülkiyetimizdir ve fikri mülkiyet 
                yasalarıyla korunmaktadır.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.2 Kullanıcı Katkıları
              </Typography>
              <Typography paragraph>
                Platform'a katkıda bulunarak (profil düzenlemeleri, öneriler), içeriğinizi Platform'da 
                kullanmamız için bize lisans vermiş olursunuz.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.3 Akademik Veriler
              </Typography>
              <Typography paragraph>
                Platform üzerindeki akademik veriler YÖK Akademik ve diğer açık kaynaklardan alınmıştır. 
                Bu veriler akademik ve araştırma amaçlı kullanım içindir.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Gizlilik
              </Typography>
              <Typography paragraph>
                Kişisel verilerinizin kullanımı Gizlilik Politikamızda açıklanmıştır. Platform'u kullanarak 
                Gizlilik Politikasını da kabul etmiş olursunuz.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. Hizmet Reddi
              </Typography>
              <Typography paragraph>
                Platform "olduğu gibi" sunulmaktadır. Aşağıdaki garantileri vermiyoruz:
              </Typography>
              <Typography paragraph>
                • Kesintisiz hizmet<br />
                • Hatasız çalışma<br />
                • Veri doğruluğu %100 garantisi<br />
                • Belirli sonuçların elde edilmesi
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. Sorumluluk Sınırlaması
              </Typography>
              <Typography paragraph>
                Platform'un kullanımından kaynaklanan dolaylı, arızi veya özel zararlardan sorumlu 
                değiliz. Sorumluluğumuz, yasaların izin verdiği ölçüde sınırlıdır.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                9. Değişiklikler
              </Typography>
              <Typography paragraph>
                Bu Kullanım Koşullarını istediğimiz zaman değiştirme hakkını saklı tutarız. 
                Önemli değişiklikler Platform üzerinden bildirilecektir.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                10. Hesap Sonlandırma
              </Typography>
              <Typography paragraph>
                Kullanım Koşullarını ihlal etmeniz durumunda hesabınızı sonlandırma hakkını saklı tutarız. 
                Siz de istediğiniz zaman hesabınızı kapatabilirsiniz.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                11. Uygulanacak Hukuk
              </Typography>
              <Typography paragraph>
                Bu Koşullar Türkiye Cumhuriyeti yasalarına tabidir. Anlaşmazlıklar İstanbul mahkemelerinde 
                çözümlenecektir.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                12. İletişim
              </Typography>
              <Typography paragraph>
                Sorularınız için:<br />
                E-posta: legal@fediva.tr<br />
                Web: https://scholar.fediva.tr<br />
                Adres: İstanbul Teknik Üniversitesi, Maslak, İstanbul
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Acceptance of Terms
              </Typography>
              <Typography paragraph>
                By using the YÖK Academic Research Intelligence Platform ("Platform"), you agree to be bound 
                by these Terms of Service. If you do not accept these terms, please do not use the Platform.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Platform Services
              </Typography>
              <Typography paragraph>
                The Platform provides the following services:
              </Typography>
              <Typography paragraph>
                • Scholar search and discovery<br />
                • Advanced filtering and sorting features<br />
                • Scholar profile information viewing<br />
                • Collaboration network visualization<br />
                • Personalized supervisor recommendations<br />
                • Saved searches and notifications<br />
                • User account management
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. User Accounts
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                3.1 Account Creation
              </Typography>
              <Typography paragraph>
                • You must provide accurate and current information<br />
                • You must be at least 18 years old<br />
                • You must keep your account credentials confidential<br />
                • You must not share your account with others
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                3.2 Account Responsibilities
              </Typography>
              <Typography paragraph>
                You are responsible for all activities under your account. You must report any 
                unauthorized use immediately.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. Acceptable Use
              </Typography>
              <Typography paragraph>
                You may NOT use the Platform to:
              </Typography>
              <Typography paragraph>
                • Submit false or misleading information<br />
                • Violate others' rights<br />
                • Send spam or harassing content<br />
                • Attempt to damage the system<br />
                • Scrape data with automated tools<br />
                • Compromise Platform security<br />
                • Infringe intellectual property rights<br />
                • Use for illegal purposes
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. Content and Intellectual Property
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.1 Platform Content
              </Typography>
              <Typography paragraph>
                All Platform content (design, code, data structure) is our property and protected by 
                intellectual property laws.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.2 User Contributions
              </Typography>
              <Typography paragraph>
                By contributing to the Platform (profile edits, suggestions), you grant us a license to 
                use your content on the Platform.
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                5.3 Academic Data
              </Typography>
              <Typography paragraph>
                Academic data on the Platform is sourced from YÖK Akademik and other open sources. 
                This data is for academic and research purposes.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Privacy
              </Typography>
              <Typography paragraph>
                Use of your personal data is described in our Privacy Policy. By using the Platform, 
                you also accept the Privacy Policy.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. Disclaimer of Warranties
              </Typography>
              <Typography paragraph>
                The Platform is provided "as is". We do not guarantee:
              </Typography>
              <Typography paragraph>
                • Uninterrupted service<br />
                • Error-free operation<br />
                • 100% data accuracy<br />
                • Specific results
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. Limitation of Liability
              </Typography>
              <Typography paragraph>
                We are not liable for indirect, incidental, or special damages arising from Platform use. 
                Our liability is limited to the extent permitted by law.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                9. Changes
              </Typography>
              <Typography paragraph>
                We reserve the right to modify these Terms at any time. Significant changes will be 
                communicated through the Platform.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                10. Account Termination
              </Typography>
              <Typography paragraph>
                We reserve the right to terminate your account if you violate these Terms. 
                You may also close your account at any time.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                11. Governing Law
              </Typography>
              <Typography paragraph>
                These Terms are governed by the laws of the Republic of Turkey. Disputes will be 
                resolved in Istanbul courts.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                12. Contact
              </Typography>
              <Typography paragraph>
                For questions:<br />
                Email: legal@fediva.tr<br />
                Web: https://scholar.fediva.tr<br />
                Address: Istanbul Technical University, Maslak, Istanbul, Turkey
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}