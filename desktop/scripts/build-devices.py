#!/usr/bin/env python3
"""Writes electron/devices.json and site/devices.json from the table below.

Viewports are portrait CSS pixels (iOS: points; Android: physical pixels at the
default display size divided by the device pixel ratio, rounded up as Chrome
does). `approx` marks sizes that come from announced panel resolutions rather
than a measured browser, and the switcher labels them as estimates.
`model` is the client-hint model: the maker's code where it is known,
otherwise the marketing name.
Run: python3 scripts/build-devices.py
"""
import json
import pathlib

UPDATED = "2026-10-14"
VERSION = 2

IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1"
IPADOS = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15"
ANDROID = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Mobile Safari/537.36"
ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{chrome}.0.0.0 Safari/537.36"

# (id, name, width, height, dpr, cutout, radius, year, extra)
IPHONES = [
    ("iphone-18-pro-max", "iPhone 18 Pro Max", 440, 956, 3, "island", 62, 2026, {}),
    ("iphone-18-pro", "iPhone 18 Pro", 402, 874, 3, "island", 62, 2026, {}),
    ("iphone-duo-open", "iPhone Duo (open)", 626, 890, 3, "punch", 40, 2026, {"type": "foldable", "approx": True}),
    ("iphone-duo-closed", "iPhone Duo (closed)", 466, 678, 3, "punch", 48, 2026, {"type": "foldable", "approx": True}),
    ("iphone-17e", "iPhone 17e", 390, 844, 3, "notch", 47, 2026, {}),
    ("iphone-17-pro-max", "iPhone 17 Pro Max", 440, 956, 3, "island", 62, 2025, {}),
    ("iphone-17-pro", "iPhone 17 Pro", 402, 874, 3, "island", 62, 2025, {}),
    ("iphone-air", "iPhone Air", 420, 912, 3, "island", 62, 2025, {}),
    ("iphone-17", "iPhone 17", 402, 874, 3, "island", 62, 2025, {}),
    ("iphone-16e", "iPhone 16e", 390, 844, 3, "notch", 47, 2025, {}),
    ("iphone-16-pro-max", "iPhone 16 Pro Max", 440, 956, 3, "island", 62, 2024, {}),
    ("iphone-16-pro", "iPhone 16 Pro", 402, 874, 3, "island", 62, 2024, {}),
    ("iphone-16-plus", "iPhone 16 Plus", 430, 932, 3, "island", 55, 2024, {}),
    ("iphone-16", "iPhone 16", 393, 852, 3, "island", 55, 2024, {}),
    ("iphone-15-pro-max", "iPhone 15 Pro Max", 430, 932, 3, "island", 55, 2023, {}),
    ("iphone-15-pro", "iPhone 15 Pro", 393, 852, 3, "island", 55, 2023, {}),
    ("iphone-15-plus", "iPhone 15 Plus", 430, 932, 3, "island", 55, 2023, {}),
    ("iphone-15", "iPhone 15", 393, 852, 3, "island", 55, 2023, {}),
    ("iphone-14-pro-max", "iPhone 14 Pro Max", 430, 932, 3, "island", 55, 2022, {}),
    ("iphone-14-pro", "iPhone 14 Pro", 393, 852, 3, "island", 55, 2022, {}),
    ("iphone-14-plus", "iPhone 14 Plus", 428, 926, 3, "notch", 47, 2022, {}),
    ("iphone-14", "iPhone 14", 390, 844, 3, "notch", 47, 2022, {}),
    ("iphone-se", "iPhone SE (2nd/3rd gen)", 375, 667, 2, "none", 0, 2022, {}),
    ("iphone-13-pro-max", "iPhone 13 Pro Max", 428, 926, 3, "notch", 47, 2021, {}),
    ("iphone-13-pro", "iPhone 13 Pro", 390, 844, 3, "notch", 47, 2021, {}),
    ("iphone-13", "iPhone 13", 390, 844, 3, "notch", 47, 2021, {}),
    ("iphone-13-mini", "iPhone 13 mini", 375, 812, 3, "notch", 44, 2021, {}),
]

IPADS = [
    ("ipad-mini", "iPad mini (A17 Pro)", 744, 1133, 2, 22, 2024),
    ("ipad", "iPad (A16)", 820, 1180, 2, 18, 2025),
    ("ipad-air-11", 'iPad Air 11"', 820, 1180, 2, 18, 2025),
    ("ipad-air-13", 'iPad Air 13"', 1024, 1366, 2, 18, 2025),
    ("ipad-pro-11", 'iPad Pro 11"', 834, 1210, 2, 18, 2025),
    ("ipad-pro-13", 'iPad Pro 13"', 1032, 1376, 2, 18, 2025),
]

# (id, name, maker, model, width, height, dpr, radius, year, extra)
ANDROIDS = [
    # Google Pixel
    ("pixel-10-pro-fold-open", "Pixel 10 Pro Fold (open)", "Google", "Pixel 10 Pro Fold", 755, 783, 2.75, 24, 2025, {"type": "foldable"}),
    ("pixel-10-pro-fold-cover", "Pixel 10 Pro Fold (cover)", "Google", "Pixel 10 Pro Fold", 412, 901, 2.625, 32, 2025, {"type": "foldable"}),
    ("pixel-10-pro-xl", "Pixel 10 Pro XL", "Google", "Pixel 10 Pro XL", 448, 998, 3, 40, 2025, {}),
    ("pixel-10-pro", "Pixel 10 Pro", "Google", "Pixel 10 Pro", 427, 952, 3, 40, 2025, {}),
    ("pixel-10", "Pixel 10", "Google", "Pixel 10", 412, 924, 2.625, 36, 2025, {}),
    ("pixel-10a", "Pixel 10a", "Google", "Pixel 10a", 412, 924, 2.625, 32, 2026, {}),
    ("pixel-9-pro-fold-open", "Pixel 9 Pro Fold (open)", "Google", "Pixel 9 Pro Fold", 755, 783, 2.75, 24, 2024, {"type": "foldable"}),
    ("pixel-9-pro-fold-cover", "Pixel 9 Pro Fold (cover)", "Google", "Pixel 9 Pro Fold", 412, 924, 2.625, 32, 2024, {"type": "foldable"}),
    ("pixel-9-pro-xl", "Pixel 9 Pro XL", "Google", "Pixel 9 Pro XL", 448, 998, 3, 40, 2024, {}),
    ("pixel-9-pro", "Pixel 9 Pro", "Google", "Pixel 9 Pro", 427, 952, 3, 40, 2024, {}),
    ("pixel-9", "Pixel 9", "Google", "Pixel 9", 412, 923, 2.625, 36, 2024, {}),
    ("pixel-9a", "Pixel 9a", "Google", "Pixel 9a", 412, 924, 2.625, 32, 2025, {}),
    ("pixel-fold-open", "Pixel Fold (open)", "Google", "Pixel Fold", 841, 701, 2.625, 24, 2023, {"type": "foldable"}),
    ("pixel-fold-cover", "Pixel Fold (cover)", "Google", "Pixel Fold", 412, 797, 2.625, 32, 2023, {"type": "foldable"}),
    ("pixel-8-pro", "Pixel 8 Pro", "Google", "Pixel 8 Pro", 448, 998, 3, 40, 2023, {}),
    ("pixel-8", "Pixel 8", "Google", "Pixel 8", 412, 915, 2.625, 36, 2023, {}),
    ("pixel-8a", "Pixel 8a", "Google", "Pixel 8a", 412, 915, 2.625, 32, 2024, {}),
    ("pixel-7-pro", "Pixel 7 Pro", "Google", "Pixel 7 Pro", 412, 892, 3.5, 36, 2022, {}),
    ("pixel-7", "Pixel 7", "Google", "Pixel 7", 412, 915, 2.625, 32, 2022, {}),
    ("pixel-7a", "Pixel 7a", "Google", "Pixel 7a", 412, 915, 2.625, 32, 2023, {}),
    # Samsung Galaxy S
    ("galaxy-s26-ultra", "Galaxy S26 Ultra", "Samsung", "SM-S948B", 412, 891, 3.5, 22, 2026, {}),
    ("galaxy-s26-plus", "Galaxy S26+", "Samsung", "Galaxy S26+", 384, 832, 3.75, 32, 2026, {}),
    ("galaxy-s26", "Galaxy S26", "Samsung", "Galaxy S26", 360, 780, 3, 32, 2026, {}),
    ("galaxy-s25-ultra", "Galaxy S25 Ultra", "Samsung", "SM-S938B", 412, 891, 3.5, 22, 2025, {}),
    ("galaxy-s25-edge", "Galaxy S25 Edge", "Samsung", "SM-S937B", 412, 891, 3.5, 32, 2025, {}),
    ("galaxy-s25-plus", "Galaxy S25+", "Samsung", "SM-S936B", 384, 832, 3.75, 32, 2025, {}),
    ("galaxy-s25", "Galaxy S25", "Samsung", "SM-S931B", 360, 780, 3, 32, 2025, {}),
    ("galaxy-s24-ultra", "Galaxy S24 Ultra", "Samsung", "SM-S928B", 412, 891, 3.5, 22, 2024, {}),
    ("galaxy-s24-plus", "Galaxy S24+", "Samsung", "SM-S926B", 384, 832, 3.75, 32, 2024, {}),
    ("galaxy-s24", "Galaxy S24", "Samsung", "SM-S921B", 360, 780, 3, 32, 2024, {}),
    ("galaxy-s23-ultra", "Galaxy S23 Ultra", "Samsung", "SM-S918B", 384, 824, 2.8125, 22, 2023, {}),
    ("galaxy-s23-plus", "Galaxy S23+", "Samsung", "SM-S916B", 384, 832, 2.8125, 32, 2023, {}),
    ("galaxy-s23", "Galaxy S23", "Samsung", "SM-S911B", 360, 780, 3, 32, 2023, {}),
    ("galaxy-s22-ultra", "Galaxy S22 Ultra", "Samsung", "SM-S908B", 384, 824, 2.8125, 22, 2022, {}),
    ("galaxy-s22-plus", "Galaxy S22+", "Samsung", "SM-S906B", 384, 832, 2.8125, 32, 2022, {}),
    ("galaxy-s22", "Galaxy S22", "Samsung", "SM-S901B", 360, 780, 3, 32, 2022, {}),
    # Samsung Galaxy Z
    ("galaxy-z-fold8-ultra-open", "Galaxy Z Fold8 Ultra (open)", "Samsung", "Galaxy Z Fold8 Ultra", 752, 835, 3, 24, 2026, {"type": "foldable", "approx": True}),
    ("galaxy-z-fold8-ultra-cover", "Galaxy Z Fold8 Ultra (cover)", "Samsung", "Galaxy Z Fold8 Ultra", 412, 960, 2.625, 28, 2026, {"type": "foldable", "approx": True}),
    ("galaxy-z-fold8-open", "Galaxy Z Fold8 (open)", "Samsung", "Galaxy Z Fold8", 704, 933, 2.625, 24, 2026, {"type": "foldable", "approx": True}),
    ("galaxy-z-fold8-cover", "Galaxy Z Fold8 (cover)", "Samsung", "Galaxy Z Fold8", 444, 702, 2.8125, 28, 2026, {"type": "foldable", "approx": True}),
    ("galaxy-z-flip8", "Galaxy Z Flip8", "Samsung", "Galaxy Z Flip8", 412, 960, 2.625, 32, 2026, {"type": "foldable", "approx": True}),
    ("galaxy-z-fold-open", "Galaxy Z Fold7 (open)", "Samsung", "SM-F966B", 750, 832, 2.625, 24, 2025, {"type": "foldable"}),
    ("galaxy-z-fold-cover", "Galaxy Z Fold7 (cover)", "Samsung", "SM-F966B", 412, 960, 2.625, 28, 2025, {"type": "foldable"}),
    ("galaxy-z-flip7", "Galaxy Z Flip7", "Samsung", "SM-F766B", 412, 960, 2.625, 32, 2025, {"type": "foldable"}),
    ("galaxy-z-fold6-open", "Galaxy Z Fold6 (open)", "Samsung", "SM-F956B", 707, 823, 2.625, 24, 2024, {"type": "foldable"}),
    ("galaxy-z-fold6-cover", "Galaxy Z Fold6 (cover)", "Samsung", "SM-F956B", 344, 882, 2.625, 28, 2024, {"type": "foldable"}),
    ("galaxy-z-flip6", "Galaxy Z Flip6", "Samsung", "SM-F741B", 412, 1006, 2.625, 32, 2024, {"type": "foldable"}),
    # Samsung Galaxy A
    ("galaxy-a56", "Galaxy A56", "Samsung", "SM-A566B", 384, 832, 2.8125, 32, 2025, {}),
    ("galaxy-a36", "Galaxy A36", "Samsung", "SM-A366B", 384, 832, 2.8125, 32, 2025, {}),
    ("galaxy-a55", "Galaxy A55", "Samsung", "SM-A556B", 384, 832, 2.8125, 32, 2024, {}),
    ("galaxy-a17", "Galaxy A17", "Samsung", "Galaxy A17", 412, 892, 2.625, 28, 2025, {}),
    ("galaxy-a25", "Galaxy A25", "Samsung", "SM-A256B", 412, 892, 2.625, 28, 2023, {}),
    # Sony Xperia
    ("xperia-1-viii", "Xperia 1 VIII", "Sony", "Xperia 1 VIII", 412, 892, 2.625, 16, 2026, {"approx": True}),
    ("xperia-1-vii", "Xperia 1 VII", "Sony", "Xperia 1 VII", 412, 892, 2.625, 16, 2025, {}),
    ("xperia-1-vi", "Xperia 1 VI", "Sony", "XQ-EC54", 412, 892, 2.625, 16, 2024, {}),
    ("xperia-10-viii", "Xperia 10 VIII", "Sony", "Xperia 10 VIII", 412, 892, 2.625, 16, 2026, {"approx": True}),
    ("xperia-10-vii", "Xperia 10 VII", "Sony", "Xperia 10 VII", 412, 892, 2.625, 16, 2025, {}),
    ("xperia-10-vi", "Xperia 10 VI", "Sony", "XQ-ES54", 412, 892, 2.625, 16, 2024, {}),
    # Sharp AQUOS
    ("aquos-r10", "AQUOS R10", "Sharp", "SH-51F", 412, 892, 2.625, 24, 2025, {"approx": True}),
    ("aquos-r9", "AQUOS R9", "Sharp", "SH-51E", 412, 892, 2.625, 24, 2024, {}),
    ("aquos-sense10", "AQUOS sense10", "Sharp", "AQUOS sense10", 412, 892, 2.625, 24, 2025, {"approx": True}),
    ("aquos-sense9", "AQUOS sense9", "Sharp", "SH-53E", 412, 892, 2.625, 24, 2024, {}),
    ("aquos-wish4", "AQUOS wish4", "Sharp", "SH-52E", 360, 806, 2, 24, 2024, {}),
    # OPPO
    ("oppo-reno14", "OPPO Reno14 5G", "OPPO", "OPPO Reno14 5G", 412, 915, 2.625, 32, 2025, {"approx": True}),
    ("oppo-reno13-a", "OPPO Reno13 A", "OPPO", "OPPO Reno13 A", 412, 915, 2.625, 32, 2025, {}),
    ("oppo-find-x9", "OPPO Find X9", "OPPO", "OPPO Find X9", 419, 920, 3, 32, 2025, {"approx": True}),
    ("oppo-a5", "OPPO A5 5G", "OPPO", "OPPO A5 5G", 360, 802, 2, 32, 2025, {"approx": True}),
    # Xiaomi
    ("xiaomi-15t-pro", "Xiaomi 15T Pro", "Xiaomi", "Xiaomi 15T Pro", 427, 924, 3, 32, 2025, {"approx": True}),
    ("xiaomi-15", "Xiaomi 15", "Xiaomi", "Xiaomi 15", 400, 890, 3, 32, 2025, {"approx": True}),
    ("redmi-note-14-pro", "Redmi Note 14 Pro 5G", "Xiaomi", "Redmi Note 14 Pro 5G", 412, 915, 2.96, 32, 2025, {"approx": True}),
    ("redmi-15c", "Redmi 15C", "Xiaomi", "Redmi 15C", 360, 820, 2, 32, 2025, {"approx": True}),
    # Android tablets
    ("galaxy-tab-s11", "Galaxy Tab S11", "Samsung", "Galaxy Tab S11", 800, 1280, 2, 18, 2025, {"type": "tablet"}),
    ("pixel-tablet", "Pixel Tablet", "Google", "Pixel Tablet", 800, 1280, 2, 18, 2023, {"type": "tablet"}),
]


def compact(device):
    return {key: value for key, value in device.items() if value not in (None, "", False)}


devices = []
for id_, name, width, height, dpr, cutout, radius, year, extra in IPHONES:
    devices.append(compact({"id": id_, "name": name, "maker": "Apple", "os": "ios", "type": extra.get("type", "phone"),
                            "width": width, "height": height, "dpr": dpr, "cutout": cutout, "radius": radius,
                            "year": year, "approx": extra.get("approx"), "ua": IOS}))
for id_, name, maker, model, width, height, dpr, radius, year, extra in ANDROIDS:
    kind = extra.get("type", "phone")
    devices.append(compact({"id": id_, "name": name, "maker": maker, "os": "android", "type": kind,
                            "width": width, "height": height, "dpr": dpr, "cutout": "none" if kind == "tablet" else "punch",
                            "radius": radius, "model": model, "year": year, "approx": extra.get("approx"),
                            "ua": ANDROID_TABLET if kind == "tablet" else ANDROID}))
for id_, name, width, height, dpr, radius, year in IPADS:
    devices.append({"id": id_, "name": name, "maker": "Apple", "os": "ipados", "type": "tablet", "width": width,
                    "height": height, "dpr": dpr, "cutout": "none", "radius": radius, "year": year, "ua": IPADOS})

lines = [json.dumps(device, ensure_ascii=False, separators=(", ", ": ")) for device in devices]
text = '{\n  "version": %d,\n  "updated": "%s",\n  "devices": [\n    %s\n  ]\n}\n' % (VERSION, UPDATED, ",\n    ".join(lines))
root = pathlib.Path(__file__).resolve().parent.parent
for target in (root / "electron" / "devices.json", root.parent / "site" / "devices.json"):
    target.write_text(text)
print(len(devices), "devices")
