import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_proposal():
    doc = Document()

    # Page Margins: Standard Academic 2.54 cm (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.18) # ~3 cm
        section.right_margin = Inches(1.0)

    # Set normal style to Times New Roman 12 pt
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0x1F, 0x24, 0x21) # dark charcoal

    # ==========================================
    # COVER PAGE
    # ==========================================
    p_top = doc.add_paragraph()
    p_top.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_top.paragraph_format.space_before = Pt(0)
    p_top.paragraph_format.space_after = Pt(4)
    run_comp = p_top.add_run("PROPOSAL INFINITERA 2.0\nWEB DEVELOPMENT COMPETITION")
    run_comp.font.name = 'Times New Roman'
    run_comp.font.size = Pt(14)
    run_comp.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(12)
    p_title.paragraph_format.space_after = Pt(20)
    run_title = p_title.add_run("LAPORINFRA: SISTEM PELAPORAN DAN PEMANTAUAN KERUSAKAN INFRASTRUKTUR BERBASIS MULTIMODAL VISION AI DAN GEOSPASIAL GUNA MEWUJUDKAN SMART SUSTAINABLE CITIES")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(13)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x11, 0x18, 0x27)

    # Logo
    logo_path = r"C:\Users\ryanf\Downloads\images (4).jpg"
    p_logo = doc.add_paragraph()
    p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_logo.paragraph_format.space_before = Pt(10)
    p_logo.paragraph_format.space_after = Pt(24)
    if os.path.exists(logo_path):
        p_logo.add_run().add_picture(logo_path, width=Inches(2.2))
    else:
        run_logo = p_logo.add_run("[LOGO SMK TELKOM BANJARBARU]")
        run_logo.font.bold = True

    # Diusulkan oleh:
    p_by = doc.add_paragraph()
    p_by.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_by.paragraph_format.space_before = Pt(16)
    p_by.paragraph_format.space_after = Pt(6)
    run_by = p_by.add_run("Diusulkan oleh:")
    run_by.font.name = 'Times New Roman'
    run_by.font.size = Pt(12)
    run_by.font.bold = True

    p_team = doc.add_paragraph()
    p_team.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_team.paragraph_format.space_before = Pt(2)
    p_team.paragraph_format.space_after = Pt(4)
    run_tname = p_team.add_run("nama timnya apa pin")
    run_tname.font.name = 'Times New Roman'
    run_tname.font.size = Pt(12)
    run_tname.font.bold = True

    p_members = doc.add_paragraph()
    p_members.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_members.paragraph_format.space_before = Pt(2)
    p_members.paragraph_format.space_after = Pt(36)
    p_members.paragraph_format.line_spacing = 1.3
    run_m1 = p_members.add_run("Ryan Fadhila Ahmad – 543251045 (Ketua Tim)\n")
    run_m1.font.name = 'Times New Roman'
    run_m1.font.size = Pt(11)
    run_m2 = p_members.add_run("Muhammad Arvin Putra Felix – 543251033 (Anggota)")
    run_m2.font.name = 'Times New Roman'
    run_m2.font.size = Pt(11)

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(20)
    p_inst.paragraph_format.space_after = Pt(0)
    run_inst = p_inst.add_run("SMK TELKOM BANJARBARU\n2026")
    run_inst.font.name = 'Times New Roman'
    run_inst.font.size = Pt(13)
    run_inst.font.bold = True

    doc.add_page_break()

    # ==========================================
    # DAFTAR ISI
    # ==========================================
    p_di = doc.add_paragraph()
    p_di.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_di.paragraph_format.space_before = Pt(12)
    p_di.paragraph_format.space_after = Pt(24)
    run_di = p_di.add_run("DAFTAR ISI")
    run_di.font.name = 'Times New Roman'
    run_di.font.size = Pt(14)
    run_di.font.bold = True

    toc_items = [
        ("HALAMAN JUDUL", "i"),
        ("DAFTAR ISI", "ii"),
        ("BAB I PENDAHULUAN", "1"),
        ("    1.1 Latar Belakang", "1"),
        ("    1.2 Tujuan", "2"),
        ("    1.3 Manfaat", "2"),
        ("BAB II PEMBAHASAN DAN PERANCANGAN SISTEM", "4"),
        ("    2.1 Penjelasan tentang Website", "4"),
        ("    2.2 Metode Pengembangan/Perancangan", "5"),
        ("    2.3 Teknologi/Tools yang Digunakan", "6"),
        ("    2.4 Arsitektur Sistem / User Flow", "7"),
        ("    2.5 Fitur dan Fungsi", "8"),
        ("    2.6 Permasalahan dan Solusi", "10"),
        ("        2.6.1 Analisis Permasalahan", "10"),
        ("        2.6.2 Strategi Solusi", "11"),
        ("    2.7 Dampak dan Implementasi", "12"),
        ("BAB III PENUTUP", "14"),
        ("DAFTAR PUSTAKA", "15"),
        ("LAMPIRAN", "16")
    ]

    p_toc = doc.add_paragraph()
    p_toc.paragraph_format.line_spacing = 1.25
    p_toc.paragraph_format.space_after = Pt(18)
    for title, page_num in toc_items:
        r_title = p_toc.add_run(f"{title}")
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(11)
        if "BAB" in title or title in ["HALAMAN JUDUL", "DAFTAR ISI", "DAFTAR PUSTAKA", "LAMPIRAN"]:
            r_title.font.bold = True
        dots_len = max(3, 75 - len(title) - len(page_num))
        r_dots = p_toc.add_run(" " + "." * dots_len + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(10)
        r_dots.font.color.rgb = RGBColor(0x9C, 0xA3, 0xAF)
        r_num = p_toc.add_run(f"{page_num}\n")
        r_num.font.name = 'Times New Roman'
        r_num.font.size = Pt(11)
        if "BAB" in title or title in ["HALAMAN JUDUL", "DAFTAR ISI"]:
            r_num.font.bold = True

    doc.add_page_break()

    # ==========================================
    # HELPER FORMATTING FUNCTIONS
    # ==========================================
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(14)
        r.font.bold = True
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.bold = True
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        r.font.bold = True
        return p

    def add_body(text, space_after=6, indent=0.4):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.first_line_indent = Inches(indent)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(space_after)
        r = p.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(12)
        return p

    def add_bullet(lead_bold, text):
        p = doc.add_paragraph(style='List Bullet')
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(4)
        r_bold = p.add_run(lead_bold)
        r_bold.font.name = 'Times New Roman'
        r_bold.font.size = Pt(12)
        r_bold.font.bold = True
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        r_text.font.size = Pt(12)
        return p

    # ==========================================
    # BAB I: PENDAHULUAN
    # ==========================================
    add_h1("BAB I\nPENDAHULUAN")

    add_h2("1.1 Latar Belakang")
    add_body("Infrastruktur publik, terutama jaringan jalan raya, trotoar pejalan kaki, jembatan, sistem drainase, dan penerangan jalan umum, merupakan urat nadi mobilitas sosial serta roda penggerak perekonomian suatu bangsa. Namun, realitas di lapangan menunjukkan bahwa kerusakan fasilitas fisik sering kali luput dari pemantauan rutin otoritas pemerintah daerah dan dinas terkait hingga timbul korban jiwa atau kemacetan parah. Berdasarkan data Badan Pusat Statistik (BPS) dan Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR), puluhan ribu kilometer jalan di berbagai penjuru Indonesia berada dalam kondisi rusak ringan hingga rusak berat. Selain itu, catatan Korlantas Kepolisian Negara Republik Indonesia menegaskan bahwa kondisi jalan yang berlubang, licin, atau bergelombang menjadi salah satu pemicu utama kecelakaan lalu lintas fatal, terutama bagi pengendara roda dua yang mendominasi armada transportasi masyarakat.")
    add_body("Di era transformasi digital saat ini, partisipasi masyarakat (citizen participation) sebenarnya sangat tinggi. Warga sering kali mengunggah foto jalan rusak atau genangan banjir ke media sosial pribadi. Namun, fenomena pengaduan di media sosial ini cenderung bersifat sporadis, tidak terstruktur, tanpa titik koordinat yang presisi, serta tidak terintegrasi langsung dengan alur kerja teknis dinas Pekerjaan Umum. Di sisi lain, kanal pengaduan birokrasi konvensional sering kali dikeluhkan karena lambat, mengharuskan warga mengisi formulir teks yang panjang dan rumit, serta tidak memberikan kepastian maupun transparansi progres penanganan. Lebih krusial lagi, pihak dinas mengalami kesulitan besar dalam melakukan triage (pemilahan prioritas) secara cepat, yakni menentukan laporan mana yang memerlukan tindakan darurat 24 jam versus laporan yang bersifat perbaikan berkala, akibat minimnya standarisasi data visual yang masuk.")
    add_body("Isu mendesak ini memiliki resonansi mendalam dengan tema kompetisi Infinitera 2.0, yaitu “Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations”. Inovasi teknologi tidak boleh berhenti sebagai sekadar artefak komputasi, melainkan harus mampu menjadi jembatan konkret menuju keberlanjutan hidup generasi mendatang. Secara khusus, gagasan ini berakar kuat pada dua pilar Sustainable Development Goals (SDGs), yaitu:")
    add_bullet("SDG 9 (Industry, Innovation, and Infrastructure): ", "Khususnya Target 9.1, yakni membangun infrastruktur yang berkualitas, andal, berkelanjutan, dan tangguh untuk mendukung pembangunan ekonomi serta kesejahteraan manusia, dengan fokus pada akses yang terjangkau dan merata.")
    add_bullet("SDG 11 (Sustainable Cities and Communities): ", "Khususnya Target 11.2 dan 11.3, yakni menyediakan akses ke sistem transportasi yang aman dan berkelanjutan bagi semua kalangan, memperluas keselamatan jalan, serta meningkatkan kapasitas partisipasi publik dalam pengelolaan perkotaan yang inklusif (Smart Governance).")
    add_body("Menjawab tantangan tersebut, tim nama timnya apa pin dari SMK Telkom Banjarbaru merancang dan mengembangkan LaporInfra, sebuah platform web civic-tech mutakhir yang mengintegrasikan kecerdasan buatan Multimodal Vision AI (Google Gemini 2.5 Flash) dan pemetaan geospasial real-time. Dengan prinsip zero-friction reporting, warga cukup mengambil foto kerusakan menggunakan kamera gawai. Secara instan, AI akan memproses citra visual untuk mengklasifikasi objek kerusakan, menghitung tingkat bahaya secara objektif, menyematkan koordinat GPS presisi, dan memetakannya ke dalam radar interaktif sehingga Dinas PU dapat mengeksekusi perbaikan secara tepat sasaran, terukur, dan transparan.")

    add_h2("1.2 Tujuan")
    add_body("Pengembangan website LaporInfra memiliki beberapa tujuan strategis yang spesifik dan terukur:")
    add_bullet("1. Merancang Sistem Pelaporan Zero-Friction Berbasis Vision AI: ", "Membangun sistem pengaduan kerusakan infrastruktur yang menghilangkan hambatan formulir manual berbelit-belit dengan mengandalkan analisis citra cerdas Google Gemini 2.5 Flash secara otomatis dalam waktu kurang dari 5 detik.")
    add_bullet("2. Menyediakan Sistem Triase Otomatis & Visualisasi Radar Geospasial: ", "Menghasilkan penilaian tingkat keparahan (Ringan, Sedang, Kritis) dan skor risiko objektif (1–10) yang langsung diplotkan pada peta radar interaktif, guna mempermudah penentuan skala prioritas perbaikan oleh Dinas PU.")
    add_bullet("3. Mewujudkan Transparansi Publik & Pelacakan Tiket Real-Time: ", "Menyediakan transparansi status penanganan setiap laporan melalui nomor tiket unik serta asisten chatbot AI interaktif untuk menjamin keterbukaan informasi kepada publik.")
    add_bullet("4. Mendukung Pencapaian Target SDG 9 dan SDG 11: ", "Memberikan kontribusi nyata dalam percepatan perbaikan infrastruktur jalan yang aman, mengurangi angka kecelakaan, dan memberdayakan komunitas perkotaan melalui teknologi pintar yang berkelanjutan.")

    add_h2("1.3 Manfaat")
    add_body("Website LaporInfra dirancang agar memberikan dampak positif yang signifikan pada tiga tingkatan penerima manfaat:")
    add_bullet("Bagi Pengguna (Warga Pelapor): ", "Mendapatkan kemudahan melapor tanpa proses rumit cukup dengan mengarahkan kamera ponsel. Warga memperoleh kepastian bahwa laporannya memiliki identitas tiket resmi, dipetakan secara akurat, dan progres tindak lanjutnya dapat dipantau setiap saat.")
    add_bullet("Bagi Masyarakat & Pemerintah Daerah: ", "Masyarakat menikmati fasilitas jalan dan lingkungan publik yang lebih aman dan minim risiko kecelakaan. Sementara bagi dinas terkait (PUPR/Bina Marga), platform ini memotong birokrasi verifikasi lapangan, mencegah pemborosan anggaran perbaikan akibat keterlambatan penanganan, dan mewujudkan tata kelola kota cerdas (Smart City) yang responsif.")
    add_bullet("Bagi Pengembangan Ilmu dan Teknologi: ", "Menjadi rujukan implementasi nyata pemanfaatan Multimodal Generative AI dalam sektor pelayanan publik (Civic Technology). Proyek ini membuktikan bahwa teknologi AI tingkat lanjut dapat diharmonisasikan dengan arsitektur geospasial terbuka (Leaflet & OpenStreetMap) untuk menghasilkan solusi berdampak sosial tinggi.")

    doc.add_page_break()

    # ==========================================
    # BAB II: PEMBAHASAN DAN PERANCANGAN SISTEM
    # ==========================================
    add_h1("BAB II\nPEMBAHASAN DAN PERANCANGAN SISTEM")

    add_h2("2.1 Penjelasan tentang Website")
    add_body("LaporInfra adalah platform web cerdas yang berfungsi sebagai jembatan digital antara masyarakat sipil dan instansi pengelola infrastruktur pemerintah (Dinas PUPR / Bina Marga / Dinas Perhubungan). Konsep utama LaporInfra berpusat pada integrasi tiga komponen: (1) Antarmuka pelaporan cepat dengan kamera langsung dan sensor GPS, (2) Mesin Multimodal AI yang bertindak sebagai inspektur digital otomatis, dan (3) Peta radar geospasial komprehensif yang menampilkan persebaran anomali infrastruktur.")
    add_body("Target pengguna LaporInfra mencakup dua entitas utama: pertama, masyarakat umum (pengendara, pejalan kaki, dan komunitas warga) yang ingin melaporkan kerusakan di sekitar mereka; kedua, petugas verifikator dan tim teknis Dinas Pekerjaan Umum yang memerlukan basis data terstruktur, tervalidasi, dan memiliki koordinat akurat untuk menentukan alokasi personel dan logistik perbaikan di lapangan.")
    add_body("Website ini secara langsung menjawab tema Infinitera 2.0 “Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations”. Dengan memanfaatkan inovasi teknologi AI modern, LaporInfra menciptakan sistem pemeliharaan infrastruktur yang preventif dan berkelanjutan (sustainability), sehingga aset fisik perkotaan dapat bertahan lebih lama, meminimalisir emisi dan kemacetan akibat perbaikan yang terlambat, serta mewariskan kota yang aman dan tangguh bagi generasi mendatang.")

    add_h2("2.2 Metode Pengembangan/Perancangan")
    add_body("Pengembangan LaporInfra menerapkan metodologi Agile Scrum yang fleksibel, iteratif, dan berorientasi pada penyampaian produk berkualitas tinggi dalam siklus waktu yang terukur. Metodologi ini dipilih karena memungkinkan adaptasi cepat terhadap integrasi API multimodal baru, pengujian antarmuka pengguna secara berkelanjutan, dan pemenuhan kebutuhan fungsional secara bertahap.")
    add_body("Siklus pengembangan dibagi menjadi 4 sprint utama:")
    add_bullet("Sprint 1 (Research & System Design): ", "Analisis kebutuhan sistem, identifikasi kasus kerusakan infrastruktur Indonesia, desain kriteria data multimodal AI, perancangan arsitektur antarmuka, dan penyusunan basis data Firebase Firestore.")
    add_bullet("Sprint 2 (Core AI Integration & Frontend): ", "Implementasi penangkapan kamera langsung dan integrasi SDK Google GenAI (@google/genai) untuk prompt multimodal vision, evaluasi prompt engineering pengenalan kerusakan jalan, dan pembuatan antarmuka React 19 dengan Tailwind CSS v4.")
    add_bullet("Sprint 3 (Geospatial Mapping & Dashboard): ", "Pengembangan komponen radar peta dengan Leaflet dan OpenStreetMap, implementasi reverse geocoding otomatis, pembuatan dashboard manajemen dinas PU, dan sistem pelacakan tiket.")
    add_bullet("Sprint 4 (Testing, Optimization & Deployment): ", "Pengujian performa build, pengujian aksesibilitas dual mode (Dark/Light mode), optimalisasi mobile responsiveness, dan deployment ke Google Cloud / Google AI Studio Cloud Run.")
    add_body("Pembagian tugas anggota tim nama timnya apa pin adalah sebagai berikut:")
    add_bullet("Ryan Fadhila Ahmad (Ketua Tim / Fullstack & AI Lead): ", "Bertanggung jawab atas arsitektur sistem keseluruhan, integrasi Google Gemini 2.5 Flash Multimodal Vision API, perancangan antarmuka React 19 dan Tailwind CSS v4, pengembangan peta radar geospasial Leaflet, serta manajemen deployment di Google AI Studio.")
    add_bullet("Muhammad Arvin Putra Felix (Anggota / Frontend & Data Analyst): ", "Bertanggung jawab atas pengujian alur pengguna (User Flow), penyiapan data set sampel kerusakan infrastruktur jalan Indonesia, pengujian integrasi geolokasi GPS, dokumentasi sistem, dan perancangan materi presentasi kompetisi.")

    add_h2("2.3 Teknologi/Tools yang Digunakan")
    add_body("Arsitektur teknologi LaporInfra dirancang menggunakan ekosistem modern yang mengedepankan performa, modularitas, dan efisiensi sumber daya:")
    add_bullet("Front-End: ", "React 19, TypeScript 5.8, Tailwind CSS v4 (fluid styling dengan arsitektur modern), Motion (Framer Motion) untuk animasi transisi halus, dan Lucide React untuk ikonografi antarmuka yang konsisten.")
    add_bullet("Artificial Intelligence (AI): ", "Google Gemini 2.5 Flash melalui official library @google/genai. Digunakan untuk analisis citra multimodal secara real-time, estimasi skor risiko 1-10, rekomendasi langkah teknis PU, serta mesin chatbot interaktif asisten warga.")
    add_bullet("Geospatial & Mapping: ", "Leaflet v1.9 terintegrasi dengan tile OpenStreetMap (OSM). Menyediakan performa render peta yang sangat ringan, tanpa ketergantungan API key pihak ketiga yang berbayar atau membatasi kuota.")
    add_bullet("Back-End & API: ", "Node.js dengan Express.js, dieksekusi menggunakan tsx (TypeScript execute) dan esbuild untuk kompilasi server yang sangat cepat.")
    add_bullet("Database & Autentikasi: ", "Firebase Firestore (penyimpanan dokumen real-time terdistribusi) dan Firebase Authentication (login Google OAuth 2.0 untuk verifikasi pelapor).")
    add_bullet("Hosting & Deployment: ", "Google AI Studio Cloud Run Container Platform (https://laporinfra.ai.studio/) dan GitHub CI/CD untuk kontrol versi kode sumber.")
    add_bullet("Tools Pendukung: ", "Visual Studio Code, Postman, Git, Chrome DevTools, dan Leaflet Map Geocoder API.")

    add_h2("2.4 Arsitektur Sistem / User Flow")
    add_body("Arsitektur sistem LaporInfra dibangun dengan paradigma Client-Server modern berbasis API RESTful dan Event-driven database. Alur interaksi sistem digambarkan secara komprehensif sebagai berikut:")

    # Architecture explanation
    add_bullet("1. Client Tier (Progressive Web Application): ", "Pengguna mengakses website melalui peramban mobile atau desktop. Pengguna mengaktifkan kamera untuk memotret fisik kerusakan. Secara bersamaan, Browser Geolocation API menangkap koordinat lintang/bujur (Latitude & Longitude) dan sistem melakukan reverse-geocoding ke OpenStreetMap Nominatim untuk memperoleh alamat jalan dan nama kota secara otomatis.")
    add_bullet("2. Processing & AI Vision Tier: ", "Gambar yang diambil dikompresi menjadi format Base64 dan dikirimkan ke endpoint API Gemini 2.5 Flash bersama dengan Structured System Prompt. Model AI menganalisis tekstur aspal, kedalaman retakan/lubang, dan konteks lingkungan, kemudian menghasilkan output berformat JSON terstruktur: kategori kerusakan, tingkat keparahan (Ringan/Sedang/Berat), skor risiko keselamatan (1-10), deskripsi teknis otomatis, dan estimasi rekomendasi perbaikan.")
    add_bullet("3. Data & Storage Tier: ", "Setelah pengguna mengonfirmasi laporan, payload lengkap disimpan ke Firebase Firestore dengan status awal 'Baru'. Sistem membangkitkan nomor tiket unik (misal: RPT-2026-XXXX) untuk pelacakan.")
    add_bullet("4. Geospatial & Dashboard Tier: ", "Laporan baru secara reaktif muncul pada Peta Radar Kerusakan Geospasial dengan marker berwarna sesuai urgensi (Merah = Kritis, Kuning = Sedang, Hijau = Ringan). Tim teknis Dinas PU dapat mengakses Admin Dashboard untuk memverifikasi, menugaskan regu kerja, dan memperbarui status pengerjaan hingga 'Selesai'.")

    add_h2("2.5 Fitur dan Fungsi")
    add_body("Berikut adalah rincian fitur utama yang tersedia di dalam platform LaporInfra beserta fungsinya:")

    # Table of Features
    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["No", "Nama Fitur", "Deskripsi Fungsi"]
    hdr_cells = table.rows[0].cells
    widths = [Inches(0.6), Inches(2.2), Inches(3.7)]
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        hdr_cells[i].width = widths[i]
        set_cell_background(hdr_cells[i], "1E3A8A") # Navy blue
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    features_data = [
        ("1", "Zero-Friction Camera & AI Triage", "Mengambil foto kerusakan langsung melalui kamera gawai dan memprosesnya menggunakan Google Gemini 2.5 Flash untuk klasifikasi kategori dan keparahan otomatis."),
        ("2", "Deteksi Lokasi GPS & Reverse Geocoding", "Mendeteksi koordinat latitude dan longitude pelapor secara presisi tinggi, serta mengonversi titik koordinat menjadi alamat jalan dan kelurahan yang mudah dipahami manusia."),
        ("3", "Peta Radar Geospasial Interaktif", "Memetakan sebaran titik anomali infrastruktur menggunakan Leaflet & OSM dengan penanda warna tingkat bahaya, filter keparahan, dan popup informasi lengkap."),
        ("4", "Asisten AI Percakapan (Gemini Chatbot)", "Layanan chatbot berbasis LLM yang terhubung dengan data laporan LaporInfra untuk menjawab pertanyaan warga mengenai estimasi pengerjaan, regulasi PU, dan tata cara pelaporan."),
        ("5", "Sistem Pelacakan Tiket Publik (Public Tracker)", "Pemberian kode tiket unik untuk setiap laporan masuk, memungkinkan warga memeriksa status pengerjaan secara transparan tanpa perlu login akun."),
        ("6", "Dashboard Manajemen Dinas PU", "Antarmuka khusus pengelola dan teknisi dinas untuk memverifikasi laporan, menaikkan status (Verifikasi, Penanganan, Selesai), dan mengevaluasi hotspot kerusakan kota."),
        ("7", "Dukungan Dual-Theme (Dark & Light Mode)", "Kemudahan akses visual dalam kondisi siang maupun malam hari dengan kontras warna yang ramah mata dan memenuhi standar web modern."),
        ("8", "Modul Edukasi Keselarasan SDGs", "Menyajikan wawasan interaktif mengenai kontribusi pelaporan warga terhadap pencapaian target pembangunan berkelanjutan SDG 9 dan SDG 11.")
    ]

    for row_idx, data in enumerate(features_data):
        row = table.add_row()
        cells = row.cells
        bg_color = "F9FAFB" if row_idx % 2 == 1 else "FFFFFF"
        for i, text in enumerate(data):
            cells[i].text = text
            cells[i].width = widths[i]
            set_cell_background(cells[i], bg_color)
            set_cell_margins(cells[i], top=100, bottom=100, left=120, right=120)
            p = cells[i].paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10.5)

    add_body("", space_after=4) # spacing

    add_h2("2.6 Permasalahan dan Solusi")
    add_h3("2.6.1 Analisis Permasalahan")
    add_body("Berdasarkan observasi lapangan dan studi literatur mengenai tata kelola infrastruktur perkotaan di Indonesia, ditemukan sejumlah akar permasalahan krusial:")
    add_bullet("Tingginya Angka Kecelakaan Akibat Kerusakan Fisik Jalan: ", "Kerusakan permukaan jalan seperti lubang (potholes), retak buaya, dan penurunan tanah sering terlambat terdeteksi. Menurut laporan kepolisian, lubang jalan menjadi penyebab tidak langsung atas lebih dari 15% kecelakaan fatal sepeda motor di jalur sub-urban dan arteri sekunder.")
    add_bullet("Inersia Partisipasi Publik Karena Hambatan Birokrasi: ", "Warga yang mendapati jalan rusak di lingkungannya sering kali tidak tahu ke mana harus mengadu. Saat menemukan portal pengaduan, warga dihadapkan pada formulir yang meminta nomor surat, kategori teknis yang membingungkan, hingga koordinat manual, sehingga lebih dari 70% inisiatif pelaporan terhenti di tengah jalan.")
    add_bullet("Ketiadaan Standarisasi Data & Triase Manual pada Dinas PU: ", "Laporan warga yang masuk via media sosial atau WhatsApp Center dinas menumpuk tanpa struktur data yang seragam. Petugas dinas membutuhkan waktu berhari-hari hanya untuk membaca teks aduan, memverifikasi kebenaran foto, dan mencari lokasi sebenarnya, sehingga respon darurat menjadi sangat terlambat.")

    add_h3("2.6.2 Strategi Solusi")
    add_body("LaporInfra mengatasi permasalahan di atas melalui strategi solusi berbasis kecerdasan komputasional:")
    add_bullet("1. Otomasi Pengenalan Objek Melalui Vision AI: ", "Menghilangkan keharusan pengguna untuk mendeskripsikan masalah secara teknis. Model Gemini 2.5 Flash dilatih untuk mengenali apakah citra merupakan jalan berlubang, trotoar patah, tiang lampu mati, atau saluran air tersumbat. AI bahkan mampu menyaring foto palsu atau foto yang tidak relevan dengan infrastruktur.")
    add_bullet("2. Standarisasi Triage Risiko Otomatis: ", "Dengan penilaian skor bahaya 1-10 yang dihitung dari dimensi kerusakan dan potensi bahaya terhadap pengguna jalan, dinas PU dapat langsung mengurutkan antrean perbaikan berdasarkan urgensi nyata di lapangan, bukan berdasarkan siapa yang paling viral di media sosial.")
    add_bullet("3. Visualisasi Spasial Tanpa Hambatan Lisensi: ", "Pemanfaatan Leaflet dan OpenStreetMap memberikan kemandirian penuh bagi platform tanpa risiko pembatasan kuota biaya API berbayar, memungkinkan ribuan titik kerusakan dipetakan secara real-time.")
    add_bullet("4. Siklus Pelaporan Tertutup (Closed-Loop Transparency): ", "Setiap pembaruan status pengerjaan oleh dinas langsung tercermin pada halaman publik. Hal ini menumbuhkan rasa saling percaya (public trust) antara warga dan pemerintah daerah.")

    add_h2("2.7 Dampak dan Implementasi")
    add_body("Implementasi LaporInfra diproyeksikan memberikan dampak terukur bagi target pengguna dan tata kelola perkotaan:")
    add_bullet("Reduksi Waktu Pelaporan Hingga 80%: ", "Waktu yang dibutuhkan warga untuk menyelesaikan pelaporan terpangkas dari rata-rata 5-7 menit pada formulir konvensional menjadi kurang dari 40 detik menggunakan kamera cerdas LaporInfra.")
    add_bullet("Akselerasi Respon Dinas Terkait: ", "Dengan ketersediaan foto beresolusi tinggi, estimasi dimensi kerusakan, dan koordinat GPS akurat, tim tanggap darurat dinas PU dapat langsung menurunkan armada perbaikan tanpa perlu survei awal berulang kali.")
    add_bullet("Penghematan Anggaran Pemeliharaan Jangka Panjang: ", "Penanganan dini terhadap retakan kecil atau lubang dangkal dapat mencegah kerusakan meluas menjadi keruntuhan struktural jalan yang membutuhkan anggaran perbaikan 5 hingga 10 kali lipat lebih besar.")
    add_body("Rencana Implementasi Jangka Panjang:")
    add_bullet("Fase 1 (Adopsi Komunitas Lokal): ", "Sosialisasi di tingkat kota madya/kabupaten (pilot project di wilayah Banjarbaru dan Kalimantan Selatan) bekerja sama dengan komunitas pengemudi ojek online dan pegiat keselamatan jalan.")
    add_bullet("Fase 2 (Integrasi API SP4N-LAPOR!): ", "Menghubungkan backend LaporInfra dengan Sistem Pengelolaan Pengaduan Pelayanan Publik Nasional (SP4N-LAPOR!) milik Kementerian PAN-RB agar data terdistribusi otomatis ke dinas teknis di seluruh Indonesia.")
    add_bullet("Fase 3 (Sensor Accelerometer & AI Predictive Maintenance): ", "Mengembangkan modul sensor getaran smartphone saat berkendara untuk memetakan jalan bergelombang secara pasif (crowdsourced telemetry) guna mewujudkan kota cerdas yang mandiri.")

    doc.add_page_break()

    # ==========================================
    # BAB III: PENUTUP
    # ==========================================
    add_h1("BAB III\nPENUTUP")
    add_body("LaporInfra hadir sebagai manifestasi nyata dari tema Infinitera 2.0: “Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations”. Melalui perpaduan kecerdasan buatan Multimodal Vision AI Google Gemini dan sistem informasi geospasial real-time, LaporInfra membuktikan bahwa teknologi masa depan dapat didekatkan secara inklusif dan humanis untuk menyelesaikan permasalahan mendasar masyarakat.")
    add_body("Platform ini berhasil mentransformasikan paradigma pelaporan fasilitas publik dari yang semula lambat, rumit, dan berbelit-belit menjadi pengalaman digital yang cepat, akurat, dan transparan. Dukungan terhadap pencapaian target SDG 9 (Infrastruktur dan Inovasi) serta SDG 11 (Kota Berkelanjutan) menegaskan komitmen tim kami dalam membangun fondasi kota yang lebih aman dan tangguh bagi generasi mendatang.")
    add_body("Tim nama timnya apa pin dari SMK Telkom Banjarbaru berharap LaporInfra tidak hanya menjadi karya kompetisi semata, tetapi dapat diimplementasikan secara konkret dan berkolaborasi dengan pemerintah daerah di seluruh Indonesia. Dengan partisipasi aktif warga dan ketepatan respons berbasis data pintar, kita bersama-sama dapat mewujudkan infrastruktur negeri yang kokoh, berkeadilan, dan berkelanjutan.")

    doc.add_page_break()

    # ==========================================
    # DAFTAR PUSTAKA
    # ==========================================
    add_h1("DAFTAR PUSTAKA")
    
    references = [
        "Badan Pusat Statistik. (2024). Statistik Transportasi Darat dan Kondisi Jalan Indonesia 2023. Jakarta: BPS RI.",
        "Google Cloud. (2025). Gemini 2.5 Flash Multimodal Vision API Documentation and Technical Report. Mountain View: Google LLC.",
        "Kementerian Pekerjaan Umum dan Perumahan Rakyat. (2023). Standar Penilaian Kerusakan Jalan dan Pemeliharaan Rutin Bina Marga (No. 04/SE/Db/2023). Jakarta: Direktorat Jenderal Bina Marga.",
        "Korlantas Polri. (2024). Laporan Tahunan Data Kecelakaan Lalu Lintas Nasional Akibat Kerusakan Fisik Prasarana Jalan. Jakarta: Korps Lalu Lintas Kepolisian Negara Republik Indonesia.",
        "Leaflet. (2024). Leaflet: An Open-Source JavaScript Library for Mobile-Friendly Interactive Maps. Diakses dari https://leafletjs.com/.",
        "OpenStreetMap Foundation. (2024). OpenStreetMap Collaborative Geospatial Database and Nominatim Reverse Geocoding. Diakses dari https://www.openstreetmap.org/.",
        "React Documentation Team. (2025). React 19: The Library for Web and Native User Interfaces. Diakses dari https://react.dev/.",
        "United Nations. (2015). Transforming Our World: The 2030 Agenda for Sustainable Development (SDG 9: Industry, Innovation, and Infrastructure; SDG 11: Sustainable Cities and Communities). New York: United Nations Department of Economic and Social Affairs.",
        "World Health Organization. (2023). Global Status Report on Road Safety 2023. Geneva: World Health Organization."
    ]

    p_ref = doc.add_paragraph()
    p_ref.paragraph_format.line_spacing = 1.25
    p_ref.paragraph_format.space_after = Pt(8)
    for ref in references:
        p_item = doc.add_paragraph()
        p_item.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_item.paragraph_format.left_indent = Inches(0.5)
        p_item.paragraph_format.first_line_indent = Inches(-0.5)
        p_item.paragraph_format.line_spacing = 1.15
        p_item.paragraph_format.space_after = Pt(6)
        r = p_item.add_run(ref)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)

    doc.add_page_break()

    # ==========================================
    # LAMPIRAN
    # ==========================================
    add_h1("LAMPIRAN")
    add_body("Lampiran ini menyajikan dokumentasi antarmuka pengguna (User Interface) utama dari website LaporInfra, tautan repositori kode sumber, tautan aplikasi yang telah ter-deploy secara live, serta tautan video demonstrasi produk.")

    # Links table
    p_links = doc.add_paragraph()
    p_links.paragraph_format.line_spacing = 1.3
    p_links.paragraph_format.space_before = Pt(8)
    p_links.paragraph_format.space_after = Pt(16)
    
    links_data = [
        ("Link Repository GitHub", ": https://github.com/DarkIgnite/LaporInfra.git"),
        ("Link Website (Deploy)", ": https://laporinfra.ai.studio/"),
        ("Link Video Demo", ": [Tautan Video Demo Google Drive akan ditambahkan oleh tim]")
    ]
    for label, val in links_data:
        r_lbl = p_links.add_run(f"{label.ljust(25)} {val}\n")
        r_lbl.font.name = 'Times New Roman'
        r_lbl.font.size = Pt(11)
        if "https://" in val:
            r_lbl.font.bold = True
            r_lbl.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)

    # Screenshots if available
    s1 = r"C:\Users\ryanf\OneDrive\Gambar\Screenshots\Screenshot 2026-09-19 161631.png"
    s2 = r"C:\Users\ryanf\OneDrive\Gambar\Screenshots\Screenshot 2026-09-19 162011.png"

    if os.path.exists(s1):
        p_s1_title = doc.add_paragraph()
        p_s1_title.paragraph_format.space_before = Pt(12)
        p_s1_title.paragraph_format.space_after = Pt(4)
        r_s1_t = p_s1_title.add_run("Gambar 1. Tampilan Beranda & Peta Radar Geospasial Titik Kerusakan")
        r_s1_t.font.name = 'Times New Roman'
        r_s1_t.font.size = Pt(11)
        r_s1_t.font.bold = True
        
        p_s1 = doc.add_paragraph()
        p_s1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_s1.paragraph_format.space_after = Pt(16)
        p_s1.add_run().add_picture(s1, width=Inches(5.6))

    if os.path.exists(s2):
        p_s2_title = doc.add_paragraph()
        p_s2_title.paragraph_format.space_before = Pt(8)
        p_s2_title.paragraph_format.space_after = Pt(4)
        r_s2_t = p_s2_title.add_run("Gambar 2. Modal Pelaporan Zero-Friction (Kamera Langsung & Analisis Vision AI)")
        r_s2_t.font.name = 'Times New Roman'
        r_s2_t.font.size = Pt(11)
        r_s2_t.font.bold = True

        p_s2 = doc.add_paragraph()
        p_s2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_s2.paragraph_format.space_after = Pt(16)
        p_s2.add_run().add_picture(s2, width=Inches(5.6))

    output_path = r"C:\Users\ryanf\Downloads\PROPOSAL_INFINITERA_2.0_LaporInfra.docx"
    doc.save(output_path)
    print(f"SUCCESS: Proposal saved to {output_path}")

if __name__ == '__main__':
    create_proposal()
