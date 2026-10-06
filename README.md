# yuk-platforma Mobile (Haydovchi va Tashuvchi ilovasi)

O‘zbekistondagi zavod va ishlab chiqaruvchilarni litsenziyali yuk tashuvchilar bilan bog‘laydigan B2B marketplace uchun mobil ilova (Android APK).
Ilova haydovchi va tashuvchilar (`CARRIER`) uchun mo‘ljallangan: "Yandex Go haydovchi ilovasi" kabi, faqat yuk mashinalari uchun.

---

## Texnologiyalar

- **Asos:** Expo SDK 54, React Native 0.81+, TypeScript (`strict` rejim)
- **Navigatsiya:** `expo-router` v6 (faylga asoslangan marshrutlash: `app/`)
- **Server bilan aloqa:** Axios + `@tanstack/react-query`
- **Xavfsiz xotira (tokenlar):** `expo-secure-store`
- **Fayl va media:** `expo-image-picker`, `expo-image-manipulator` (1600px gacha kichraytirish va JPEG 0.7 sifatda siqish)
- **Mahalliylashtirish:** `i18next`, `react-i18next` (O‘zbek tili, lotin yozuvi)

---

## Loyiha tuzilishi

```
mobile/
  app/
    _layout.tsx            # Ilova ildiz qobig'i (QueryClient, AuthProvider, Stack)
    (auth)/
      _layout.tsx          # Kirish oqimi
      phone.tsx            # Telefon raqamini kiritish (+998 maskasi bilan)
      code.tsx             # 6 xonali SMS kod, 60s taymer va rol tekshiruvi
    (onboarding)/
      _layout.tsx          # KYC ro'yxatdan o'tish qobig'i
      status.tsx           # Tekshiruv holati ekrani (tekshiruvda/rad/tasdiqlangan)
    (tabs)/
      _layout.tsx          # 4 ta pastki tab (Yuklar, Reyslarim, Balans, Profil)
      index.tsx            # Yuklar lentasi
      trips.tsx            # Reyslarim
      balance.tsx          # Balans va yozuvlar
      profile.tsx          # Tashuvchi profili va chiqish
  src/
    api/
      types.ts             # Backend Java recordlaridan olingan DTO turlari
      storage.ts           # Tokenlarni SecureStore'da xavfsiz saqlash
      client.ts            # Axios mijozi, refresh token mutex, Idempotency-Key va API modullari
    auth/
      AuthProvider.tsx     # Auth holati, foydalanuvchi/profil va marshrut yo'naltirish
    components/
      Screen.tsx           # Xavfsiz zona va klaviatura bilan ekran qobig'i
      PrimaryButton.tsx    # Haydovchilar uchun katta tugma (≥52dp, yuqori kontrast)
      TextField.tsx        # Katta matn kiritish maydoni
      Select.tsx           # Pastdan chiquvchi qulay tanlash modali
      StatusBadge.tsx      # Holatlar nishoni (yashil, sariq, ko'k, qizil)
      Money.tsx            # Formatlangan pul ko'rsatish (6 000 000 so‘m)
      ErrorBanner.tsx      # Xatolik bannori va qayta urinish
      EmptyState.tsx       # Ma'lumot yo'qligidagi chiroyli holat
      AuthImage.tsx        # Authorization token bilan serverdan rasm ko'rsatish
      PhotoPicker.tsx      # Kamera/galereya → siqish → yuklash
    i18n/
      uz.ts                # O'zbekcha tarjimalar
      index.ts             # i18next konfiguratsiyasi
    utils/
      format.ts            # Pul, sana va telefon formatlash yordamchilari
      uuid.ts              # Idempotency-Key uchun RFC4122 v4 UUID generatori
```

---

## Muhit o‘zgaruvchilari

- `EXPO_PUBLIC_API_URL` — Backend API server manzili.
  - Standart: `http://10.0.2.2:8080` (Android emulyatori uchun lokal server).
  - Haqiqiy qurilma uchun: `http://<KOMPYUTER_IP>:8080`.

---

## M1 bosqichida amalga oshirilgan ishlar

1. **API va Xavfsizlik:**
   - `src/api/client.ts`: Axios asosidagi mijoz, 401 Unauthorized holatida avtomatik `POST /api/v1/auth/refresh` bir martalik yangilash (mutex navbati bilan), har bir holat o'zgartiruvchi POST so'roviga noyob `Idempotency-Key` (UUID).
   - `src/api/types.ts`: Backend spetsifikatsiyasiga to'liq mos TypeScript turlari (hech qanday `any` yo'q).
   - `src/api/storage.ts`: Access va refresh tokenlarni `expo-secure-store`da saqlash.

2. **Autentifikatsiya va Yo'naltirish:**
   - `AuthProvider.tsx`: tokenlarni o'qish, foydalanuvchi (`/me`) va tashuvchi profilini (`/carrier/profile`) yuklash.
   - Avtomatik yo'naltirish: kirmagan bo'lsa `(auth)/phone`, tasdiqlanmagan tashuvchi bo'lsa `(onboarding)/status`, tasdiqlangan bo'lsa `(tabs)`.
   - Agar foydalanuvchi `SHIPPER` yoki `ADMIN` bo'lsa: "Bu ilova haydovchilar uchun. Zavodlar veb-kabinetdan foydalanadi" xabari va chiqish tugmasi.

3. **Ekranlar:**
   - `(auth)/phone.tsx`: +998 maskali telefon kiritish, 9 ta raqam validatsiyasi, OTP yuborish.
   - `(auth)/code.tsx`: 6 xonali SMS kod, 60 soniyalik qayta yuborish taymeri, yangi foydalanuvchi uchun `role: "CARRIER"` bilan tasdiqlash, raqamni o'zgartirish.
   - `(onboarding)/status.tsx`: Hujjatlar tekshiruvda/rad etilgan holati, yangilash va chiqish.
   - `(tabs)/_layout.tsx`: 4 ta tab navigatsiyasi (**Yuklar**, **Reyslarim**, **Balans**, **Profil**).
   - Bo'sh joy tutuvchi tab ekranlari (`index.tsx`, `trips.tsx`, `balance.tsx`, `profile.tsx`).

4. **Haydovchi uchun qulay UI komponentlar:**
   - `Screen`, `PrimaryButton` (≥52dp, yuqori kontrast), `TextField`, `Select`, `StatusBadge`, `Money`, `ErrorBanner`, `EmptyState`, `AuthImage`, `PhotoPicker`.
