# 📂 Sayt Ma'lumotlarini Boshqarish Qo'llanmasi

Ushbu qo'llanma orqali siz **Yutuqlar**, **Statistika** va **Aloqa** sahifalaridagi ma'lumotlarni osonlikcha `.txt` fayllar orqali o'zgartirishingiz mumkin.

---

## 🔝 1. Yutuqlar (Achievements)
**Fayl manzili:** `data/achievements.txt`

Ushbu faylda har bir yutuq alohida blok ko'rinishida yoziladi va bloklar orasiga `===` belgisi qo'yiladi.

### Qatirlar tartibi:
*   `Sana:` Yutuq qachon bo'lganligi (masalan: Mart, 2026)
*   `Sarlavha:` Yutuq nomi
*   `Tavsif:` Batafsil ma'lumot
*   `Ikonka:` FontAwesome ikonka kodi (masalan: `fas fa-trophy`)

**Namuna:**
```text
Sana: Mart, 2026
Sarlavha: Matematika Olimpiadasi G'olibi
Tavsif: Maktabimiz o'quvchisi viloyat matematika olimpiadasida 1-o'rinni egalladi.
Ikonka: fas fa-trophy

===

Sana: Fevral, 2026
Sarlavha: Yangi Bino Ochilishi
Tavsif: Maktabimizda barcha jihozlarga ega yangi sport zali foydalanishga topshirildi.
Ikonka: fas fa-building
```

---

## 📊 2. Statistika (Statistics)
**Fayl manzili:** `data/statistics.txt`

Bu yerda har bir qator bitta raqamli ko'rsatkichni bildiradi. Format: `Nomi: Qiymati`

### Tavsiya etilgan nomlar (Ikonkalar avtomatik chiqishi uchun):
*   `O'quvchilar:`
*   `O'qituvchilar:`
*   `Sinflar:`
*   `Yutuqlar:`
*   `Oliy o'quv yurti:` (O'qishga kirganlar foizi)
*   `Binolar:`
*   `Tajriba:`

**Namuna:**
```text
O'quvchilar: 2183
O'qituvchilar: 146
Sinflar: 62
Yutuqlar: 250+
```

---

## 📞 3. Aloqa (Contact)
**Fayl manzili:** `data/contact.txt`

Ushbu fayl orqali maktabning barcha aloqa ma'lumotlarini o'zgartirasiz.

### Kerakli kalit so'zlar:
*   `Manzil:` To'liq manzil matni
*   `Telefon:` Bog'lanish raqami
*   `Email:` Gmail yoki boshqa email
*   `Telegram:` Kanal yoki profil linki
*   `Youtube:` Kanal linki
*   `Facebook:` Profil linki
*   `Instagram:` Profil linki
*   `Xarita:` Google Maps'dan olingan **Embed (iframe)** linki

**Namuna:**
```text
Manzil: Fargʻona viloyati, Margʻilon shahar, Burhoniddin Al-Margʻinoniy koʻchasi 77-uy
Telefon: +998902316561
Email: mshmaktab1@gmail.com
Telegram: https://t.me/mshmaktab1
Xarita: https://maps.google.com/maps?q=40.47597219780,71.73496746&output=embed
```

---

### 💡 Maslahatlar:
1.  **Fayl nomini o'zgartirmang**: Tizim ushbu fayllarni nomi bo'yicha qidiradi.
2.  **Ikki nuqta (`:`)**: Kalit so'zlardan keyin albatta `:` qo'ying.
3.  **UTF-8**: Fayllarni saqlayotganingizda kodlash (encoding) **UTF-8** ekanligiga ishonch hosil qiling (o'zbekcha harflar buzilmasligi uchun).
