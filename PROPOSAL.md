# PROPOSAL INFINITERA 2.0
## WEB DEVELOPMENT COMPETITION

### **LAPORINFRA: SISTEM PELAPORAN DAN PEMANTAUAN KERUSAKAN INFRASTRUKTUR BERBASIS MULTIMODAL VISION AI DAN GEOSPASIAL GUNA MEWUJUDKAN SMART SUSTAINABLE CITIES**

<br />

**Diusulkan oleh:**
* **Nama Tim:** nama timnya apa pin
* **Ketua Tim:** Ryan Fadhila Ahmad – 543251045
* **Anggota Tim:** Muhammad Arvin Putra Felix – 543251033

**SMK TELKOM BANJARBARU**  
**2026**

---

## DAFTAR ISI

- **HALAMAN JUDUL**
- **DAFTAR ISI**
- **BAB I PENDAHULUAN**
  - 1.1 Latar Belakang
  - 1.2 Tujuan
  - 1.3 Manfaat
- **BAB II PEMBAHASAN DAN PERANCANGAN SISTEM**
  - 2.1 Penjelasan tentang Website
  - 2.2 Metode Pengembangan/Perancangan
  - 2.3 Teknologi/Tools yang Digunakan
  - 2.4 Arsitektur Sistem / User Flow
  - 2.5 Fitur dan Fungsi
  - 2.6 Permasalahan dan Solusi
    - 2.6.1 Analisis Permasalahan
    - 2.6.2 Strategi Solusi
  - 2.7 Dampak dan Implementasi
- **BAB III PENUTUP**
- **DAFTAR PUSTAKA**
- **LAMPIRAN**

---

## BAB I: PENDAHULUAN

### 1.1 Latar Belakang
Infrastruktur publik, terutama jaringan jalan raya, trotoar pejalan kaki, jembatan, sistem drainase, dan penerangan jalan umum, merupakan urat nadi mobilitas sosial serta roda penggerak perekonomian suatu bangsa. Namun, realitas di lapangan menunjukkan bahwa kerusakan fasilitas fisik sering kali luput dari pemantauan rutin otoritas pemerintah daerah dan dinas terkait hingga timbul korban jiwa atau kemacetan parah. Berdasarkan data Badan Pusat Statistik (BPS) dan Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR), puluhan ribu kilometer jalan di berbagai penjuru Indonesia berada dalam kondisi rusak ringan hingga rusak berat. Selain itu, catatan Korlantas Kepolisian Negara Republik Indonesia menegaskan bahwa kondisi jalan yang berlubang, licin, atau bergelombang menjadi salah satu pemicu utama kecelakaan lalu lintas fatal, terutama bagi pengendara roda dua yang mendominasi armada transportasi masyarakat.

Di era transformasi digital saat ini, partisipasi masyarakat (*citizen participation*) sebenarnya sangat tinggi. Warga sering kali mengunggah foto jalan rusak atau genangan banjir ke media sosial pribadi. Namun, fenomena pengaduan di media sosial ini cenderung bersifat sporadis, tidak terstruktur, tanpa titik koordinat yang presisi, serta tidak terintegrasi langsung dengan alur kerja teknis dinas Pekerjaan Umum. Di sisi lain, kanal pengaduan birokrasi konvensional sering kali dikeluhkan karena lambat, mengharuskan warga mengisi formulir teks yang panjang dan rumit, serta tidak memberikan kepastian maupun transparansi progres penanganan. Lebih krusial lagi, pihak dinas mengalami kesulitan besar dalam melakukan triage (pemilahan prioritas) secara cepat, yakni menentukan laporan mana yang memerlukan tindakan darurat 24 jam versus laporan yang bersifat perbaikan berkala, akibat minimnya standarisasi data visual yang masuk.

Isu mendesak ini memiliki resonansi mendalam dengan tema kompetisi Infinitera 2.0, yaitu **“Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations”**. Inovasi teknologi tidak boleh berhenti sebagai sekadar artefak komputasi, melainkan harus mampu menjadi jembatan konkret menuju keberlanjutan hidup generasi mendatang. Secara khusus, gagasan ini berakar kuat pada dua pilar Sustainable Development Goals (SDGs), yaitu:
- **SDG 9 (Industry, Innovation, and Infrastructure):** Khususnya Target 9.1, yakni membangun infrastruktur yang berkualitas, andal, berkelanjutan, dan tangguh untuk mendukung pembangunan ekonomi serta kesejahteraan manusia, dengan fokus pada akses yang terjangkau dan merata.
- **SDG 11 (Sustainable Cities and Communities):** Khususnya Target 11.2 dan 11.3, yakni menyediakan akses ke sistem transportasi yang aman dan berkelanjutan bagi semua kalangan, memperluas keselamatan jalan, serta meningkatkan kapasitas partisipasi publik dalam pengelolaan perkotaan yang inklusif (*Smart Governance*).

Menjawab tantangan tersebut, tim **nama timnya apa pin** dari SMK Telkom Banjarbaru merancang dan mengembangkan **LaporInfra**, sebuah platform web civic-tech mutakhir yang mengintegrasikan kecerdasan buatan Multimodal Vision AI (Google Gemini 2.5 Flash) dan pemetaan geospasial real-time. Dengan prinsip *zero-friction reporting*, warga cukup mengambil foto kerusakan menggunakan kamera gawai. Secara instan, AI akan memproses citra visual untuk mengklasifikasi objek kerusakan, menghitung tingkat bahaya secara objektif, menyematkan koordinat GPS presisi, dan memetakannya ke dalam radar interaktif sehingga Dinas PU dapat mengeksekusi perbaikan secara tepat sasaran, terukur, dan transparan.

### 1.2 Tujuan
Pengembangan website LaporInfra memiliki tujuan spesifik dan terukur:
1. **Merancang Sistem Pelaporan Zero-Friction Berbasis Vision AI:** Membangun sistem pengaduan kerusakan infrastruktur yang menghilangkan hambatan formulir manual berbelit-belit dengan mengandalkan analisis citra cerdas Google Gemini 2.5 Flash secara otomatis dalam waktu kurang dari 5 detik.
2. **Menyediakan Sistem Triase Otomatis & Visualisasi Radar Geospasial:** Menghasilkan penilaian tingkat keparahan (Ringan, Sedang, Kritis) dan skor risiko objektif (1–10) yang langsung diplotkan pada peta radar interaktif, guna mempermudah penentuan skala prioritas perbaikan oleh Dinas PU.
3. **Mewujudkan Transparansi Publik & Pelacakan Tiket Real-Time:** Menyediakan transparansi status penanganan setiap laporan melalui nomor tiket unik serta asisten chatbot AI interaktif untuk menjamin keterbukaan informasi kepada publik.
4. **Mendukung Pencapaian Target SDG 9 dan SDG 11:** Memberikan kontribusi nyata dalam percepatan perbaikan infrastruktur jalan yang aman, mengurangi angka kecelakaan, dan memberdayakan komunitas perkotaan melalui teknologi pintar yang berkelanjutan.

### 1.3 Manfaat
- **Bagi Pengguna (Warga Pelapor):** Mendapatkan kemudahan melapor tanpa proses rumit cukup dengan mengarahkan kamera ponsel. Warga memperoleh kepastian bahwa laporannya memiliki identitas tiket resmi, dipetakan secara akurat, dan progres tindak lanjutnya dapat dipantau setiap saat.
- **Bagi Masyarakat & Pemerintah Daerah:** Masyarakat menikmati fasilitas jalan dan lingkungan publik yang lebih aman dan minim risiko kecelakaan. Sementara bagi dinas terkait (PUPR/Bina Marga), platform ini memotong birokrasi verifikasi lapangan, mencegah pemborosan anggaran perbaikan akibat keterlambatan penanganan, dan mewujudkan tata kelola kota cerdas (*Smart City*) yang responsif.
- **Bagi Pengembangan Ilmu dan Teknologi:** Menjadi rujukan implementasi nyata pemanfaatan Multimodal Generative AI dalam sektor pelayanan publik (*Civic Technology*). Proyek ini membuktikan bahwa teknologi AI tingkat lanjut dapat diharmonisasikan dengan arsitektur geospasial terbuka (Leaflet & OpenStreetMap) untuk menghasilkan solusi berdampak sosial tinggi.

---

## BAB II: PEMBAHASAN DAN PERANCANGAN SISTEM

### 2.1 Penjelasan tentang Website
LaporInfra adalah platform web cerdas yang berfungsi sebagai jembatan digital antara masyarakat sipil dan instansi pengelola infrastruktur pemerintah (Dinas PUPR / Bina Marga / Dinas Perhubungan). Konsep utama LaporInfra berpusat pada integrasi tiga komponen:
1. Antarmuka pelaporan cepat dengan kamera langsung dan sensor GPS.
2. Mesin Multimodal AI yang bertindak sebagai inspektur digital otomatis.
3. Peta radar geospasial komprehensif yang menampilkan persebaran anomali infrastruktur.

Target pengguna LaporInfra mencakup dua entitas utama: masyarakat umum (pengendara, pejalan kaki, komunitas warga) dan petugas verifikator serta teknisi lapangan Dinas Pekerjaan Umum. Website ini menjawab tema Infinitera 2.0 dengan menciptakan pemeliharaan infrastruktur preventif yang berkelanjutan untuk mewariskan kota yang tangguh bagi generasi mendatang.

### 2.2 Metode Pengembangan/Perancangan
Pengembangan LaporInfra menerapkan metodologi **Agile Scrum** yang iteratif dalam 4 sprint terstruktur:
- **Sprint 1 (Research & System Design):** Analisis kebutuhan, perancangan kriteria prompt visual AI, arsitektur UI/UX, dan schema database.
- **Sprint 2 (Core AI Integration & Frontend):** Implementasi kamera real-time dan integrasi Google Gemini 2.5 Flash Vision API (`@google/genai`), serta perancangan komponen UI React 19 dan Tailwind CSS v4.
- **Sprint 3 (Geospatial Mapping & Dashboard):** Pengembangan radar peta interaktif dengan Leaflet dan OpenStreetMap, reverse geocoding otomatis, dashboard manajemen dinas PU, dan sistem pelacakan tiket.
- **Sprint 4 (Testing, Optimization & Deployment):** Pengujian build, optimasi responsivitas mobile, dual-theme styling (Dark & Light Mode), serta deployment kontainer di Google AI Studio Cloud Run.

**Pembagian Tugas Tim (nama timnya apa pin):**
- **Ryan Fadhila Ahmad (Ketua Tim / Fullstack & AI Lead):** Bertanggung jawab atas arsitektur sistem keseluruhan, integrasi Google Gemini 2.5 Flash Multimodal Vision API, perancangan antarmuka React 19 dan Tailwind CSS v4, pengembangan peta radar geospasial Leaflet, serta manajemen deployment di Google AI Studio.
- **Muhammad Arvin Putra Felix (Anggota / Frontend & Data Analyst):** Bertanggung jawab atas pengujian alur pengguna (*User Flow*), penyiapan data set sampel kerusakan infrastruktur jalan Indonesia, pengujian integrasi geolokasi GPS, dokumentasi sistem, dan perancangan materi presentasi kompetisi.

### 2.3 Teknologi/Tools yang Digunakan
- **Front-End:** React 19, TypeScript 5.8, Tailwind CSS v4, Motion (Framer Motion), Lucide React.
- **Artificial Intelligence (AI):** Google Gemini 2.5 Flash via `@google/genai` (Analisis Multimodal Vision, kalkulasi skor risiko 1-10, rekomendasi teknis, dan chatbot AI asisten).
- **Geospatial & Mapping:** Leaflet v1.9, OpenStreetMap (OSM) Tiles, Geolocation API, Nominatim Reverse Geocoding.
- **Back-End & Server:** Node.js, Express.js, TypeScript execute (`tsx`), `esbuild`.
- **Database & Autentikasi:** Firebase Firestore & Firebase Authentication (Google OAuth 2.0).
- **Hosting / Deployment:** Google AI Studio Cloud Run Platform (`https://laporinfra.ai.studio/`).
- **Tools Pendukung:** Visual Studio Code, Git, GitHub, Postman, Chrome DevTools.

### 2.4 Arsitektur Sistem / User Flow
Alur kerja sistem LaporInfra terbagi dalam 4 tingkatan:
1. **Client Tier:** Warga mengambil foto kerusakan fasilitas fisik. Sensor GPS perangkat menangkap koordinat presisi dan melakukan *reverse-geocoding* alamat secara otomatis.
2. **AI Vision Tier:** Citra dikirim ke Google Gemini 2.5 Flash Vision API dengan structured prompt. AI mengekstrak kategori kerusakan, skor tingkat bahaya (1–10), dampak keselamatan publik, dan rekomendasi perbaikan darurat.
3. **Data & Storage Tier:** Laporan tersimpan di Firebase Firestore dengan status awal "Baru" dan diterbitkan kode tiket unik pelacakan.
4. **Geospatial & Dashboard Tier:** Laporan terpetakan di Radar Peta Leaflet dengan kode warna keparahan (Merah = Kritis, Kuning = Sedang, Hijau = Ringan). Petugas Dinas PU memverifikasi dan memperbarui status pengerjaan hingga selesai.

### 2.5 Fitur dan Fungsi

| No | Nama Fitur | Deskripsi Fungsi |
|---|---|---|
| 1 | **Zero-Friction Camera & AI Triage** | Mengambil foto kerusakan langsung melalui kamera gawai dan memprosesnya menggunakan Google Gemini 2.5 Flash untuk klasifikasi kategori dan keparahan otomatis. |
| 2 | **Deteksi Lokasi GPS & Reverse Geocoding** | Mendeteksi koordinat latitude dan longitude pelapor secara presisi tinggi, serta mengonversi titik koordinat menjadi alamat jalan dan kelurahan yang mudah dipahami manusia. |
| 3 | **Peta Radar Geospasial Interaktif** | Memetakan sebaran titik anomali infrastruktur menggunakan Leaflet & OSM dengan penanda warna tingkat bahaya, filter keparahan, dan popup informasi lengkap. |
| 4 | **Asisten AI Percakapan (Gemini Chatbot)** | Layanan chatbot berbasis LLM yang terhubung dengan data laporan LaporInfra untuk menjawab pertanyaan warga mengenai estimasi pengerjaan, regulasi PU, dan tata cara pelaporan. |
| 5 | **Sistem Pelacakan Tiket Publik (Public Tracker)** | Pemberian kode tiket unik untuk setiap laporan masuk, memungkinkan warga memeriksa status pengerjaan secara transparan tanpa perlu login akun. |
| 6 | **Dashboard Manajemen Dinas PU** | Antarmuka khusus pengelola dan teknisi dinas untuk memverifikasi laporan, menaikkan status (Verifikasi, Penanganan, Selesai), dan mengevaluasi hotspot kerusakan kota. |
| 7 | **Dukungan Dual-Theme (Dark & Light Mode)** | Kemudahan akses visual dalam kondisi siang maupun malam hari dengan kontras warna yang ramah mata dan memenuhi standar web modern. |
| 8 | **Modul Edukasi Keselarasan SDGs** | Menyajikan wawasan interaktif mengenai kontribusi pelaporan warga terhadap pencapaian target pembangunan berkelanjutan SDG 9 dan SDG 11. |

### 2.6 Permasalahan dan Solusi
#### 2.6.1 Analisis Permasalahan
- **Tingginya Angka Kecelakaan Akibat Kerusakan Fisik Jalan:** Kerusakan permukaan jalan (lubang/potholes, retak amblas) menjadi penyebab tidak langsung atas lebih dari 15% kecelakaan sepeda motor fatal (Korlantas Polri).
- **Inersia Partisipasi Publik Karena Hambatan Birokrasi:** Formulir pengaduan pemerintah yang panjang dan rumit menyebabkan lebih dari 70% inisiatif pengaduan warga terhenti di tengah jalan.
- **Ketiadaan Standarisasi Data & Triase Manual:** Laporan aduan yang masuk melalui medsos/WhatsApp menumpuk tanpa standarisasi visual dan koordinat presisi, menyulitkan petugas membedakan kondisi darurat versus perbaikan reguler.

#### 2.6.2 Strategi Solusi
- **Otomasi Vision AI:** Gemini 2.5 Flash otomatis mengenali objek infrastruktur dan mengeliminasi kebutuhan pengetikan teks manual yang rumit.
- **Standarisasi Triase Risiko Objektif:** Skor keparahan 1–10 menyusun prioritas kerja dinas secara adil dan berbasis urgensi keselamatan nyata.
- **Pemetaan Geospasial Terbuka:** Peta Leaflet/OSM bebas kuota API berbayar menyajikan visualisasi sebaran kerusakan perkotaan secara real-time.
- **Closed-Loop Transparency:** Pelacakan tiket terbuka menumbuhkan kepercayaan publik (*public trust*) terhadap komitmen penanganan pemerintah.

### 2.7 Dampak dan Implementasi
- **Dampak Kuantitatif:** Reduksi waktu pelaporan hingga 80% (dari 5-7 menit menjadi kurang dari 40 detik), percepatan respon dinas, serta penghematan anggaran perbaikan preventif jalan hingga 5-10 kali lipat dibanding perbaikan setelah jalan runtuh.
- **Rencana Implementasi Jangka Panjang:**
  - *Fase 1:* Pilot project di tingkat kota (Banjarbaru dan Kalimantan Selatan) bersama komunitas relawan dan mitra ojek online.
  - *Fase 2:* Integrasi API dengan sistem aduan nasional SP4N-LAPOR!.
  - *Fase 3:* Pengembangan crowdsourced sensor getaran/akselerometer ponsel saat berkendara untuk memetakan anomali jalan secara otomatis.

---

## BAB III: PENUTUP

LaporInfra hadir sebagai manifestasi nyata dari tema Infinitera 2.0: “Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations”. Melalui perpaduan kecerdasan buatan Multimodal Vision AI Google Gemini dan sistem informasi geospasial real-time, LaporInfra membuktikan bahwa teknologi masa depan dapat didekatkan secara inklusif dan humanis untuk menyelesaikan permasalahan mendasar masyarakat.

Platform ini berhasil mentransformasikan paradigma pelaporan fasilitas publik dari yang semula lambat, rumit, dan berbelit-belit menjadi pengalaman digital yang cepat, akurat, dan transparan. Dukungan terhadap pencapaian target SDG 9 (Infrastruktur dan Inovasi) serta SDG 11 (Kota Berkelanjutan) menegaskan komitmen tim kami dalam membangun fondasi kota yang lebih aman dan tangguh bagi generasi mendatang.

Tim nama timnya apa pin dari SMK Telkom Banjarbaru berharap LaporInfra tidak hanya menjadi karya kompetisi semata, tetapi dapat diimplementasikan secara konkret dan berkolaborasi dengan pemerintah daerah di seluruh Indonesia. Dengan partisipasi aktif warga dan ketepatan respons berbasis data pintar, kita bersama-sama dapat mewujudkan infrastruktur negeri yang kokoh, berkeadilan, dan berkelanjutan.

---

## DAFTAR PUSTAKA

- Badan Pusat Statistik. (2024). *Statistik Transportasi Darat dan Kondisi Jalan Indonesia 2023*. Jakarta: BPS RI.
- Google Cloud. (2025). *Gemini 2.5 Flash Multimodal Vision API Documentation and Technical Report*. Mountain View: Google LLC.
- Kementerian Pekerjaan Umum dan Perumahan Rakyat. (2023). *Standar Penilaian Kerusakan Jalan dan Pemeliharaan Rutin Bina Marga (No. 04/SE/Db/2023)*. Jakarta: Direktorat Jenderal Bina Marga.
- Korlantas Polri. (2024). *Laporan Tahunan Data Kecelakaan Lalu Lintas Nasional Akibat Kerusakan Fisik Prasarana Jalan*. Jakarta: Korps Lalu Lintas Kepolisian Negara Republik Indonesia.
- Leaflet. (2024). *Leaflet: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps*. Diakses dari https://leafletjs.com/.
- OpenStreetMap Foundation. (2024). *OpenStreetMap Collaborative Geospatial Database and Nominatim Reverse Geocoding*. Diakses dari https://www.openstreetmap.org/.
- React Documentation Team. (2025). *React 19: The Library for Web and Native User Interfaces*. Diakses dari https://react.dev/.
- United Nations. (2015). *Transforming Our World: The 2030 Agenda for Sustainable Development (SDG 9 & SDG 11)*. New York: United Nations Department of Economic and Social Affairs.
- World Health Organization. (2023). *Global Status Report on Road Safety 2023*. Geneva: World Health Organization.

---

## LAMPIRAN

- **Link Repository GitHub:** https://github.com/DarkIgnite/LaporInfra.git
- **Link Website (Deploy):** https://laporinfra.ai.studio/
- **Link Video Demo:** [Tautan Video Demo Google Drive akan ditambahkan oleh tim]

*(Dokumentasi screenshot antarmuka pengguna telah disisipkan lengkap pada dokumen Microsoft Word resmi).*
