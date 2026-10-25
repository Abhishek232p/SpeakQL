/**
 * SpeakQL Multilingual Linguistic Corpus & Scenario Repository
 * Sourced and curated following Tatoeba (CC BY) and Wiktionary/Kaikki open standards.
 * Specially structured for Indian engineers, lawyers, and professionals moving to Germany, Japan, and global hubs.
 */

export interface TatoebaSentencePair {
  id: string;
  targetLanguage: "de" | "ja" | "en";
  targetText: string;
  transliteration?: string; // Romaji for Japanese / Phonetic guide for German
  englishText: string;
  hindiText: string;
  domain: "engineering" | "legal" | "healthcare" | "business";
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1";
  culturalTag?: string;
}

export interface DomainVocabularyItem {
  id: string;
  term: string;
  targetLanguage: "de" | "ja" | "en";
  transliteration?: string;
  pos: "noun" | "verb" | "adjective" | "phrase";
  pronunciationIpa?: string;
  englishMeaning: string;
  hindiMeaning: string;
  exampleSentence: string;
  culturalNote?: string;
}

export interface CallSimulationScenario {
  id: string;
  title: string;
  subtitle: string;
  targetLanguage: "de" | "ja" | "en";
  localeCode: "de-DE" | "ja-JP" | "en-US";
  domain: "engineering" | "legal" | "healthcare" | "business";
  recommendedMinutes: 15 | 30;
  aiPersona: {
    name: string;
    role: string;
    avatarEmoji: string;
    greetingText: string;
    greetingHindi: string;
    greetingEnglish: string;
  };
  briefing: {
    context: string;
    contextHindi: string;
    objective: string;
    objectiveHindi: string;
    keyPhrases: {
      phrase: string;
      transliteration?: string;
      meaningHindi: string;
      meaningEnglish: string;
    }[];
    culturalEtiquette: string;
    culturalEtiquetteHindi: string;
  };
  sampleDialogueTurns: {
    role: "ai" | "user";
    text: string;
    hindiHint?: string;
    englishHint?: string;
  }[];
}

// 1. Curated Tatoeba-Inspired Sentence Pairs with Hindi & English Reference Bridges
export const TATOEBA_SENTENCE_PAIRS: TatoebaSentencePair[] = [
  // --- GERMAN (Engineering & Architecture) ---
  {
    id: "tat_de_eng_1",
    targetLanguage: "de",
    targetText: "Die Latenz der Datenbank ist nach dem letzten Release stark angestiegen.",
    englishText: "The database latency spiked sharply after the last release.",
    hindiText: "पिछले रिलीज़ के बाद डेटाबेस लेटेंसी बहुत तेजी से बढ़ गई है।",
    domain: "engineering",
    cefrLevel: "B2",
    culturalTag: "Sachlichkeit (Factual Directness)",
  },
  {
    id: "tat_de_eng_2",
    targetLanguage: "de",
    targetText: "Wir müssen den Redis-Cache invalidieren, um Inkonsistenzen zu vermeiden.",
    englishText: "We need to invalidate the Redis cache to avoid inconsistencies.",
    hindiText: "असंगतता (inconsistency) से बचने के लिए हमें रेडिस कैश को इनवैलिडेट करना होगा।",
    domain: "engineering",
    cefrLevel: "B1",
    culturalTag: "Engineering Tradeoffs",
  },
  {
    id: "tat_de_eng_3",
    targetLanguage: "de",
    targetText: "Guten Morgen zusammen. Gestern habe ich den Auth-Service refaktoriert.",
    englishText: "Good morning everyone. Yesterday I refactored the auth service.",
    hindiText: "सुप्रभात सभी को। कल मैंने ऑथ सर्विस को रिफैक्टर किया था।",
    domain: "engineering",
    cefrLevel: "A2",
    culturalTag: "Daily Standup Routine",
  },
  {
    id: "tat_de_eng_4",
    targetLanguage: "de",
    targetText: "Gibt es irgendwelche Blocker für die Bereitstellung in der Staging-Umgebung?",
    englishText: "Are there any blockers for deployment to the staging environment?",
    hindiText: "क्या स्टेजिंग एनवायरनमेंट में डिप्लॉयमेंट के लिए कोई रुकावट (blocker) है?",
    domain: "engineering",
    cefrLevel: "B1",
  },

  // --- JAPANESE (Engineering & Horenso Culture) ---
  {
    id: "tat_ja_eng_1",
    targetLanguage: "ja",
    targetText: "データベースのレイテンシが前回のリリース後に急上昇しました。",
    transliteration: "Deetabeisu no reitenshi ga zenkai no ririisu-go ni kyuujoushou shimashita.",
    englishText: "Database latency spiked sharply after the previous release.",
    hindiText: "डेटाबेस की लेटेंसी पिछले रिलीज़ के बाद अचानक बढ़ गई।",
    domain: "engineering",
    cefrLevel: "B2",
    culturalTag: "Horenso (Report-Inform-Consult)",
  },
  {
    id: "tat_ja_eng_2",
    targetLanguage: "ja",
    targetText: "キャッシュの不整合を防ぐため、Redisのキャッシュをクリアする必要があります。",
    transliteration: "Kyasshu no fuseigou o fusegu tame, Redis no kyasshu o kuria suru hitsuyou ga arimasu.",
    englishText: "To prevent cache inconsistency, we need to clear the Redis cache.",
    hindiText: "कैश असंगति से बचने के लिए, हमें रेडिस कैश खाली करने की आवश्यकता है।",
    domain: "engineering",
    cefrLevel: "B2",
  },
  {
    id: "tat_ja_eng_3",
    targetLanguage: "ja",
    targetText: "おはようございます。昨日は認証サービスのコードを整理しました。",
    transliteration: "Ohayou gozaimasu. Kinou wa ninshou saabisu no koudo o seiri shimashita.",
    englishText: "Good morning. Yesterday I cleaned up the authentication service code.",
    hindiText: "नमस्ते। कल मैंने प्रमाणीकरण (auth) सेवा के कोड को व्यवस्थित किया था।",
    domain: "engineering",
    cefrLevel: "A2",
    culturalTag: "Keigo & Standup Etiquette",
  },
  {
    id: "tat_ja_eng_4",
    targetLanguage: "ja",
    targetText: "本日の作業で何か困っていることやブロッカーはありますか？",
    transliteration: "Honjitsu no sagyou de nanika komatte iru koto ya burokkaa wa arimasu ka?",
    englishText: "Are there any issues or blockers with today's work?",
    hindiText: "आज के काम में कोई समस्या या रुकावट (blocker) है क्या?",
    domain: "engineering",
    cefrLevel: "B1",
  },

  // --- ENGLISH (Global Executive & Engineering Leadership) ---
  {
    id: "tat_en_eng_1",
    targetLanguage: "en",
    targetText: "We should frame this technical debt in terms of financial SLA risk and customer churn.",
    englishText: "We should frame this technical debt in terms of financial SLA risk and customer churn.",
    hindiText: "हमें इस तकनीकी ऋण (tech debt) को वित्तीय SLA जोखिम और ग्राहक छोड़ने के नुकसान के संदर्भ में प्रस्तुत करना चाहिए।",
    domain: "engineering",
    cefrLevel: "C1",
    culturalTag: "Executive Presence",
  },
  {
    id: "tat_en_eng_2",
    targetLanguage: "en",
    targetText: "I recommend transitioning to an asynchronous event-driven queue to decouple ingestion from processing.",
    englishText: "I recommend transitioning to an asynchronous event-driven queue to decouple ingestion from processing.",
    hindiText: "मैं डेटा अंतर्ग्रहण को प्रसंस्करण से अलग करने के लिए एक अतुल्यकालिक (asynchronous) इवेंट कतार में जाने की सलाह देता हूँ।",
    domain: "engineering",
    cefrLevel: "B2",
  },
  {
    id: "tat_en_eng_3",
    targetLanguage: "en",
    targetText: "Could we align on a phased rollout strategy to protect the Q4 revenue target while safeguarding uptime?",
    englishText: "Could we align on a phased rollout strategy to protect the Q4 revenue target while safeguarding uptime?",
    hindiText: "क्या हम अपटाइम सुरक्षित रखते हुए Q4 राजस्व लक्ष्य की रक्षा के लिए एक चरणबद्ध रोलआउट रणनीति पर सहमत हो सकते हैं?",
    domain: "business",
    cefrLevel: "C1",
    culturalTag: "Strategic Negotiation",
  },
  {
    id: "tat_en_eng_4",
    targetLanguage: "en",
    targetText: "Let's review the root cause analysis before making any unilateral architectural changes.",
    englishText: "Let's review the root cause analysis before making any unilateral architectural changes.",
    hindiText: "आइए किसी भी एकतरफा ढांचागत बदलाव करने से पहले मूल कारण विश्लेषण (root cause analysis) की समीक्षा करें।",
    domain: "engineering",
    cefrLevel: "B2",
  },
];

// 2. Curated Kaikki / Wiktionary Domain Vocabulary Items with Hindi & English Reference Bridges
export const DOMAIN_VOCABULARY_ITEMS: DomainVocabularyItem[] = [
  // German Tech Vocabulary
  {
    id: "vocab_de_1",
    term: "die Bereitstellung",
    targetLanguage: "de",
    pos: "noun",
    englishMeaning: "deployment, provision",
    hindiMeaning: "तैनाती (deployment)",
    exampleSentence: "Die Bereitstellung in der Staging-Umgebung war erfolgreich.",
    culturalNote: "Frequently used in German software teams alongside 'das Deployment'.",
  },
  {
    id: "vocab_de_2",
    term: "der Blocker",
    targetLanguage: "de",
    pos: "noun",
    englishMeaning: "impediment, blocker",
    hindiMeaning: "रुकावट या बाधा",
    exampleSentence: "Ich habe einen kritischen Blocker mit den Zugriffsrechten.",
  },
  {
    id: "vocab_de_3",
    term: "die Latenz",
    targetLanguage: "de",
    pos: "noun",
    englishMeaning: "latency, response delay",
    hindiMeaning: "विलंबता (latency)",
    exampleSentence: "Die Latenz der API liegt unter 50 Millisekunden.",
  },
  {
    id: "vocab_de_4",
    term: "Sachlichkeit",
    targetLanguage: "de",
    pos: "noun",
    englishMeaning: "factual directness, objectivity",
    hindiMeaning: "तथ्यात्मक स्पष्टता और निष्पक्षता",
    exampleSentence: "In deutschen Meetings wird Sachlichkeit besonders geschätzt.",
    culturalNote: "German workplace norm: direct problem-solving without personal offense.",
  },

  // Japanese Tech Vocabulary
  {
    id: "vocab_ja_1",
    term: "報連相",
    targetLanguage: "ja",
    transliteration: "Horenso",
    pos: "noun",
    englishMeaning: "Report-Inform-Consult workplace communication framework",
    hindiMeaning: "रिपोर्ट-संपर्क-परामर्श (जापानी कार्यस्थल संचार पद्धति)",
    exampleSentence: "新入社員にとって報連相はもっとも重要です。",
    culturalNote: "Foundational Japanese business culture principle: Houkoku, Renraku, Soudan.",
  },
  {
    id: "vocab_ja_2",
    term: "根回し",
    targetLanguage: "ja",
    transliteration: "Nemawashi",
    pos: "noun",
    englishMeaning: "informal consensus-building before an official meeting",
    hindiMeaning: "बैठक से पूर्व अनौपचारिक सहमति बनाना",
    exampleSentence: "提案を通すために事前の根回しを行いました。",
    culturalNote: "Crucial for foreign engineers in Japan to secure buy-in beforehand.",
  },
  {
    id: "vocab_ja_3",
    term: "非同期処理",
    targetLanguage: "ja",
    transliteration: "Hidouki shori",
    pos: "noun",
    englishMeaning: "asynchronous processing",
    hindiMeaning: "अतुल्यकालिक प्रसंस्करण (asynchronous processing)",
    exampleSentence: "メッセージキューを用いた非同期処理を導入しました。",
  },
  {
    id: "vocab_ja_4",
    term: "お疲れ様です",
    targetLanguage: "ja",
    transliteration: "Otsukaresama desu",
    pos: "phrase",
    englishMeaning: "Thank you for your hard work (standard business greeting)",
    hindiMeaning: "आपकी कड़ी मेहनत के लिए धन्यवाद (मानक कार्यालय अभिवादन)",
    exampleSentence: "お疲れ様です。進捗のご報告です。",
    culturalNote: "Standard greeting when addressing colleagues and managers in Japan.",
  },

  // English Executive Vocabulary
  {
    id: "vocab_en_1",
    term: "Service Level Agreement (SLA)",
    targetLanguage: "en",
    pos: "noun",
    englishMeaning: "contractual commitment defining expected system uptime and performance",
    hindiMeaning: "सेवा स्तर समझौता (सिस्टम अपटाइम और प्रदर्शन की प्रतिबद्धता)",
    exampleSentence: "We risk breaching our 99.9% uptime SLA if we launch without caching.",
  },
  {
    id: "vocab_en_2",
    term: "Technical Debt",
    targetLanguage: "en",
    pos: "noun",
    englishMeaning: "implied cost of additional rework caused by choosing an easy solution now",
    hindiMeaning: "तकनीकी ऋण (त्वरित समाधान चुनने के कारण भविष्य का अतिरिक्त कार्य भार)",
    exampleSentence: "Accumulating technical debt will double our operational maintenance costs.",
  },
  {
    id: "vocab_en_3",
    term: "Decouple",
    targetLanguage: "en",
    pos: "verb",
    englishMeaning: "separate subsystems so they operate independently without tight coupling",
    hindiMeaning: "अलग करना (प्रणालियों को एक-दूसरे से स्वतंत्र बनाना)",
    exampleSentence: "We must decouple the payment webhook handler from synchronous DB writes.",
  },
];

// 3. Curated Professional Domain Scenarios for 15 / 30 Minute Simulations
export const CALL_SIMULATION_SCENARIOS: CallSimulationScenario[] = [
  // Scenario 1: GERMAN - Munich Tech Standup
  {
    id: "call_de_standup",
    title: "Munich Tech Standup: Status & Blocker Update",
    subtitle: "German Tech Team · Daily Sync at BMW/Siemens",
    targetLanguage: "de",
    localeCode: "de-DE",
    domain: "engineering",
    recommendedMinutes: 15,
    aiPersona: {
      name: "Felix Meier",
      role: "Engineering Team Lead (Munich)",
      avatarEmoji: "👨‍💻",
      greetingText: "Guten Morgen! Lass uns mit dem Standup beginnen. Wie ist der Status bei deinem Service?",
      greetingHindi: "सुप्रभात! चलिए स्टैंडअप शुरू करते हैं। आपकी सेवा की स्थिति क्या है?",
      greetingEnglish: "Good morning! Let's start the standup. What is the status of your service?",
    },
    briefing: {
      context: "You are a software engineer at a tech firm in Munich. Your team does a daily 15-minute standup. Yesterday you migrated the Redis caching layer, but today you have a blocker with staging permissions.",
      contextHindi: "आप म्यूनिख में एक सॉफ्टवेयर इंजीनियर हैं। टीम 15 मिनट का स्टैंडअप कर रही है। कल आपने रेडिस कैश माइग्रेट किया था, लेकिन आज स्टेजिंग अनुमतियों में एक रुकावट है।",
      objective: "Clearly state: 1) Yesterday's completed work, 2) Today's primary focus, 3) The specific staging blocker and mitigation ETA.",
      objectiveHindi: "स्पष्ट रूप से बताएं: 1) कल का पूरा हुआ काम, 2) आज का मुख्य फोकस, 3) स्टेजिंग में रुकावट और इसे सुलझाने का समय।",
      keyPhrases: [
        {
          phrase: "Gestern habe ich...",
          meaningHindi: "कल मैंने ... किया था",
          meaningEnglish: "Yesterday I completed...",
        },
        {
          phrase: "Heute konzentriere ich mich auf...",
          meaningHindi: "आज मेरा फोकस ... पर है",
          meaningEnglish: "Today I am focusing on...",
        },
        {
          phrase: "Ich habe einen Blocker bezüglich der Berechtigungen.",
          meaningHindi: "मुझे अनुमतियों (permissions) को लेकर एक ब्लॉकर है।",
          meaningEnglish: "I have a blocker regarding permissions.",
        },
      ],
      culturalEtiquette: "In Germany, professional communication values 'Sachlichkeit' (factual clarity). Do not hide blockers or give vague ETAs. State the facts plainly without unnecessary apologies.",
      culturalEtiquetteHindi: "जर्मनी में पेशेवर संचार 'Sachlichkeit' (तथ्यात्मक स्पष्टता) को महत्व देता है। रुकावटों को छिपाएं नहीं और सीधे तथ्यों के साथ बताएं।",
    },
    sampleDialogueTurns: [
      {
        role: "ai",
        text: "Guten Morgen! Lass uns mit dem Standup beginnen. Wie ist der Status bei deinem Service?",
        hindiHint: "शुरुआत करें: 'Guten Morgen Felix! Gestern habe ich...' (कल के काम से शुरू करें)",
        englishHint: "Start with: 'Guten Morgen Felix! Gestern habe ich den Redis-Cache optimiert...'",
      },
      {
        role: "user",
        text: "Guten Morgen Felix. Gestern habe ich den Redis-Cache optimiert. Heute arbeite ich an der API-Integration. Allerdings habe ich einen Blocker mit den Staging-Berechtigungen.",
      },
      {
        role: "ai",
        text: "Verstanden. Danke für die klare Rückmeldung. Hast du schon ein Ticket bei DevOps eröffnet oder soll ich den Lead direkt anpingen?",
        hindiHint: "बताएं कि टिकट बना दिया है और ETA क्या है: 'Ich habe bereits ein Ticket erstellt...'",
        englishHint: "Explain ticket status: 'Ich habe bereits ein Ticket erstellt, warte aber noch auf Bestätigung.'",
      },
    ],
  },

  // Scenario 2: JAPANESE - Tokyo Tech Horenso Meeting
  {
    id: "call_ja_horenso",
    title: "Tokyo Tech Horenso: Microservices Migration Report",
    subtitle: "Japanese IT Firm · Rakuten / Toyota Systems",
    targetLanguage: "ja",
    localeCode: "ja-JP",
    domain: "engineering",
    recommendedMinutes: 15,
    aiPersona: {
      name: "Tanaka Kenji (田中 健二)",
      role: "Engineering Manager (Tokyo)",
      avatarEmoji: "👔",
      greetingText: "お疲れ様です。昨日のマイクロサービス移行の進捗について、報告をお願いできますか？",
      greetingHindi: "नमस्ते। क्या आप कल के माइक्रोसर्विस माइग्रेशन की प्रगति पर रिपोर्ट साझा कर सकते हैं?",
      greetingEnglish: "Thank you for your hard work. Could you please report on the microservice migration progress from yesterday?",
    },
    briefing: {
      context: "You are an Indian software engineer working in Tokyo. You need to report yesterday's deployment results and consult your manager on an API timeout issue using proper Horenso (Houkoku-Renraku-Soudan).",
      contextHindi: "आप टोक्यो में कार्यरत एक भारतीय सॉफ्टवेयर इंजीनियर हैं। आपको 'होरेन्सो' (रिपोर्ट-संपर्क-परामर्श) का पालन करते हुए एपीआई टाइमआउट समस्या पर अपने मैनेजर से चर्चा करनी है।",
      objective: "1) Use respectful Keigo greetings (Otsukaresama desu), 2) Report database latency findings, 3) Politely consult on cache invalidation strategy.",
      objectiveHindi: "1) आदरपूर्ण 'केइगो' का उपयोग करें, 2) डेटाबेस लेटेंसी की रिपोर्ट दें, 3) कैश रणनीति पर विनम्रता से सलाह मांगें।",
      keyPhrases: [
        {
          phrase: "お疲れ様です。報告させていただきます。",
          transliteration: "Otsukaresama desu. Houkoku sasete itadakimasu.",
          meaningHindi: "नमस्ते। मैं अपनी रिपोर्ट प्रस्तुत करता हूँ।",
          meaningEnglish: "Thank you for your hard work. Allow me to give my report.",
        },
        {
          phrase: "昨日は〜を完了いたしました。",
          transliteration: "Kinou wa ~ o kanryou itashimashita.",
          meaningHindi: "कल मैंने ~ पूरा कर लिया था।",
          meaningEnglish: "Yesterday I completed ~.",
        },
        {
          phrase: "一つご相談があるのですが、よろしいでしょうか？",
          transliteration: "Hitotsu go-soudan ga aru no desu ga, yoroshii deshou ka?",
          meaningHindi: "मुझे एक बात पर सलाह चाहिए थी, क्या आपके पास समय है?",
          meaningEnglish: "I would like to consult with you on one point, if that is alright?",
        },
      ],
      culturalEtiquette: "In Japanese corporate culture, follow 'Horenso' (報告・連絡・相談). Never announce a sudden decision without prior consultation (Nemawashi). Keep an apologetic and collaborative tone.",
      culturalEtiquetteHindi: "जापानी संस्कृति में हमेशा 'होरेन्सो' का पालन करें। मैनेजर से सीधे असहमत होने के बजाय सलाह के रूप में प्रश्न पूछें।",
    },
    sampleDialogueTurns: [
      {
        role: "ai",
        text: "お疲れ様です。昨日のマイクロサービス移行の進捗について、報告をお願いできますか？",
        hindiHint: "अभिवादन करें और बताएं कि माइग्रेशन पूरा हुआ: 'お疲れ様です、田中さん。昨日はデータベースの移行を完了いたしました。'",
        englishHint: "Greet and confirm completion: 'Otsukaresama desu, Tanaka-san. Kinou wa deetabeisu no ikou o kanryou itashimashita.'",
      },
      {
        role: "user",
        text: "お疲れ様です、田中さん。昨日はデータベースの移行を完了いたしました。ただ、レイテンシに関して一つご相談があるのですが、よろしいでしょうか？",
      },
      {
        role: "ai",
        text: "はい、もちろん大丈夫です。レイテンシにどのような問題が発生していますか？",
        hindiHint: "समस्या समझाएं: 'ピーク時に500ミリ秒の遅延が発生しています。キャッシュの導入を検討したいと考えております。'",
        englishHint: "State the latency impact: 'Piiku-ji ni 500 miribyou no chien ga hassei shite imasu. Kyasshu no dounyuu o kentou shitai to kangaete orimasu.'",
      },
    ],
  },

  // Scenario 3: ENGLISH - Executive Strategic Architecture Pitch
  {
    id: "call_en_executive",
    title: "Executive Architecture Pitch: Event-Driven Modernization",
    subtitle: "Global Leadership · Cross-Functional Executive Review",
    targetLanguage: "en",
    localeCode: "en-US",
    domain: "engineering",
    recommendedMinutes: 30,
    aiPersona: {
      name: "Victoria Sterling",
      role: "VP of Engineering & Product",
      avatarEmoji: "👩‍💼",
      greetingText: "Good afternoon. We're considering early launch for Q4, but I see your proposal advocating for architectural refactoring. Convince me why we shouldn't ship right away.",
      greetingHindi: "शुभ दोपहर। हम Q4 में जल्दी लॉन्च करने पर विचार कर रहे हैं, लेकिन आपने रिफैक्टरिंग का प्रस्ताव दिया है। समझाइए कि हमें तुरंत लॉन्च क्यों नहीं करना चाहिए।",
      greetingEnglish: "Good afternoon. We're considering an early launch for Q4, but I see your proposal advocating for architectural refactoring. Convince me why we shouldn't ship right away.",
    },
    briefing: {
      context: "Business leadership wants to accelerate product release by 3 weeks. You must defend foundational refactoring without sounding obstructionist, translating technical debt into financial risk.",
      contextHindi: "व्यापारिक नेतृत्व 3 सप्ताह पहले लॉन्च करना चाहता है। आपको तकनीकी ऋण को वित्तीय जोखिम और SLA नुकसान के रूप में समझाना है।",
      objective: "Frame arguments around: 1) SLA degradation and downtime costs, 2) Scalability bottleneck during peak load, 3) Phased compromise mitigating rollout risk.",
      objectiveHindi: "1) डाउनटाइम की वित्तीय लागत, 2) पीक लोड पर सिस्टम का क्रैश जोखिम, 3) एक संतुलित चरणबद्ध समाधान प्रस्तुत करना।",
      keyPhrases: [
        {
          phrase: "I completely share our goal of capturing market momentum...",
          meaningHindi: "मैं बाज़ार में पहले पहुँचने के लक्ष्य से पूरी तरह सहमत हूँ...",
          meaningEnglish: "I completely share our goal of capturing market momentum...",
        },
        {
          phrase: "However, under 3x peak load, this bottleneck translates directly to SLA violations.",
          meaningHindi: "लेकिन 3 गुना लोड होने पर, यह बाधा सीधे SLA उल्लंघनों में बदल जाएगी।",
          meaningEnglish: "However, under 3x peak load, this bottleneck translates directly to SLA violations.",
        },
        {
          phrase: "We propose a dual-phase rollout to protect revenue without delaying user onboarding.",
          meaningHindi: "हम राजस्व की सुरक्षा और यूजर ऑनबोर्डिंग दोनों के लिए दो चरणों वाला रोलआउट प्रस्तावित करते हैं।",
          meaningEnglish: "We propose a dual-phase rollout to protect revenue without delaying user onboarding.",
        },
      ],
      culturalEtiquette: "Executive leaders prioritize business continuity, revenue retention, and customer trust over pure engineering elegance. Frame all technical debt in terms of business impact.",
      culturalEtiquetteHindi: "शीर्ष नेतृत्व कोड की सुंदरता के बजाय व्यापारिक निरंतरता और वित्तीय जोखिम को प्राथमिकता देता है। हमेशा व्यावसायिक प्रभाव पर बात करें।",
    },
    sampleDialogueTurns: [
      {
        role: "ai",
        text: "Good afternoon. We're considering early launch for Q4, but I see your proposal advocating for architectural refactoring. Convince me why we shouldn't ship right away.",
        hindiHint: "सहमति से शुरू करें और फिर जोखिम बताएं: 'Victoria, I share our urgency to launch early, but our current architecture risks 40% downtime under holiday traffic...'",
        englishHint: "Acknowledge urgency, then quantify financial risk: 'Victoria, I share our urgency to launch early, but our current architecture risks 40% downtime under holiday traffic...'",
      },
      {
        role: "user",
        text: "Victoria, I completely share our urgency to capture Q4 market momentum. However, our stress tests show that under 3x peak load, the current monolithic queue will breach our 99.9% uptime SLA, risking customer churn and refund penalties.",
      },
      {
        role: "ai",
        text: "That is a quantifiable risk. What is the minimal refactor required to guarantee that SLA, and how much does it impact the deadline?",
        hindiHint: "चरणबद्ध प्रस्ताव दें: 'By decoupling ingestion into an event queue, we need only 4 days...'",
        englishHint: "Propose minimal viable refactor: 'By decoupling ingestion into an event queue, we need only 4 days, protecting our launch date while guaranteeing stability.'",
      },
    ],
  },
];
