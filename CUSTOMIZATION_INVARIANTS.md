# قراردادهای شاخهٔ سفارشی `my-develop` برای به‌روزرسانی‌های بعدی

این فایل چک‌لیست حفظ رفتارهای این شاخه است. قبل از هر مرج از `develop` آن را همراه با [MY_DEVELOP_CHANGES.md](MY_DEVELOP_CHANGES.md) بخوانید. حل‌شدن خودکار تعارض Git به معنی حفظ عملکرد نیست؛ هر تغییر مرتبط را با کد سفارشی و خروجی نهایی مقایسه کنید. تغییرات فقط برای به‌روزرسانی لازم باشند و قابلیت‌های زیر حذف یا به سرویس آنلاین وابسته نشوند.

## قراردادهایی که باید حفظ شوند

| بخش | فایل‌های اصلی | رفتار لازم |
| --- | --- | --- |
| خروجی Android و Windows | `package.json`، `packages/scratch-gui/package.json`، `packages/scratch-gui/webpack.config.js`، `packages/scratch-gui/scripts/build-windows.mjs` | `npm run build:android` از ریشه، خروجی production آفلاین و کم‌حجم `build/` را با مسیرهای نسبی و بدون source map می‌سازد و سپس همان محتوا را داخل دو بستهٔ Windows x64 و ia32 قرار می‌دهد. `npm run build:windows` فقط بسته‌بندی Windows را تکرار می‌کند. بیلد معمولی monorepo جایگزین بیلد Android نیست. |
| ارتباط با میزبان Android | `src/lib/sb-file-uploader-hoc.jsx`، `src/lib/download-blob.js`، `src/lib/android-number-input.js` | توابع `AndroidScratchLoadProject()` و `AndroidScratchLoadProjectUrl(url, filename)` و رابط `AndroidProjectSaver` حفظ شوند. callbackهای اختیاری `projectLoaderReady()` و `projectLoadStarted()`، انتقال تکه‌ای ذخیرهٔ `.sb3` و `.sprite3` و fallback مرورگر را حفظ کنید. ورودی عددی در Android از صفحه‌کلید سیستم استفاده کند و صفحه‌کلید عددی داخلی Scratch هم‌زمان باز نشود؛ رفتار دسکتاپ عوض نشود. ورودی شناور Android در برنامهٔ میزبان است، نه این مخزن. |
| رسانه‌های کاملاً آفلاین | `static/assets/`، `download-assets.js`، `src/lib/legacy-storage.ts`، `src/lib/static-url.js`، `scripts/verify-offline-build.js`، `src/lib/libraries/*.json` | رسانه‌های کتابخانه از فایل محلی بارگذاری شوند؛ thumbnailها نباید برای هر مورد به Blob تبدیل شوند یا به CDN درخواست بدهند. اگر فهرست کتابخانه عوض شد، فقط فایل‌های جدید/ناقص را با `npm run assets:download --workspace=packages/scratch-gui` دریافت کنید و verifier را اجرا کنید. fontها، extensionها، workerها و chunkهای مورد نیاز نیز باید در بستهٔ آفلاین بمانند. |
| فارسی، عربی و انگلیسی | `src/lib/supported-locales.js`، `src/lib/set-blocks-locale.js`، `src/css/typography.css`، `src/css/fonts/BYekan.woff2`، `src/reducers/locales.js` | تنها `fa`، `ar` و `en` قابل انتخاب باشند؛ فارسی و RTL پیش‌فرض بمانند. فونت BYekan به رابط و عنوان دسته‌های بلوک اعمال شود. معنای بلوک‌های `<` و `>` در فارسی و عربی درست بماند. عبارت «Load from your computer» هم ترجمه شود. |
| کتابخانهٔ فارسی | `src/lib/libraries/translations/fa.js`، `translate-library-name.js`، `library-item-search.js` و containerهای کتابخانه | نام اسپرایت، پس‌زمینه و صدا در حالت فارسی ترجمه شود، اما نام فایل کاربر تغییر نکند. جست‌وجوی فارسی و انگلیسی هر دو نتیجه بدهد و شکل‌های حروف/ارقام را یکسان کند. نام `Kiran` به صورت «کایرن» باشد. |
| UI لمسی و دیالوگ‌ها | `src/components/menu-bar/`، `src/components/language-selector/`، `src/components/custom-procedures/`، `src/containers/custom-procedures.jsx` | دکمهٔ مستقل زبان و دیالوگ سه‌زبانه در Android و Windows کار کند. منوی تنظیمات با لمس باز شود. دیالوگ «ایجاد قطعه» در landscape قابل استفاده باشد، دکمه‌های درون آن جمع‌وجور باشند و هنگام بازشدن خودکار به ورودی متن فوکوس نکند. |
| بستهٔ Windows | `desktop/main.cjs`، `desktop/window-config.cjs`، `desktop/installer.iss`، `desktop/icon*`، `scripts/build-windows.mjs` | Electron همان فایل‌های بیلد Android را بسته‌بندی کند. عنوان پنجره `Scratch farsi 3.0`، نام برنامه و پوشهٔ نصب `Scratch farsi`، آیکون فارسی و دیالوگ تأیید خروج متناسب با زبان فعال حفظ شوند. بعد از تأیید، پنجره واقعاً بسته شود. نسخه در نام Setup ثبت شود. |
| تنظیمات مخزن | `.github/workflows/ci.yml`، `.github/workflows/custom-release.yml` | CI عمومی با push/PR به‌طور خودکار فعال نشود؛ اجرای دستی و `workflow_call` مجاز بماند. اکشن مستقل ریلیز با درخواست صاحب پروژه، فقط برای ارتقای نسخهٔ `my-develop` یا تگ‌های سفارشی `vX.Y.Z-fa.N` مجاز است و بسته‌های آفلاین Android/Windows را روی گیت‌هاب می‌سازد. |

مسیرهای `src/` و `static/` این جدول نسبت به `packages/scratch-gui/` هستند. قرارداد دقیق متدهای بریج و دستورهای بیلد در [README پکیج GUI](packages/scratch-gui/README.md) و [گزارش سفارشی‌سازی](MY_DEVELOP_CHANGES.md) آمده است.

## روال هر به‌روزرسانی

از نسخهٔ 15.3.0، هدف پیش‌فرض مرورگرها Baseline است. محیط Browserslist با نام `android` در شش پکیج GUI/storage/VM/render/SVG/paint هدف‌های قبلی کامپایل را برای خروجی آفلاین حفظ می‌کند؛ فرمان `build:android` باید این محیط را فعال کند. نصب وابستگی‌های توسعه برای بیلد الزامی است.

خروجی Node پکیج‌های render و VM باید وابستگی‌های node_modules ریشهٔ monorepo را external نگه دارد؛ در غیر این صورت jsdom و باینری canvas به‌اشتباه در bundle قرار می‌گیرند و بیلد عمومی شکست می‌خورد. تست‌های `webpack-node-externals.js` و `webpack_node_externals.js` این قرارداد را کنترل می‌کنند.

1. وضعیت تمیز شاخه و نقطهٔ مشترک با `origin/develop` را بررسی کنید؛ فهرست فایل‌های تغییرکرده در دو طرف را مقایسه کنید. در فایل‌های مشترک، رفتار سفارشی را آگاهانه با کد جدید تطبیق دهید، نه اینکه یکی از دو نسخه را یک‌جا انتخاب کنید.
2. تغییر وابستگی‌های `scratch-blocks`، `scratch-l10n`، `scratch-render-fonts`، `scratch-storage`، paint/SVG renderer و webpack را از نظر RTL، فونت، آدرس‌های نسبی، chunkهای جدید و کارکرد آفلاین بررسی کنید. هر فایل JavaScript/CSS جدیدی که در زمان اجرا به‌صورت URL بارگذاری می‌شود باید داخل `build/` باشد. مسیرهای `file://` و `https://appassets.androidplatform.net/` را جداگانه در نظر بگیرید.
3. چهار فهرست `sprites.json`، `backdrops.json`، `costumes.json` و `sounds.json` را با نسخهٔ قبلی مقایسه کنید؛ برای رسانهٔ جدید، فایل محلی و ترجمهٔ فارسی مناسب را اضافه کنید. اگر فهرست‌ها تغییر نکرده‌اند، دانلود دوباره لازم نیست.
4. `npm ci`، تست‌ها و lint پکیج‌های تغییرکرده، سپس `npm run build:android` و `npm run build:verify-offline --workspace=packages/scratch-gui` را اجرا کنید. نبود source map، وجود بریج، BYekan و تمام رسانه‌های ارجاع‌شده را کنترل کنید. دو Setup Windows را نیز از لحاظ وجود، نسخه و استفاده از همان `build/` بررسی کنید.
5. تست عملی در Android WebView و Windows/Electron را گزارش کنید: فهرست رسانه‌ها بدون اینترنت؛ بارگذاری/ذخیرهٔ پروژه و اسپرایت؛ جست‌وجو و ترجمه؛ تغییر زبان؛ ورودی عددی؛ دیالوگ «ایجاد قطعه»؛ بازکردن/ویرایش لباس SVG؛ و تأیید خروج Windows. تست خودکار جای این بررسی روی دستگاه واقعی را کامل نمی‌گیرد. اگر دستگاه در دسترس نیست، آن را صریحاً «تست‌نشده» اعلام کنید.
6. پس از موفقیت، نسخهٔ مبنا و نکات جدید را در `MY_DEVELOP_CHANGES.md` به‌روز کنید. تغییر یا حذف هر قرارداد این فایل فقط با درخواست صریح صاحب پروژه مجاز است.
## لینک خانه و نصب ویندوز

لینک خانه/لوگوی اسکرچ در نوار بالا و حالت تمام‌صفحه باید در خروجی‌های اندروید و ویندوز به `https://scratch.behnamapps.ir/` برود. نصب‌کننده‌های x64 و ia32 باید با دوبار کلیک، بدون صفحه‌های Next/Finish یا انتخاب وظایف اختیاری نصب شوند؛ نمایش پیشرفت، میان‌برها، امکان حذف نصب و اجرای خودکار پس از نصب موفق عادی حفظ شود.

## تأیید ورودی شناور Android

در میزبان Android، دیالوگ نام‌گذاری با لمس پس‌زمینه بسته نشود (`shouldCloseOnOverlayClick=false`). در WebView، انتخاب «پیام جدید» روی pointerup دیالوگ را می‌سازد و click همان لمس ممکن است به overlay جدید برسد؛ بستن از طریق دکمه‌های دیالوگ حفظ شود. رفتار کلیک بیرون دیالوگ در دسکتاپ تغییر نکند.

محدودیت اندازهٔ دیالوگ بومی نسبت به overlay ثابت با درصد محاسبه شود؛ روی گوشی آزمایش‌شده `calc(100vh - 16px)` با وجود `innerHeight=512` به صفر تبدیل شد و دیالوگ را به لبهٔ ۸پیکسلی کاهش داد. جایگزینی آن با `calc(100% - 16px)` اندازهٔ صحیح پنجره را حفظ می‌کند.

در Android، دیالوگ نام‌گذاری (از جمله پیام جدید) باید پیش از بازشدن ورودی بومی رسم شود و در ارتفاع کم افقی قابل مشاهده و اسکرول باشد. وجود `AndroidScratchTextInput` میزبان بومی را مشخص می‌کند. تأیید ورودی بالای کیبورد فقط متن را ثبت می‌کند و فوکوس را به خود دیالوگ برمی‌گرداند؛ ساخت پیام/متغیر تنها با تأیید داخل دیالوگ انجام شود. بریج نباید با پایان ویرایش Enter بفرستد یا خودکار دیالوگ را تأیید کند.

## قفل درگ لمسی Android

WebView برنامه با User-Agent ویندوز اجرا می‌شود؛ تشخیص این قابلیت علاوه بر User-Agent اندروید باید origin دقیق `https://appassets.androidplatform.net` را بشناسد. شرط بیلد Android همچنان الزامی است؛ صرف لمس‌پذیربودن دستگاه کافی نیست.

در بیلد آفلاین و فقط روی Android، گزینهٔ «جلوگیری از کشیدن شکلک‌ها هنگام اجرا» زیر Color mode قرار دارد؛ پیش‌فرض خاموش و انتخاب آن در دستگاه ذخیره می‌شود. با فعال‌بودن گزینه، از پرچم تا توقف همه یا بارگذاری پروژهٔ دیگر، فقط درگ لمسی صحنه مسدود می‌شود؛ مختصات، وضعیت فشردن ماوس و رویدادهای کلیک همچنان به VM ارسال می‌شوند. پایان طبیعی اسکریپت‌ها قفل را باز نمی‌کند. ویژگی draggable پروژه و فایل sb3 تغییر نکند. ماوس واقعی، Windows و بیلد استاندارد این محدودیت را ندارند. Windows همچنان از همان فایل‌های آفلاین استفاده می‌کند؛ تشخیص Android در زمان اجرا ضروری است.

## خط دور انتخاب بلوک در RTL

`src/lib/rtl-selection-outline.js` در شروع اتصال Scratch Blocks نصب می‌شود. اگر خط دور انتخاب پیش از اولین render ساخته شود، `flipRTL` باید transform مسیر اصلی را به همان خط دور هم اعمال کند؛ وگرنه هنگام کشیدن بلوک از flyout، خط دور در جهت مخالف دیده می‌شود. این اصلاح برای فارسی و عربی و هر دو تم کلاسیک/گربه‌ای است؛ مسیر LTR و فرزندان غیرمرتبط نباید تغییر کنند. هنگام ارتقای Blockly یا Scratch Blocks این قرارداد را دوباره آزمایش کنید.
