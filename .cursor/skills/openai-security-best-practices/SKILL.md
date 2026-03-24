# openai/security-best-practices

## Amac

Kod degisikliklerinde temel guvenlik risklerini erken yakalamak.

## Ne Zaman Kullanilir

- Auth/session akisi degisince
- API endpoint eklenince
- Dosya yukleme/harici URL islenince
- Input validation gerektiren yeni feature gelince

## Proje Kurallari

- Secret'lar asla kodda tutulmaz.
- Kullanici girdisi dogrulanmadan islenmez.
- Yetki kontrolu olmayan mutasyon endpoint'i birakilmaz.

## Guvenlik Notu

- Bu skill review odaklidir, tek basina penetration test yerine gecmez.
