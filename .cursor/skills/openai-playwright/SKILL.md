# openai/playwright

## Amac

Kritik kullanici akislari icin E2E regresyonlarini azaltmak.

## Ne Zaman Kullanilir

- Login/signup/onboarding akisi degisince
- Kritik form veya satin alma benzeri akislar degisince
- Bugfix sonrasi tekrar test gerekiyorsa

## Proje Kurallari

- Her test tek bir davranisi dogrulasin.
- Flaky testleri hemen stabilize et.
- Test adlari davranisi acik anlatsin.

## Guvenlik Notu

- Test datasi ile production datasi karistirilmaz.
