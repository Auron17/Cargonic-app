"""Scene configs for the Cargonic reels. Each scene's `captions` list has one
entry per spoken chunk (split on pauses) that the scene covers."""

ORANGE = (249, 115, 22)
YELLOW = (255, 214, 10)
WHITE = (255, 255, 255)
RED = (248, 113, 113)


def som(v):
    return f"−{int(v):,} so‘m".replace(",", " ")


REELS = {
    # 1 — Empty return trips
    "bosh-reys": {
        "scenes": [
            {"kind": "road", "chip": "Toshkent → Samarqand", "title": ["Yuk yetkazildi.", "Endi-chi?"],
             "size": 96, "captions": ["Toshkentdan Samarqandga yuk olib bording…"]},
            {"kind": "big", "lines": ["BO‘SH"], "size": 260, "colors": [RED], "sub": ["qaytyapsan"],
             "truck_ghost": True, "y": 640, "impact": True, "captions": ["Orqaga esa — BO‘SH qaytyapsan."]},
            {"kind": "costs", "captions": ["Solyarka o‘zingdan.", "Vaqt o‘zingdan."],
             "items": [{"label": "SOLYARKA", "at": (0, 0.0), "fmt": lambda p: som(1_400_000 * p)},
                       {"label": "VAQT", "at": (1, 0.0), "fmt": lambda p: f"−{int(1 + 7 * p)} soat"}]},
            {"kind": "turn", "lines": ["ENDI BUNDAY", "EMAS."], "impact": True, "captions": ["Endi bunday emas."]},
            {"kind": "feed", "title": ["Zavod yuklari —", "bitta ilovada"], "colors": [WHITE, YELLOW], "tap": True,
             "captions": ["Cargonic ilovasida zavodlarning yuklari bitta joyda."]},
            {"kind": "steps", "captions": ["Yo‘nalishingni tanla, yukni ol, yo‘lga chiq."],
             "items": [{"label": "Yo‘nalish tanla", "at": (0, 0.0)},
                       {"label": "Yukni ol", "at": (0, 0.42)},
                       {"label": "Yo‘lga chiq", "at": (0, 0.7)}]},
            {"kind": "cta", "lines": ["Bo‘sh reysga", "chek qo‘y!"], "colors": [WHITE, YELLOW], "impact": True,
             "button": "YUKLAB OL", "captions": ["Cargonic — bo‘sh reysga chek qo‘y!", "Ilovani hoziroq yuklab ol."]},
        ],
    },
    # 2 — Endless calls hunting for a load
    "qongiroqlar": {
        "scenes": [
            {"kind": "calls", "title": ["Ertalabdan beri…"], "captions": ["Ertalabdan beri o‘ttizta raqamga qo‘ng‘iroq qilding…"]},
            {"kind": "quote", "lines": ["“Yuk ketib", "qoldi, aka.”"], "impact": True,
             "captions": ["Hammasining javobi bitta:", "“Yuk ketib qoldi, aka.”"]},
            {"kind": "feed", "title": ["Yuk qidirma —", "yuk seni topadi"], "colors": [WHITE, YELLOW], "notif": True,
             "captions": ["Cargonic’da yuk qidirib sarson bo‘lmaysan.", "Yuklar o‘zi telefoningga keladi."]},
            {"kind": "bid", "title": ["Narxni o‘zing", "taklif qilasan"], "colors": [WHITE, YELLOW],
             "captions": ["Narxni o‘zing taklif qilasan, zavod bilan to‘g‘ridan-to‘g‘ri ishlaysan."]},
            {"kind": "big", "blue": True, "lines": ["VAQTING —", "PULING"], "size": 150, "colors": [WHITE, YELLOW],
             "shake": 0, "y": 760, "impact": True, "captions": ["Vaqting — bu puling."]},
            {"kind": "cta", "lines": ["Yuk o‘zi", "seni topadi"], "colors": [WHITE, YELLOW], "button": "YUKLAB OL",
             "captions": ["Cargonic’ni hoziroq yuklab ol."]},
        ],
    },
    # 3 — Late / missing payment, trust
    "tolov": {
        "scenes": [
            {"kind": "road", "glow": (16, 185, 129), "title": ["Yuk vaqtida", "yetkazildi ✓"], "size": 100,
             "colors": [WHITE, (110, 231, 183)], "captions": ["Yukni vaqtida yetkazding."]},
            {"kind": "calendar", "days": 14, "captions": ["Bir hafta o‘tdi…", "ikki hafta…"]},
            {"kind": "big", "lines": ["PUL", "HALI YO‘Q"], "size": 170, "colors": [WHITE, RED], "impact": True,
             "captions": ["Pul hali ham yo‘q."]},
            {"kind": "big", "lines": ["TANISH", "HOLATMI?"], "size": 150, "colors": [WHITE, YELLOW], "shake": 0,
             "captions": ["Tanish holatmi?"]},
            {"kind": "verified", "title": ["Yuk egalari —", "zavodlar"],
             "items": [("Tekstil fabrikasi", "Toshkent · tasdiqlangan"),
                       ("Sement zavodi", "Navoiy · tasdiqlangan"),
                       ("Oziq-ovqat ishlab chiqaruvchi", "Samarqand · tasdiqlangan")],
             "captions": ["Cargonic’da yuk egalari — tanilgan zavod va ishlab chiqaruvchilar."]},
            {"kind": "balance", "title": ["Har bir so‘m —", "ko‘z oldingda"], "colors": [WHITE, YELLOW],
             "captions": ["Har bir reys, har bir so‘m — ilovada ko‘rinib turadi."]},
            {"kind": "big", "blue": True, "lines": ["MEHNATING", "QADRLANSIN"], "size": 130, "colors": [WHITE, YELLOW],
             "shake": 0, "y": 760, "captions": ["Mehnating qadrlansin."]},
            {"kind": "cta", "lines": ["Ishonchli yuk,", "shaffof hisob"], "colors": [WHITE, YELLOW], "impact": True,
             "button": "YUKLAB OL", "captions": ["Cargonic — ishonchli yuk, shaffof hisob."]},
        ],
    },

    # 4 — Telegram / tanish orqali yuk: muammolar va isbot
    "telegram": {
        "scenes": [
            {"kind": "chat", "chat_title": "Yuk guruhi",
             "msgs": [{"side": "in", "text": "Aka, yuk bor, kel", "at": (1, 0.0)}],
             "captions": ["Telegramdan yuk topding.", "“Aka, yuk bor, kel.”"]},
            {"kind": "chat", "chat_title": "Yuk guruhi",
             "msgs": [{"side": "out", "text": "Keldim. Yuk qani?", "at": (0, 0.0)},
                      {"side": "in", "text": "Ketib qoldi, aka", "at": (1, 0.0)},
                      {"side": "in", "text": "Yoki ertaga kel", "at": (2, 0.3)}],
             "stamp": {"text": "−2 KUN", "at": (3, 0.0)},
             "captions": ["Borsang…", "yuk ketib qolgan.", "Yoki hali tayyor emas.", "Ikki kun kutasan."]},
            {"kind": "chat", "chat_title": "Yuk egasi",
             "msgs": [{"side": "in", "text": "Narx: 6 000 000", "at": (0, 0.3)},
                      {"side": "out", "text": "Kelishdik", "at": (0, 0.8)},
                      {"side": "in", "text": "Bunchasi yo‘q: 5 mln beraman", "at": (2, 0.0)}],
             "stamp": {"text": "−1 mln so‘m", "at": (2, 0.55)},
             "captions": ["Narx og‘zaki kelishilgan edi.", "Yetib borsang:", "“Bunchasi yo‘q, kamroq beraman.”"]},
            {"kind": "chat", "chat_title": "Yuk egasi",
             "msgs": [{"side": "out", "text": "Yuk ortildi, yo‘ldaman", "at": (0, 0.0)},
                      {"side": "in", "text": "Yuk kam keldi!", "at": (2, 0.0)},
                      {"side": "out", "text": "Yo‘q, to‘liq edi", "at": (3, 0.2)}],
             "stamp": {"text": "ISBOT YO‘Q", "at": (4, 0.0), "size": 120},
             "captions": ["Yuk ortildi, yo‘lga chiqding.", "Keyin:", "“Yuk kam keldi!”", "Kim to‘g‘ri?", "Isbot yo‘q."]},
            {"kind": "turn", "lines": ["CARGONIC’DA", "BUNDAY EMAS"], "size": 108, "impact": True,
             "captions": ["Cargonic’da bunday emas."]},
            {"kind": "feed", "title": ["Yuk va narx —", "kartada yozilgan"], "colors": [WHITE, YELLOW],
             "captions": ["Yuk va narx kartada yozilgan."]},
            {"kind": "trip", "title": ["Rasm bilan isbot,", "xaritada nazorat"], "colors": [WHITE, YELLOW],
             "captions": ["Ortganda rasm, topshirganda rasm.", "Yo‘lingni zavod xaritada ko‘radi.",
                          "Har bir bosqich tarixda qoladi."]},
            {"kind": "big", "blue": True, "lines": ["TANISH —", "YAXSHI."], "size": 170, "colors": [WHITE, WHITE],
             "shake": 0, "y": 640, "sub": ["Lekin isbot — ilovada."], "impact": True,
             "captions": ["Tanish ham yaxshi.", "Lekin isbot — ilovada."]},
            {"kind": "cta", "lines": ["Tanish + isbot", "= xavfsiz reys"], "colors": [WHITE, YELLOW],
             "button": "YUKLAB OL", "impact": True, "captions": ["Cargonic’ni yuklab ol."]},
        ],
    },
}
