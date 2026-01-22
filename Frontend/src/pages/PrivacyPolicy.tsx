import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
export default function PrivacyPolicy() {
  const { language, t } = useLanguage();
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={0} sx={{ p: 4, border: '1px solid #e0e0e0' }}>
        <Typography variant="h3" gutterBottom sx={{ color: '#0D47A1', fontWeight: 600, mb: 4 }}>
          {t('privacyPolicyTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('lastUpdated')}
        </Typography>
        {language === 'tr' ? (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Giriş
              </Typography>
              <Typography paragraph>
                YÖK Akademik Araştırma İstihbarat Platformu ("Platform"), Türkiye'deki akademisyenleri keşfetmek ve 
                danışman bulmak için kapsamlı bir web uygulamasıdır. Bu Gizlilik Politikası, kişisel verilerinizin 
                nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklar.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Topladığımız Bilgiler
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.1 Hesap Bilgileri
              </Typography>
              <Typography paragraph>
                • Ad Soyad<br />
                • E-posta adresi<br />
                • Şifre (şifrelenmiş olarak saklanır)<br />
                • OAuth sağlayıcı bilgileri (Google/GitHub üzerinden giriş yapılırsa)
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.2 Kullanım Verileri
              </Typography>
              <Typography paragraph>
                • Arama sorguları ve filtreleme tercihleri<br />
                • Kaydedilmiş aramalar<br />
                • Görüntülenen akademisyen profilleri<br />
                • Platform etkileşim verileri<br />
                • Tarayıcı türü ve IP adresi
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.3 Kullanıcı Tarafından Sağlanan İçerik
              </Typography>
              <Typography paragraph>
                • Akademisyen profillerine yapılan öneriler ve düzenlemeler<br />
                • Araştırma ilgi alanları<br />
                • Platform geri bildirimleri
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. Bilgileri Nasıl Kullanırız
              </Typography>
              <Typography paragraph>
                • Platform hizmetlerini sağlamak ve iyileştirmek<br />
                • Kullanıcı hesaplarını yönetmek ve kimlik doğrulamak<br />
                • Kişiselleştirilmiş danışman önerileri sunmak<br />
                • Arama sonuçlarını optimize etmek<br />
                • Platform güvenliğini sağlamak<br />
                • Kullanıcı deneyimini analiz etmek ve geliştirmek<br />
                • Yasal yükümlülüklere uymak
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. Veri Güvenliği
              </Typography>
              <Typography paragraph>
                Kişisel verilerinizi korumak için endüstri standardı güvenlik önlemlerini uygularız:
              </Typography>
              <Typography paragraph>
                • Şifreleme (aktarım sırasında ve depolama sırasında)<br />
                • Güvenli kimlik doğrulama protokolleri<br />
                • Düzenli güvenlik denetimleri<br />
                • Rol tabanlı erişim kontrolü<br />
                • Veri yedekleme ve kurtarma sistemleri
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. Veri Paylaşımı
              </Typography>
              <Typography paragraph>
                Kişisel verilerinizi üçüncü taraflarla satmayız. Verilerinizi yalnızca şu durumlarda paylaşırız:
              </Typography>
              <Typography paragraph>
                • Hizmet sağlayıcılarla (hosting, kimlik doğrulama)<br />
                • Yasal gereklilikler için<br />
                • Platformu korumak için (güvenlik tehditlerine karşı)<br />
                • Açık rızanızla
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Haklarınız (KVKK Kapsamında)
              </Typography>
              <Typography paragraph>
                Türk vatandaşları olarak aşağıdaki haklara sahipsiniz:
              </Typography>
              <Typography paragraph>
                • Kişisel verilerinizin işlenip işlenmediğini öğrenme<br />
                • İşlenmişse bilgi talep etme<br />
                • İşlenme amacını ve doğru kullanılıp kullanılmadığını öğrenme<br />
                • Verilerin düzeltilmesini veya silinmesini talep etme<br />
                • Otomatik işleme karşı itiraz etme<br />
                • Zarar durumunda tazminat talep etme
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. Çerezler
              </Typography>
              <Typography paragraph>
                Platformumuz kullanıcı deneyimini geliştirmek için çerezler kullanır. Çerez ayarlarını 
                tarayıcınızdan yönetebilirsiniz.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. İletişim
              </Typography>
              <Typography paragraph>
                Gizlilik ile ilgili sorularınız için:<br />
                E-posta: privacy@fediva.tr<br />
                Web: https://scholar.fediva.tr<br />
                Adres: İstanbul Teknik Üniversitesi, Maslak, İstanbul
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                1. Introduction
              </Typography>
              <Typography paragraph>
                The YÖK Academic Research Intelligence Platform ("Platform") is a comprehensive web application 
                for discovering Turkish academics and finding supervisors. This Privacy Policy explains how we 
                collect, use, store, and protect your personal information.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                2. Information We Collect
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.1 Account Information
              </Typography>
              <Typography paragraph>
                • Full name<br />
                • Email address<br />
                • Password (stored encrypted)<br />
                • OAuth provider information (if signing in via Google/GitHub)
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.2 Usage Data
              </Typography>
              <Typography paragraph>
                • Search queries and filter preferences<br />
                • Saved searches<br />
                • Scholar profiles viewed<br />
                • Platform interaction data<br />
                • Browser type and IP address
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 2 }}>
                2.3 User-Provided Content
              </Typography>
              <Typography paragraph>
                • Suggestions and edits to scholar profiles<br />
                • Research interests<br />
                • Platform feedback
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                3. How We Use Your Information
              </Typography>
              <Typography paragraph>
                • Provide and improve Platform services<br />
                • Manage user accounts and authentication<br />
                • Deliver personalized supervisor recommendations<br />
                • Optimize search results<br />
                • Ensure Platform security<br />
                • Analyze and enhance user experience<br />
                • Comply with legal obligations
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                4. Data Security
              </Typography>
              <Typography paragraph>
                We implement industry-standard security measures to protect your personal data:
              </Typography>
              <Typography paragraph>
                • Encryption (in transit and at rest)<br />
                • Secure authentication protocols<br />
                • Regular security audits<br />
                • Role-based access control<br />
                • Data backup and recovery systems
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                5. Data Sharing
              </Typography>
              <Typography paragraph>
                We do not sell your personal information to third parties. We only share your data when:
              </Typography>
              <Typography paragraph>
                • With service providers (hosting, authentication)<br />
                • Required by law<br />
                • To protect the Platform (against security threats)<br />
                • With your explicit consent
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                6. Your Rights (Under KVKK)
              </Typography>
              <Typography paragraph>
                As Turkish citizens, you have the right to:
              </Typography>
              <Typography paragraph>
                • Learn whether your personal data is being processed<br />
                • Request information if it has been processed<br />
                • Learn the purpose of processing and whether it is used correctly<br />
                • Request correction or deletion of data<br />
                • Object to automated processing<br />
                • Request compensation in case of damages
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                7. Cookies
              </Typography>
              <Typography paragraph>
                Our Platform uses cookies to enhance user experience. You can manage cookie settings 
                through your browser.
              </Typography>
            </Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                8. Contact Us
              </Typography>
              <Typography paragraph>
                For privacy-related questions:<br />
                Email: privacy@fediva.tr<br />
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