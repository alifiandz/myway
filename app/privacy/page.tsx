import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy & Support | MyWay" };

const notices = [
  {
    lang: "en", title: "Privacy & support", updated: "Updated 14 October 2026",
    operator: "MyWay is operated by Alifian Dzaky Makarim.", contact: "Support, privacy and deletion requests",
    sections: [
      ["Account and planning data", "Your email, account identity and authentication records are stored by Supabase. Your profile, saved universities, application choices, tasks, preferences and progress are stored in MyWay’s Supabase database and sync between signed-in devices. Browser storage also keeps your session and a local planning cache. Authentication is handled by Supabase; your password is not stored in plain text by MyWay."],
      ["Document files stay on your device", "Uploaded planning document contents remain in this browser’s local storage (IndexedDB). They are not uploaded to the account database, do not sync to another device, and are excluded from server backups. Download your own copies before clearing browser data or changing devices. This is different from an optional screenshot you explicitly attach to feedback."],
      ["Feedback and service operation", "Feedback submissions, optional contact details and page context are stored in the existing Sites database. Optional feedback screenshots are stored separately in Sites object storage. Avoid attaching sensitive documents or passwords. MyWay uses ChatGPT Sites hosting, Supabase accounts/database, and UptimeRobot for availability monitoring. Hosting and service providers may process technical request information to operate and secure these services."],
      ["Encrypted backups", "Scoped server backups contain Supabase public, auth and migration data and available Sites feedback records, and are encrypted before upload to a private Google Drive folder controlled by the operator. Browser-local document contents are excluded. Screenshot-object backup is not yet supported, and this is not a complete service backup. The downloaded archive has passed checksum, decryption and integrity checks; an isolated restore rehearsal has not been performed."],
      ["Retention: intended policy and current behavior", "The intended policy is to delete feedback 12 months after submission, retain daily encrypted backups for 30 days, and retain monthly copies for 12 months. Automatic expiry deletion and monthly-copy selection have not been implemented or verified. Existing feedback and backups currently remain stored; these periods are not active deletion guarantees. Account planning data remains stored until a deletion request is handled. No existing records or backups were deleted for this notice update."],
      ["Request access, correction or deletion", "Email the support address from your account email and describe the request. Do not send your password, recovery key or document contents. The operator will verify account ownership and explain the scope before handling deletion. Clearing device data in Settings removes local cache and document files, but does not delete the server account or its planning data. Server-backup expiry is not automated yet, so deletion from existing encrypted backups cannot currently be promised within a fixed period."],
      ["Support availability", "The listed address is the designated support inbox. Successful receipt of a support message has not yet been independently tested. MyWay is a planning tool; confirm admission requirements, fees and deadlines with the official institution. Readiness and matching are not admission predictions."],
    ],
  },
  {
    lang: "id", title: "Privasi & bantuan", updated: "Diperbarui 14 Oktober 2026",
    operator: "MyWay dikelola oleh Alifian Dzaky Makarim.", contact: "Bantuan, privasi, dan permintaan penghapusan",
    sections: [
      ["Data akun dan perencanaan", "Email, identitas akun, dan catatan autentikasi disimpan oleh Supabase. Profil, universitas tersimpan, pilihan aplikasi, tugas, preferensi, dan progres disimpan di database Supabase MyWay dan tersinkron antarperangkat yang masuk ke akun. Penyimpanan browser juga menyimpan sesi dan cache perencanaan lokal. Autentikasi ditangani Supabase; MyWay tidak menyimpan kata sandimu sebagai teks biasa."],
      ["File dokumen tetap di perangkatmu", "Isi dokumen perencanaan yang diunggah tetap di penyimpanan lokal browser ini (IndexedDB). File tidak diunggah ke database akun, tidak tersinkron ke perangkat lain, dan tidak termasuk cadangan server. Unduh salinan sendiri sebelum menghapus data browser atau berganti perangkat. Ini berbeda dari tangkapan layar opsional yang sengaja kamu lampirkan pada masukan."],
      ["Masukan dan pengoperasian layanan", "Masukan, informasi kontak opsional, dan konteks halaman disimpan di database Sites yang digunakan MyWay. Tangkapan layar masukan opsional disimpan terpisah di penyimpanan objek Sites. Hindari melampirkan dokumen sensitif atau kata sandi. MyWay menggunakan hosting ChatGPT Sites, akun/database Supabase, dan UptimeRobot untuk memantau ketersediaan. Penyedia layanan dapat memproses informasi teknis permintaan untuk menjalankan dan mengamankan layanan."],
      ["Cadangan terenkripsi", "Cadangan server terbatas mencakup data public, auth, dan migrasi Supabase serta catatan masukan Sites yang tersedia. Data dienkripsi sebelum diunggah ke folder Google Drive pribadi yang dikendalikan pengelola. Isi dokumen lokal browser tidak disertakan. Cadangan objek tangkapan layar belum didukung, sehingga ini bukan cadangan seluruh layanan. Arsip yang diunduh telah lolos pemeriksaan checksum, dekripsi, dan integritas; latihan pemulihan di lingkungan terpisah belum dilakukan."],
      ["Retensi: kebijakan yang dituju dan kondisi saat ini", "Kebijakan yang dituju adalah menghapus masukan 12 bulan setelah dikirim, menyimpan cadangan terenkripsi harian selama 30 hari, dan salinan bulanan selama 12 bulan. Penghapusan kedaluwarsa otomatis dan pemilihan salinan bulanan belum diterapkan atau diverifikasi. Masukan dan cadangan yang ada saat ini tetap tersimpan; periode tersebut belum menjadi jaminan penghapusan aktif. Data perencanaan akun tetap disimpan sampai permintaan penghapusan ditangani. Tidak ada catatan atau cadangan lama yang dihapus untuk pembaruan pemberitahuan ini."],
      ["Meminta akses, koreksi, atau penghapusan", "Kirim email dari alamat akunmu ke alamat bantuan dan jelaskan permintaannya. Jangan kirim kata sandi, kunci pemulihan, atau isi dokumen. Pengelola akan memverifikasi kepemilikan akun dan menjelaskan cakupan sebelum menangani penghapusan. Hapus data perangkat di Pengaturan menghapus cache dan file lokal, tetapi tidak menghapus akun server atau data perencanaannya. Kedaluwarsa cadangan server belum otomatis, sehingga penghapusan dari cadangan terenkripsi lama belum dapat dijamin dalam waktu tertentu."],
      ["Ketersediaan bantuan", "Alamat di bawah ditetapkan sebagai kotak masuk bantuan. Penerimaan pesan bantuan belum diuji secara independen. MyWay adalah alat perencanaan; konfirmasikan persyaratan, biaya, dan tenggat dengan institusi resmi. Kesiapan dan kecocokan bukan prediksi penerimaan."],
    ],
  },
];

export default function PrivacyPage() {
  return <main className="privacy-document">
    <header><a href="/" className="privacy-brand">MyWay</a><nav aria-label="Notice language"><a href="#en" lang="en">English</a><a href="#id" lang="id">Bahasa Indonesia</a></nav></header>
    {notices.map(notice => <article key={notice.lang} id={notice.lang} lang={notice.lang} tabIndex={-1}>
      <h1>{notice.title}</h1><p><small>{notice.updated}</small></p><p>{notice.operator}</p>
      <p>{notice.contact}: <a href="mailto:mywaypathapp@gmail.com">mywaypathapp@gmail.com</a></p>
      {notice.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}
      <a href="/">{notice.lang === "id" ? "Kembali ke MyWay" : "Back to MyWay"}</a>
    </article>)}
  </main>;
}
