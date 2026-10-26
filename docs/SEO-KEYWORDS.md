# Słodko Mi: keyword map for PL, EN, RU and UK

**Sources.** This map merges four research passes from 2026-10-26. I also checked it against the repo files `src/data/products.json`, `site.json`, `reviews.json`, `pages/home.json`, `src/pages/ProductPage.tsx` and `src/lib/schema-org.ts`.

**How demand was judged.** The Polish evidence comes from Google Autocomplete (hl=pl, gl=pl). The EN, RU and UK evidence comes from looking at search results through a US-based search tool that is not Google. No keyword-volume tool was used, so every priority here is a judgement from those signals, not a measured volume.

**Conventions and conflicts resolved**
- **Titles.** They follow the site's existing template `%s | Słodko Mi`, so the suffix adds 12 characters. Every title below was counted with that suffix and is 60 characters or less. Every meta description was counted and is 155 or less.
- **Slugs.** The real slugs in `products.json` are `klasyczna-z-lukrem`, `klasyczna-z-serkiem`, `biscoff`, `oreo`, `szarlotka`, `sernik-z-truskawka` and `malina-z-kokosem`. The privacy page is `/polityka-prywatnosci`. Ignore the slugs used in the research files (for example `sernik-truskawka`, `malina-kokos` and `szarlotka-z-kruszonka-i-karmelem`).
- **Flavour copy.** It only uses components listed in `products.json`:
  - Biscoff: creamy topping, caramel and crushed Biscoff cookies. The research guessed "Lotus spread", which is not in the data, so it is not claimed.
  - Sernik: cheesecake cream, strawberry, crumble and white chocolate.
  - Oreo: Oreo in the filling, Oreo cream, crushed cookies and a milk chocolate glaze.
- **Prices.** The only price in the data is Oreo at 24 zł, and `catalog.showPrices` is false. Leave "24 zł" out of the Oreo meta descriptions until prices show on the page.
- **Rating.** `reviews.json` (fetched 2026-10-26) confirms 4.9 from 220 Google reviews. The biznes-top figure of 186 reviews is older.
- **FAQ markup.** The EN research suggested FAQ rich results are open ground. That is unlikely: since August 2023 Google has shown FAQ rich results only for well-known government and health sites. The site already outputs FAQPage markup, which is fine to keep, but don't expect the questions to show in search results. Review stars are also not possible, because Google treats a business marking up its own reviews as self-serving. The code already leaves that markup out.
- **Sunday opening.** Sunday is a selling point against CYNAMONKA (Jeżyce) and Polivalente, which are both closed on Sundays. It is not a selling point against Cynamonki (23 Lutego), which is open at weekends and closed on Monday.

---

## 1. Opportunity per language

**PL: the only language with demand evidence (Google Autocomplete).**
- "cynamonki poznań" has more than 20 autocomplete modifiers: menu, cennik, ceny, godziny otwarcia, dostawa, wolt, opinie, zdjęcia, kcal, wilda, 28 czerwca, hetmanska, and others.
- People already search for Słodko Mi specifically: "cynamonki poznan 28 czerwca", "cynamonki hetmanska poznan", "cynamonki wilda", and "słodko mi smakuje ci opinie / menu / zdjęcia".
- Part of the demand for the head term is people looking for the café literally named "Cynamonki" (23 Lutego 9). That search page is held by Wolt, Instagram, TikTok and news lists.
- None of the cinnamon-roll competitors has a real website.
- **Realistic organic wins:**
  - Wilda, street-name and brand queries
  - menu and price queries
  - flavour + kcal queries
  - "cukiernia otwarta w niedzielę"
- "najlepsze cynamonki" and "gdzie zjeść cynamonki" are won through outside listings and coverage, not on-page work: the Głos Wielkopolski list republished each autumn, visitpoznan.pl, mytujemy.pl and TikTok.

**EN: low demand, aggregators own the results.**
- Low demand is an estimate: autocomplete only shows "cinnamon roll(s) poznan".
- The results pages belong to aggregators:
  - Restaurant Guru's cinnamon-roll list (Cynamonki is #1 with 4.8 from 663; Słodko Mi is not on it)
  - TripAdvisor's bakery list (the top entry has only 8 reviews)
  - Wanderlog, Tablejourney and visitpoznan.pl (EN)
- Flavour + Poznań queries ("Biscoff cinnamon roll Poznan", "Oreo cinnamon roll Poznan") return only recipes, so the flavour pages could win them (estimate).
- **Main levers:** get listed on TripAdvisor, Restaurant Guru and visitpoznan.pl, and make the EN pages answer practical questions: where the entrance is, card payments, English, Sunday hours and Wolt.

**RU: no competition at all; demand unknown.**
- No Russian-language page about cinnamon rolls or cukiernie in Poznań exists. Russian queries return recipes and Cinnabon outlets in Russia, Belarus and Uzbekistan.
- There is no volume data. The likely audience is Belarusians (25% of registered foreigners, per a 2025 Poznań City Hall report) and Russian-speaking Ukrainians.
- Because nobody competes, it is cheap to win "синнабоны / булочки с корицей + в Познани".
- Cinnabon is a trademark: always write "синнабоны (булочки с корицей)" and never imply a link to the chain.

**UK: same as RU, no competition.**
- Ukrainian searches returned no relevant local results at all.
- Audience size, from the Poznań City Hall report (badam.poznan.pl, 27.08.2025):
  - mobile-phone data at the end of 2024 counted about 68.8k Ukrainians in Poznań
  - about 2.6k are Ukrainian full-time students
- Many probably search in Polish or Russian (estimate), so the /uk/ pages should also include the Polish terms: cynamonki, Wilda, Hetmańska.
- intravel.net/uk is the only Ukrainian aggregator that ranks for Poznań cafés.

**Suggested order of effort:**
1. Google Business Profile and PL on-page fixes.
2. Outside listings, which serve both PL and EN.
3. The UK and RU pages: little effort, no competition.
4. EN on-page polish.

---

## 2. Page-by-page map

### 2.1 Polish (`/`)

**Home**
- **Target:** cynamonki Poznań, cynamonki Wilda
- **Secondary:** cukiernia Wilda; kawiarnia Wilda; cynamonki 28 Czerwca / Hetmańska; Słodko Mi Smakuje Ci opinie / menu
- **Title (55):** Cynamonki Poznań, Wilda – świeże codziennie | Słodko Mi
- **Meta (147):** Świeże cynamonki na Wildzie: 7 smaków, kawa na miejscu i na wynos, dostawa Wolt. 4,9/5 w Google. 28 Czerwca 1956 r. 177/13, wejście od Hetmańskiej.

**klasyczna-z-lukrem**
- **Target:** cynamonka z lukrem
- **Secondary:** klasyczna cynamonka; cynamonka z lukrem kcal
- **Title (56):** Klasyczna cynamonka z lukrem – Poznań, Wilda | Słodko Mi
- **Meta (150):** Klasyczna cynamonka z lukrem: puszyste ciasto drożdżowe, maślano-cynamonowe nadzienie i lukier. Świeża codziennie na Wildzie. Wt–nd 10–19, także Wolt.

**klasyczna-z-serkiem**
- **Target:** cynamonka z serkiem
- **Secondary:** cynamonka z kremem serkowym; cynamonka z serkiem kcal
- **Title (55):** Cynamonka z serkiem (krem serkowy) – Poznań | Słodko Mi
- **Meta (148):** Cynamonka z serkiem: klasyczna cynamonka pod grubą warstwą kremu na serku. Pieczona codziennie na Wildzie w Poznaniu. Na miejscu, na wynos i w Wolt.

**biscoff**
- **Target:** cynamonka Biscoff
- **Secondary:** cynamonka Lotus; cynamonka Biscoff kcal
- **Title (53):** Cynamonka Biscoff (Lotus) – Poznań, Wilda | Słodko Mi
- **Meta (148):** Cynamonka Biscoff: kremowy wierzch, karmel i pokruszone ciasteczka Biscoff (Lotus). Świeża codziennie w Słodko Mi na Wildzie. Na miejscu lub z Wolt.

**oreo**
- **Target:** cynamonka Oreo
- **Secondary:** cynamonki Oreo; cynamonka Oreo kcal
- **Title (56):** Cynamonka Oreo z kremem i czekoladą – Poznań | Słodko Mi
- **Meta (135):** Cynamonka Oreo: nadzienie z Oreo, krem z Oreo, pokruszone ciasteczka i polewa z mlecznej czekolady. 24 zł. Poznań, Wilda, także w Wolt.

**szarlotka**
- **Target:** cynamonka szarlotka
- **Secondary:** cynamonka z jabłkiem; cynamonka z kruszonką i karmelem
- **Title (54):** Cynamonka szarlotka z kruszonką i karmelem | Słodko Mi
- **Meta (148):** Cynamonka jak szarlotka: jabłka, cynamon, chrupiąca kruszonka i karmel. Jeden z naszych bestsellerów, świeży codziennie na Wildzie w Poznaniu. Wolt.

**sernik-z-truskawka**
- **Target:** cynamonka sernik z truskawką
- **Secondary:** cynamonka z truskawkami; cynamonka z sernikiem
- **Title (52):** Cynamonka sernik z truskawką i kruszonką | Słodko Mi
- **Meta (149):** Cynamonka sernik z truskawką: sernikowy krem, truskawka, kruszonka i biała czekolada. Bestseller Słodko Mi z Wildy w Poznaniu. Na miejscu lub z Wolt.

**malina-z-kokosem**
- **Target:** cynamonka malina kokos
- **Secondary:** cynamonka malinowa; cynamonki z kokosem
- **Title (54):** Cynamonka malina z kokosem – Poznań, Wilda | Słodko Mi
- **Meta (149):** Cynamonka malina z kokosem: kwaskowe maliny, krem i wiórki kokosowe. Świeża codziennie w Słodko Mi na Wildzie w Poznaniu. Na miejscu, na wynos, Wolt.

**polityka-prywatnosci**
- **Target:** none
- **Title (32):** Polityka prywatności | Słodko Mi
- **Meta:** Jak Słodko Mi przetwarza dane osobowe i pliki cookies na tej stronie.

**Home headings**
- **H1:** keep the hero slogan "TEJ, POZNAŃ… CZAS NA CYNAMONKĘ". It already contains "Poznań" and "cynamonkę".
- **Hero description:** start it with "Świeże cynamonki na Wildzie w Poznaniu…".
- **H2 changes:**
  - "Poznaj nasze smaki." → "Poznaj nasze smaki cynamonek."
  - Add an H2 "Menu i ceny" once prices are shown.
  - "Wpadnij na Wildę." → "Wpadnij na Wildę – dojazd i godziny otwarcia."
  - Add an H2 "Cynamonki z dostawą przez Wolt".
  - Keep "Nie wierz nam na słowo." (the "Opinie z Google" sticker carries the meaning) and "Pytania i odpowiedzi."

**Flavour pages**
- **H1:** today the H1 is just the product name ("Oreo"). It should include the word "Cynamonka":
  - Cynamonka klasyczna z lukrem
  - Cynamonka klasyczna z serkiem
  - Cynamonka Biscoff
  - Cynamonka Oreo
  - Cynamonka szarlotka z kruszonką i karmelem
  - Cynamonka sernik z truskawką i kruszonką
  - Cynamonka malina z kokosem
- **H2 pattern:**
  - Skład i alergeny
  - Waga, kalorie i cena
  - Gdzie kupić: na Wildzie lub przez Wolt
  - Inne smaki cynamonek

**Home FAQ.** "AC" means the phrase was seen in Google Autocomplete.
1. "Ile kosztuje cynamonka?"
   - Status: new.
   - Evidence: AC menu, cennik, ceny, cena; "ile kosztuje cynamonka w cukierni".
2. "Czy jesteście otwarci w niedzielę? A w poniedziałek?"
   - Status: new.
   - Evidence: AC "cukiernia otwarta w niedzielę poznań", "otwarte teraz".
3. "Gdzie dokładnie jesteście?"
   - Status: already on the site.
   - Evidence: AC "cynamonki hetmanska poznan", "cynamonki poznan 28 czerwca".
4. "Czy macie dostawę?"
   - Status: already on the site. Add the delivery area and say which flavours are on Wolt.
   - Evidence: AC dostawa, wolt.
5. "Ile kalorii ma cynamonka?"
   - Status: new; needs data from the owner.
   - Evidence: AC "cynamonki poznan kcal".
6. "Czy mogę zamówić więcej cynamonek?"
   - Status: already on the site. Add the minimum quantity and how much notice is needed.
   - Evidence: AC "cynamonki na zamówienie".

Optional, after the owner confirms:
- "Czy można przyjść z psem?" (AC "kawiarnia z psem poznań"; biznes-top lists the shop as dog-friendly)
- "Czy macie cynamonki wegańskie lub bezglutenowe?" (reported by the PL research; not checked)

**Flavour-page FAQ**
- "Ile kalorii ma cynamonka {smak}?" (AC: cynamonka z lukrem / z serkiem / biscoff / oreo kcal)
- "Ile kosztuje i ile waży?"
- "Czy zamówię ją przez Wolt?"
- Biscoff page only: "Czy to cynamonka Lotus?" (AC "cynamonka lotus")

**Body copy**
- Use "cynamonki/cynamonka" throughout.
- Mention "bułeczki cynamonowe" and "cinnamon rolls" once each.
- Avoid "ślimaczki cynamonowe": that search page is all recipes.
- Always write "177/13" together with "wejście od ul. Hetmańskiej".

### 2.2 English (`/en/`)

**Home**
- **Target:** cinnamon rolls Poznań / Poznan
- **Secondary:** cinnamon roll bakery Poznan; best cinnamon rolls in Poznan; cafe Wilda Poznan; coffee and cake Poznan
- **Title (57):** Cinnamon Rolls in Poznań, Wilda – Baked Daily | Słodko Mi
- **Meta (152):** Fresh cinnamon rolls baked daily in Wilda, Poznan: 7 flavours incl. Biscoff and Oreo, coffee to stay or go, Wolt delivery. 4.9 on Google. Tue–Sun 10–19.

**klasyczna-z-lukrem**
- **Target:** glazed cinnamon roll Poznan
- **Secondary:** classic cinnamon roll; cinnamon roll with icing
- **Title (50):** Classic Glazed Cinnamon Roll in Poznań | Słodko Mi
- **Meta (153):** Classic cinnamon roll with sugar glaze: soft, hand-rolled yeast dough with a butter-cinnamon filling. Baked fresh daily in Wilda, Poznan. Eat in or Wolt.

**klasyczna-z-serkiem**
- **Target:** cream cheese cinnamon roll Poznan
- **Secondary:** cinnamon roll with cream cheese frosting
- **Title (48):** Cream Cheese Cinnamon Roll in Poznań | Słodko Mi
- **Meta (148):** Cinnamon roll under a thick layer of cream cheese frosting. Baked fresh every day at Słodko Mi in Wilda, Poznan. Eat in, take away or order on Wolt.

**biscoff**
- **Target:** Biscoff cinnamon roll Poznan
- **Secondary:** Lotus Biscoff cinnamon roll; speculoos cinnamon roll
- **Title (43):** Biscoff Cinnamon Roll in Poznań | Słodko Mi
- **Meta (147):** Biscoff cinnamon roll: creamy topping, caramel and crushed Biscoff cookies. Baked fresh daily in Wilda, Poznan. Eat in, take away or order on Wolt.

**oreo**
- **Target:** Oreo cinnamon roll Poznan
- **Secondary:** cookies and cream cinnamon roll
- **Title (40):** Oreo Cinnamon Roll in Poznań | Słodko Mi
- **Meta (145):** Oreo cinnamon roll: Oreo in the filling, Oreo cream, crushed cookies and milk chocolate glaze. 24 zł. Baked daily in Wilda, Poznan. Also on Wolt.

**szarlotka**
- **Target:** apple crumble cinnamon roll Poznan
- **Secondary:** apple pie cinnamon roll; caramel apple cinnamon roll
- **Title (57):** Apple Crumble & Caramel Cinnamon Roll, Poznań | Słodko Mi
- **Meta (139):** Polish szarlotka (apple pie) in a cinnamon roll: apples, crunchy crumble and caramel. A Słodko Mi bestseller, baked daily in Wilda, Poznan.

**sernik-z-truskawka**
- **Target:** strawberry cheesecake cinnamon roll Poznan
- **Secondary:** cheesecake cinnamon roll
- **Title (55):** Strawberry Cheesecake Cinnamon Roll, Poznań | Słodko Mi
- **Meta (148):** Strawberry cheesecake cinnamon roll: Polish sernik cream, strawberry, crumble and white chocolate. A bestseller, baked fresh daily in Wilda, Poznan.

**malina-z-kokosem**
- **Target:** raspberry coconut cinnamon roll Poznan
- **Secondary:** raspberry cinnamon roll
- **Title (53):** Raspberry & Coconut Cinnamon Roll, Poznań | Słodko Mi
- **Meta (144):** Raspberry and coconut cinnamon roll: tart raspberries, cream and coconut flakes on a soft roll. Baked fresh daily at Słodko Mi in Wilda, Poznan.

**privacy**
- **Target:** none
- **Title (26):** Privacy Policy | Słodko Mi
- **Meta:** How Słodko Mi handles personal data and cookies on this website.

**Home headings**
- **H1:** "Hey Poznań… it's cinnamon roll time"
- **H2s:**
  - Fresh cinnamon rolls, baked daily in Wilda
  - 7 cinnamon roll flavours – menu & prices
  - Rated 4.9 on Google (220 reviews)
  - How to find us – entrance from ul. Hetmańska
  - Opening hours: Tue–Sun 10:00–19:00, closed Monday
  - Delivery via Wolt
  - FAQ

**Flavour pages**
- **H1:**
  - Classic Glazed Cinnamon Roll
  - Cream Cheese Cinnamon Roll
  - Biscoff Cinnamon Roll
  - Oreo Cinnamon Roll
  - Apple Pie (Szarlotka) Cinnamon Roll with Crumble & Caramel
  - Strawberry Cheesecake (Sernik) Cinnamon Roll
  - Raspberry & Coconut Cinnamon Roll
- **H2 pattern:**
  - What's inside & allergens
  - Weight, calories & price
  - Eat in, take away or order on Wolt
  - More flavours

**Home FAQ**
1. "Do you accept card payments?"
   - Why: Wanderlog reviewers often flag cafés that take only cash or BLIK.
   - Note: the Google-derived listing shows cards and NFC. Confirm BLIK with the owner.
2. "Do you speak English? Is there an English menu?"
   - Why: travel guides say English is mostly spoken in tourist areas.
   - Note: answer only if it is true.
3. "Where is the entrance?"
   - Why: the address is on 28 Czerwca, but the door is on Hetmańska.
4. "Are you open on Sunday? On Monday?"
5. "Do you deliver?" (Wolt)
6. "What is a cynamonka, and what are szarlotka and sernik?"
   - Why: the flavour searches return only recipes.

Optional, after the owner confirms: "Can I bring my dog?" and "Do you have vegan or gluten-free options?"

**Flavour-page FAQ**
- "What's in it and which allergens?"
- "How much is it?"
- "Can I order it on Wolt?"

**Body copy**
- Write "Poznań" in visible copy and the H1.
- Write "Poznan" in meta descriptions, image alt text and the FAQ.
- Use "cinnamon buns" once as a synonym.
- Give the Polish name next to each flavour (for example "cynamonka Oreo").

### 2.3 Russian (`/ru/`)

**Home**
- **Target:** синнабоны в Познани
- **Secondary:** булочки с корицей Познань; кондитерская Познань; кофейня Познань; где поесть сладкое в Познани
- **Title (56):** Синнабоны в Познани – кондитерская на Вильде | Słodko Mi
- **Meta (143):** Свежие синнабоны (булочки с корицей) в Познани: 7 вкусов, кофе, на месте или с собой, доставка Wolt. Вильда, вход с ул. Hetmańska. Вт–Вс 10–19.

**klasyczna-z-lukrem**
- **Target:** классический синнабон с глазурью
- **Secondary:** булочка с корицей с глазурью
- **Title (54):** Классический синнабон с глазурью в Познани | Słodko Mi
- **Meta (147):** Классическая булочка с корицей: мягкое дрожжевое тесто, сливочно-коричная начинка и сахарная глазурь. Свежая каждый день на Вильде в Познани. Wolt.

**klasyczna-z-serkiem**
- **Target:** синнабон с крем-чизом
- **Secondary:** булочка с корицей со сливочным сыром
- **Title (43):** Синнабон с крем-чизом в Познани | Słodko Mi
- **Meta (143):** Синнабон с толстым слоем сливочно-сырного крема (крем-чиз). Печём каждый день в Słodko Mi на Вильде, Познань. На месте, с собой или через Wolt.

**biscoff**
- **Target:** синнабон Biscoff
- **Secondary:** синнабон Бискофф / Lotus
- **Title (38):** Синнабон Biscoff в Познани | Słodko Mi
- **Meta (150):** Синнабон Biscoff: кремовый верх, карамель и печенье Biscoff (Lotus). Свежая выпечка каждый день в Słodko Mi, Познань, Вильда. На месте или через Wolt.

**oreo**
- **Target:** синнабон Орео
- **Secondary:** булочка с корицей Oreo
- **Title (42):** Синнабон Орео (Oreo) в Познани | Słodko Mi
- **Meta (134):** Синнабон Oreo: кусочки Oreo в начинке, крем Oreo, крошка печенья и молочный шоколад. 24 zł. Słodko Mi, Познань (Вильда), также в Wolt.

**szarlotka**
- **Target:** синнабон шарлотка
- **Secondary:** синнабон с яблоком и карамелью
- **Title (55):** Синнабон шарлотка: яблоко, крошка, карамель | Słodko Mi
- **Meta (138):** Синнабон как шарлотка: яблоки, корица, хрустящая крошка (штрейзель) и карамель. Хит продаж Słodko Mi. Свежий каждый день, Познань, Вильда.

**sernik-z-truskawka**
- **Target:** синнабон чизкейк с клубникой
- **Secondary:** клубничный синнабон
- **Title (50):** Синнабон чизкейк с клубникой в Познани | Słodko Mi
- **Meta (143):** Синнабон чизкейк с клубникой: крем-чизкейк, клубника, крошка и белый шоколад. Хит продаж Słodko Mi в Познани (Вильда). На месте или через Wolt.

**malina-z-kokosem**
- **Target:** синнабон с малиной и кокосом
- **Secondary:** малиновый синнабон
- **Title (50):** Синнабон с малиной и кокосом в Познани | Słodko Mi
- **Meta (148):** Синнабон с малиной и кокосом: кисловатая малина, крем и кокосовая стружка. Свежий каждый день в Słodko Mi, Познань, Вильда. На месте или через Wolt.

**privacy**
- **Target:** none
- **Title (39):** Политика конфиденциальности | Słodko Mi
- **Meta:** Как Słodko Mi обрабатывает персональные данные и файлы cookie на этом сайте.

**Home headings**
- **H1:** "ТЕЙ, Познань… пора за синнабоном"
- **H2s:**
  - Свежие булочки с корицей каждый день – Вильда, Познань
  - 7 вкусов синнабонов: меню и цены
  - Отзывы: 4,9 в Google (220)
  - Как нас найти: вход с ul. Hetmańska
  - Часы работы: вт–вс 10:00–19:00, пн – выходной
  - Доставка через Wolt: как заказать
  - Вопросы и ответы

**Flavour pages**
- **H1:**
  - Классический синнабон с глазурью
  - Синнабон с крем-чизом
  - Синнабон Biscoff
  - Синнабон Oreo
  - Синнабон «Шарлотка» с крошкой и карамелью
  - Синнабон «Чизкейк с клубникой»
  - Синнабон с малиной и кокосом
- **Under each H1:** a line with the Polish name, for example "по-польски: cynamonka Oreo".

**Home FAQ.** No Russian-language page answers any of these today.
1. «Где купить синнабоны в Познани?»
2. «Есть ли в Познани Cinnabon?»
   - Answer that the shop bakes its own cinnamon rolls and has no link to the Cinnabon chain.
   - Do not claim there is no Cinnabon in Poznań. That was not confirmed.
3. «Как по-польски "булочка с корицей"?» (cynamonka / cynamonki: the word people need for Wolt and Google Maps)
4. «Как заказать доставку через Wolt?» (Wolt shows Poznań in Polish or English only)
5. «Где вход?» (28 Czerwca 1956 r. 177/13, entrance from ul. Hetmańska)
6. «Вы работаете в понедельник и в воскресенье?»

Optional:
- «Можно оплатить картой или BLIK?»
- «Говорите ли вы по-русски?» (only if true)

**Flavour-page FAQ**
- «Какие аллергены?»
- «Сколько стоит?»
- Sernik page only: «Это сырник?» Answer: no, Polish sernik is a cheesecake. In Russian, "сырник" means a fried cottage-cheese pancake.

**Body copy**
- Use "синнабоны" as the main word and "булочки с корицей" in the H1 and H2s.
- Use the one-н spelling "синабон" once.
- Always write "в Познани". Never write "в Познане", even though Restaurant Guru uses it.
- Spell the district "Вильда".
- Keep street names in Latin script.
- Mention "cynamonki" once.

### 2.4 Ukrainian (`/uk/`)

**Home**
- **Target:** сінабони в Познані
- **Secondary:** булочки з корицею Познань; кондитерська Познань; кав'ярня Познань; де поїсти солодке в Познані; кав'ярня Вільда
- **Title (55):** Сінабони в Познані – кондитерська на Вільді | Słodko Mi
- **Meta (141):** Свіжі сінабони (булочки з корицею) у Познані: 7 смаків, кава на місці або з собою, доставка Wolt. Вільда, вхід з вул. Hetmańska. Вт–Нд 10–19.

**klasyczna-z-lukrem**
- **Target:** класичний сінабон з глазур'ю
- **Secondary:** булочка з корицею з глазур'ю
- **Title (50):** Класичний сінабон з глазур'ю в Познані | Słodko Mi
- **Meta (142):** Класична булочка з корицею: м'яке дріжджове тісто, вершкова начинка з корицею і цукрова глазур. Свіжа щодня на Вільді у Познані. Також у Wolt.

**klasyczna-z-serkiem**
- **Target:** сінабон з крем-сиром
- **Secondary:** сінабон з сирним кремом
- **Title (42):** Сінабон з крем-сиром у Познані | Słodko Mi
- **Meta (139):** Сінабон з товстим шаром крему на вершковому сирі (крем-сир). Печемо щодня у Słodko Mi на Вільді, Познань. На місці, з собою або через Wolt.

**biscoff**
- **Target:** сінабон Biscoff
- **Secondary:** сінабон Біскоф
- **Title (37):** Сінабон Biscoff у Познані | Słodko Mi
- **Meta (148):** Сінабон Biscoff: кремовий верх, карамель і подрібнене печиво Biscoff (Lotus). Свіжа випічка щодня у Słodko Mi, Познань, Вільда. На місці або у Wolt.

**oreo**
- **Target:** сінабон Орео
- **Secondary:** булочка з корицею Oreo
- **Title (41):** Сінабон Орео (Oreo) у Познані | Słodko Mi
- **Meta (133):** Сінабон Oreo: шматочки Oreo в начинці, крем Oreo, крихта печива і молочний шоколад. 24 zł. Słodko Mi, Познань (Вільда), також у Wolt.

**szarlotka**
- **Target:** сінабон шарлотка
- **Secondary:** яблучний сінабон з карамеллю; сінабон зі штрейзелем
- **Title (57):** Сінабон шарлотка: яблуко, штрейзель, карамель | Słodko Mi
- **Meta (143):** Сінабон як шарлотка: яблука, кориця, хрусткий штрейзель і карамель. Хіт продажів Słodko Mi. Свіжий щодня, Познань, Вільда. На місці або у Wolt.

**sernik-z-truskawka**
- **Target:** сінабон чізкейк з полуницею
- **Secondary:** полуничний сінабон
- **Title (49):** Сінабон чізкейк з полуницею у Познані | Słodko Mi
- **Meta (143):** Сінабон чізкейк з полуницею: крем-чізкейк, полуниця, штрейзель і білий шоколад. Хіт продажів Słodko Mi у Познані (Вільда). На місці або у Wolt.

**malina-z-kokosem**
- **Target:** сінабон з малиною і кокосом
- **Secondary:** малиновий сінабон
- **Title (49):** Сінабон з малиною і кокосом у Познані | Słodko Mi
- **Meta (143):** Сінабон з малиною і кокосом: кислинка малини, крем і кокосова стружка. Свіжий щодня у Słodko Mi, Познань, Вільда. На місці, з собою або у Wolt.

**privacy**
- **Target:** none
- **Title (37):** Політика конфіденційності | Słodko Mi
- **Meta:** Як Słodko Mi обробляє персональні дані та файли cookie на цьому сайті.

**Home headings**
- **H1:** "ТЕЙ, Познань… час на сінабон"
- **H2s:**
  - Свіжі булочки з корицею щодня – Вільда, Познань
  - 7 смаків сінабонів: меню і ціни
  - Відгуки: 4,9 у Google (220)
  - Як нас знайти: вхід з вул. Hetmańska
  - Графік: вт–нд 10:00–19:00, пн – вихідний
  - Доставка через Wolt
  - Питання та відповіді

**Flavour pages**
- **H1:**
  - Класичний сінабон з глазур'ю
  - Сінабон з крем-сиром
  - Сінабон Biscoff
  - Сінабон Oreo
  - Сінабон «Шарлотка» зі штрейзелем і карамеллю
  - Сінабон «Чізкейк з полуницею»
  - Сінабон з малиною і кокосом
- **Under each H1:** a line with the Polish name.

**Home FAQ**
1. «Де купити сінабони в Познані?»
2. «Як польською "булочка з корицею"?» (cynamonka)
3. «Як замовити доставку через Wolt?» Check whether the Wolt app actually offers Ukrainian before saying so.
4. «Де вхід?»
5. «Чи працюєте в понеділок і в неділю?»
6. «Чи можна оплатити карткою або BLIK? Ціни в злотих?»

Optional: «Чи говорите українською?» (only if true)

**Flavour-page FAQ**
- «Які алергени?»
- «Скільки коштує?»
- Sernik page only: «Sernik — це сирник?» Answer: no, it is a cheesecake ("чізкейк"). In Ukrainian, "сирник" is also a fried cottage-cheese pancake.

**Body copy**
- Use "сінабони" as the main word and "булочки з корицею" in the H1 and H2s.
- Use the variant spellings "сіннабони" and "синабони" once each.
- Write "у/в Познані". Avoid the non-standard "Познаня" that intravel.net/uk uses.
- Spell the district "Вільда".
- Mention "cynamonki" and "Hetmańska" in Latin script.

---

## 3. Local SEO checklist

**Step 0: move to your own domain first.**
- `site.json` sets the site URL to `https://sunlucki.github.io/SLODKO-MI`.
- Move to your own domain before pointing the Google Business Profile at the site and before building listings. Otherwise every link has to be redone later.

**Address and phone: use this exact text everywhere**
```
Słodko Mi Smakuje Ci?
ul. 28 Czerwca 1956 r. 177/13 (wejście od ul. Hetmańskiej)
61-525 Poznań
+48 511 228 221
pn: nieczynne · wt–nd: 10:00–19:00
```

**Google Business Profile.** Keep it in Polish. Google machine-translates the profile for EN, UK and RU users, so write short, plain sentences.

- **Name:** exactly "Słodko Mi Smakuje Ci?". Adding keywords such as "cynamonki Poznań" breaks Google's guidelines and risks suspension.
- **Categories:**
  - Keep "Cukiernia" as the primary category, as listed on biznes-top.
  - Add secondary categories only if they are true: café (Kawiarnia), bakery.
  - Check the "kawiarnia dla psów" (dog café) category biznes-top shows. If the shop is just dog-friendly, remove that category and set the "dogs allowed" attribute instead.
- **Website field:**
  - biznes-top, which copies Google data, currently shows instagram.com.
  - Point it to the PL home page with `?utm_source=google&utm_medium=organic&utm_campaign=gbp`.
- **Order link:** `https://wolt.com/pl/pol/poznan/restaurant/slodko-mi-smakuje-ci` (taken from `site.json`). The research could not confirm this listing in search, so open it and check that it works.
- **Menu / Products:** add all 7 flavours with their Polish names, a real photo, the price and a link to each `/produkt/<slug>/` page.
- **Entrance:**
  - Put "wejście od ul. Hetmańskiej" in the first 250 characters of the description.
  - Add a labelled photo of the door on Hetmańska.
  - Check that the map pin sits at that entrance.
- **Special hours:** copy them from `site.json`:
  - 29.10: 10:30–19:00
  - 31.10: closed
  - 01.11 (Wszystkich Świętych): 10:00–19:00
  - 11.11 and the Christmas period: set early.
- **Attributes:**
  - dine-in, takeaway, delivery
  - cards / NFC (confirm BLIK)
  - toilet
  - dogs allowed (confirm)
  - wheelchair access (confirm)
- **Photos:**
  - Use only real photos of each flavour, the interior, the entrance and the team.
  - The site's "malina z kokosem" and hero images are AI illustrations; do not use them on the profile.
  - Add a "dziś na blasze" photo every week.
- **Posts:** weekly, in Polish, optionally with one short English line.
  - Flavour of the week, linked to its product page.
  - Holiday hours.
  - Before 11.11 (St Martin's Day): a "nie tylko rogale – spróbuj cynamonek z Wildy" post.
- **Review replies:**
  - Reply to every review within a few days, in the reviewer's language (PL, EN, UK or RU).
  - Mention the flavour they named. Don't copy and paste.
  - Ask for reviews with a QR code at the counter and on boxes.
  - No incentives: they break Google's policy.
  - Ask English-speaking guests to review on Google or TripAdvisor.
- **Name-clash check:** autocomplete and Too Good To Go link "Cukiernia Jagódka" to 28 Czerwca 177. If Maps shows a stale Jagódka listing there, suggest an edit — but only after confirming it no longer operates.

**Outside listings (citations)**

*Wolt (PL + EN)*
- Research found: `site.json` links to it, but search did not show it.
- Action: check the link. Make the name, address and hours identical. Use the same 7 flavour names as the site, a photo per flavour, and a PL and EN description.

*Facebook (PL)*
- Research found: the page exists (facebook.com/61591586317583).
- Action: set a vanity username, the Cukiernia category, the address with the Hetmańska note, hours, the website and a Wolt link.

*Instagram @slodkomi.poznan (PL, plus one EN line)*
- Research found: not indexed in web search.
- Action: bio "Cynamonki · Poznań Wilda · wejście od Hetmańskiej" with a link to the site.

*visitpoznan.pl (PL + EN)*
- Research found: not in "Gdzie zjeść słodkie" (about 73–75 places) or "Wilda" (12 places). Each listed venue gets a PL/EN profile page.
- Action: submit the shop to the city tourism office. This is probably the highest-value listing (estimate).

*TripAdvisor (EN)*
- Research found: no listing.
- Action: create one as a bakery or dessert place, with an English description. The bakery list has very few reviews, so a handful of tourist reviews could get Słodko Mi onto it.

*Restaurant Guru (EN + RU)*
- Research found: missing from the cinnamon-roll list (36 places).
- Action: claim the profile and add cinnamon rolls and photos. ru.restaurantguru.com mirrors the content in Russian.

*Orły Cukiernictwa (PL)*
- Research found: 2026 laureate, 9.8 from 171 ratings.
- Action: check the address and website on the profile. Use the badge only with the owner's OK.

*biznes-top.pl (PL)*
- Research found: shows the website as Instagram; the 4.69 from 186 figure is old.
- Action: it copies Google data, so fixing the Google Business Profile fixes it.

*gdziezjescpoznan.com/ru (RU)*
- Research found: not listed (in the part that was read).
- Action: request a listing. It is the only Russian-language Poznań directory found.

*intravel.net/uk (UK)*
- Research found: not on the café (148) or bakery (205) lists.
- Action: request a listing. It is the only Ukrainian aggregator found.

*gdziejemy.pl and poznaninfo.pl, Wilda café lists (PL)*
- Research found: not listed.
- Action: request inclusion.

*Głos Wielkopolski / naszemiasto, mytujemy.pl (PL)*
- Research found: not on the cinnamon-roll lists. Głos republishes its list every autumn.
- Action: send a PR pitch with photos and the 7 flavours. Also reach out to creators: @foodhunterki, @posen_food.

*Apple Business Connect and Bing Places (PL)*
- Research found: not checked (this is standard practice).
- Action: claim both. Apple Maps matters for tourists using iPhones.

*Too Good To Go (PL)*
- Only if the shop uses it. Make sure the listing says 177/13 and not just 177.

*HappyCow (EN)*
- Only if there is a vegan option.

**Measurement: this replaces the estimates above with real data**
- **Google Search Console:** set up a Domain property and filter queries by `/en/`, `/ru/` and `/uk/`. Review after 4–8 weeks and adjust the map.
- **Google Business Profile → Performance → search terms:** shows the actual words people used to find the profile, each month.

---

## 4. Content gaps to fill (priority order)

1. **Prices on the site**
   - Gap: `showPrices` is false, only Oreo has a price (24 zł), and `priceRange` is "20–40 zł".
   - Evidence: AC menu / cennik / ceny / cena, "ile kosztuje cynamonka w cukierni". Competitors show prices only on Wolt or Uber Eats.
   - Bonus: once prices are on, each flavour's structured data upgrades from MenuItem to Product + Offer.
   - Languages: all.
2. **SEO fields on product pages**
   - Gap: today the title is "Oreo | Słodko Mi", the meta is the short description, and the H1 is "Oreo".
   - Fix: add `seo.title` and `seo.description` per product, and per language when translations are added under `src/data/i18n/<locale>/`, which doesn't exist yet. Make the H1 include "Cynamonka" / "Cinnamon Roll" / "Синнабон" / "Сінабон".
   - Without this, the flavour rows in section 2 can't be applied.
   - Languages: all.
3. **Weight, kcal, ingredients and allergens per flavour**
   - Gap: `weight` exists in the schema but is empty. `ingredients` and `allergens` are empty for every flavour; Oreo has ingredients but no allergens.
   - Evidence: AC "kcal" for 4 flavours. Putka's product pages show the format.
   - Languages: all. Needs data from the owner.
4. **Hours written as text**
   - Content: "otwarte w niedzielę, w poniedziałek nieczynne", plus holiday hours.
   - Evidence: AC "cukiernia otwarta w niedzielę Poznań". CYNAMONKA and Polivalente are closed on Sundays.
   - Languages: all.
5. **Directions block**
   - Gap: the site only says "przystanek tuż obok" (a stop right next door).
   - Fix: name the stop, add a photo of the Hetmańska door, and give routes from Poznań Główny and Stary Rynek.
   - EN/RU/UK versions keep the Polish street names.
   - Languages: all.
6. **Vocabulary bridge**
   - cynamonka = cinnamon roll = синнабон / булочка с корицей = сінабон / булочка з корицею
   - szarlotka = apple pie
   - sernik = cheesecake, not сырник or сирник
   - Languages: EN, RU, UK.
7. **Practical FAQ for foreigners**
   - Payments: card and NFC per the listing; confirm BLIK.
   - Languages staff speak: only if true.
   - English menu.
   - Languages: EN, RU, UK.
8. **Dietary FAQ**
   - Vegan, gluten-free, lactose-free. An honest "no" still answers the query.
   - Masz Babo Placek wins searches on its vegan options.
   - Languages: all.
9. **Wolt block**
   - Delivery area and which flavours are on Wolt.
   - RU/UK versions: step-by-step ordering help, because Wolt shows Poznań in Polish or English only.
   - Languages: all.
10. **Larger orders and boxes**
    - The FAQ already says "write on Instagram or call". Add the minimum quantity, how much notice is needed, box sizes and prices.
    - Evidence: AC "cynamonki na zamówienie".
    - Languages: all.
11. **Freshness and availability**
    - When the trays come out, and whether flavours sell out. Reviews say the competitor Cynamonki sells out within about an hour.
    - Languages: all.
12. **Trust signals**
    - Add the Orły Cukiernictwa 2026 laureate badge (9.8), linked to the profile, if the owner agrees.
    - The Google 4.9 / 220 is already shown.
    - Languages: all.
13. **Real photos and translated alt text**
    - Replace the AI images for "malina z kokosem" and the hero.
    - Translate the image alt text for each language.
    - Matters for image search, where the flavour searches are currently all recipe photos.
    - Languages: all.
14. **Tourist section**
    - "Nie tylko rogale" (not only St Martin's croissants). Publish before 11 November.
    - Evidence: RU/UK/EN "what to eat in Poznań" results mention only the croissants.
    - Languages: EN, RU, UK, PL.
15. **Eat-in details**
    - Seating, toilet, Wi-Fi, whether laptops are welcome, accessibility, dogs (confirm).
    - Languages: all.

---

## 5. Competitors to watch

**Cynamonki** (ul. 23 Lutego 9; a TikTok post also mentions Fredry 7; production in Luboń)
- What it ranks for:
  - Owns "cynamonki Poznań" because its name matches the search exactly.
  - Its Wolt page shows for "cynamonki wolt".
  - #1 on Restaurant Guru for English searches (4.8 from 663).
  - Orły Piekarnictwa 9.4 from 702; Wolt 9.6/10.
- What to watch: a website launch or a new location, its Wolt rating, its flavour drops in Instagram stories. It is open at weekends and closed on Monday.
- How to beat it: a real site with a crawlable menu and prices, the Wilda searches, and the 7 fixed flavours.

**CYNAMONKA** (ul. Dąbrowskiego 56, Jeżyce)
- What it ranks for: "cynamonka Poznań" (singular), plus Jeżyce and Dąbrowskiego variants. TasteTown 5.0 from 109, with 1+1 deals.
- What to watch: it opens at 7:30 on weekdays and is closed on Sunday. Use your Sunday hours against it.

**FIKA** (ul. Różana 9A, Wilda)
- What it ranks for:
  - The only other cinnamon/cardamom bun place in Wilda.
  - "szwedzkie cynamonki", "kawiarnia Wilda".
  - Covered by mytujemy (10.03.2026) and Dynks.
  - TripAdvisor / Mindtrip 4.7 from 113.
- What to watch: it is your closest rival in the district, with a strong story and dog-friendly seating.

**Dziewczyny i Słodycze** (Górna Wilda 85)
- What it ranks for:
  - "kawiarnia Wilda", "słodkie śniadanie".
  - visitpoznan PL and EN, Wolt.
  - #2 on gdziejemy's Wilda list, Orły 2026 laureate.
- What to watch: it shows how much directory coverage is worth.

**Masz Babo Placek** (Małeckiego 36, Łazarz)
- What it ranks for: the only cinnamon-roll venue on visitpoznan's English sweets list. Vegan options, HappyCow, 4.85 from 669.
- What to watch: the vegan angle and how much the official tourist site's listing is worth.

**Pretty Cukiernia** (Strzelecka 8a)
- What it ranks for: "cynamonki pistacjowe Poznań", a search created by one viral TikTok.
- What to watch: a signature or seasonal flavour video can create search demand.

**Polivalente** (Górna Wilda 95)
- What it ranks for: "cukiernia Wilda".
- What to watch: it has its own site, but on-page SEO is weak and it is closed on Sunday. It doesn't sell cinnamon rolls.

**Putka** (Warsaw chain)
- What it ranks for: national flavour searches ("cynamonka biscoff / z malinami putka").
- What to watch: its product pages are the model to copy (nutrition per 100 g, allergens, breadcrumbs). Its weak points are no price and thin copy.

**Others named in cinnamon-roll lists:** Blask, Wypiek, Bardzo, Plon, Pan Kłos, Kuchnia PoWolność, Golden Ticket, Lastryko Cafe, Petit Paris Sołacz.

**Sites that own the search results** (monitor; list placement is the goal):
- Restaurant Guru (EN and RU)
- TripAdvisor, Wanderlog, Tablejourney
- visitpoznan.pl
- Głos Wielkopolski / naszemiasto autumn list
- mytujemy.pl, gdziejemy.pl, poznaninfo.pl
- gdziezjescpoznan.com/ru
- intravel.net/uk
- 34travel.me (RU guide)
- TikTok creators: @foodhunterki, @posen_food, @testeralgorytmu, @an_eat_a

**Name-confusion risks.** Always pair the brand with "Poznań" and "cynamonki".
- Słodko-Mat (Raszyńska 29)
- Słodko Słona Cafe (Wodna 24)
- Cukiernia Jagódka (tied to 28 Czerwca 177)
- Other businesses also called "Słodko Mi" (Szczecin, Rybnik, Bledzew, Jakubowice; Słodko Mi Sp. z o.o.)
