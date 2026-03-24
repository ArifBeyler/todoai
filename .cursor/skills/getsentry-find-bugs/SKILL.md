# getsentry/find-bugs

## Amac

Hata odakli inceleme yaparak regressions ve mantik hatalarini bulmak.

## Ne Zaman Kullanilir

- Feature merge oncesi
- Buyuk refactor sonrasi
- Prod hatasi tekrarlandiginda

## Proje Kurallari

- Once hatanin yeniden uretim adimlarini netlestir.
- Koken sebebi bulmadan sadece semptomu yamalama.
- Fix sonrasinda test/plausibility kontrolu ekle.

## Guvenlik Notu

- Bugfixte gizli veri loglama veya hassas bilgi sizdirmaya dikkat et.
