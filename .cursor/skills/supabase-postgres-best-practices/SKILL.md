# supabase/postgres-best-practices

## Amac

Supabase/Postgres sorgu, index, RLS ve migration kalitesini arttirmak.

## Ne Zaman Kullanilir

- Yeni tablo/kolon eklerken
- RLS policy yazarken
- Yavas sorgu optimize ederken
- Migration stratejisi belirlerken

## Proje Kurallari

- Once RLS dusun, sonra API entegrasyonu yap.
- Sorgularda gereksiz `select *` kullanma.
- Maliyetli sorgularda index onerisi ile ilerle.

## Guvenlik Notu

- Destructive SQL komutlari otomatik calistirilmaz.
- Production verisi icin once dry-run mantigi uygulanir.
