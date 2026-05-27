/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'hi';

type TranslationKey =
  | 'language'
  | 'english'
  | 'hindi'
  | 'fromStation'
  | 'toStation'
  | 'planJourney'
  | 'useSmoothRouteAnimation'
  | 'smoothRouteAnimation'
  | 'stepRouteAnimation'
  | 'smooth'
  | 'step'
  | 'cinematicExportZoom'
  | 'swapFromAndToStations'
  | 'swapStations'
  | 'chooseRoute'
  | 'routeTitle'
  | 'routePlanner'
  | 'delhiMetro'
  | 'fare'
  | 'stops'
  | 'time'
  | 'minutesShort'
  | 'minutes'
  | 'change'
  | 'selectInterchangePrompt'
  | 'allStations'
  | 'interchangeStations'
  | 'changeMetroLineHere'
  | 'noInterchangeNeeded'
  | 'journeyTimelinePrompt'
  | 'journeyTimeline'
  | 'stations'
  | 'downloadJourneyTimeline'
  | 'downloadTimeline'
  | 'toward'
  | 'selectDestination'
  | 'creatorLinks'
  | 'createdBy'
  | 'linkedin'
  | 'github'
  | 'copySupportEmail'
  | 'supportEmailCopied'
  | 'shareRoute'
  | 'copyRouteLink'
  | 'routeLinkCopied'
  | 'shareVia'
  | 'shareOnTwitter'
  | 'shareOnReddit'
  | 'shareOnInstagram'
  | 'instagramLinkCopied'
  | 'downloadRoutePng'
  | 'routePngDownloading'
  | 'routePng'
  | 'shareRouteText';

type TranslationValues = Record<string, string | number>;

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    fromStation: 'From station',
    toStation: 'To station',
    planJourney: 'Plan journey',
    useSmoothRouteAnimation: 'Use smooth route animation',
    smoothRouteAnimation: 'Smooth route animation',
    stepRouteAnimation: 'Step route animation',
    smooth: 'Smooth',
    step: 'Step',
    cinematicExportZoom: 'Cinematic export zoom',
    swapFromAndToStations: 'Swap from and to stations',
    swapStations: 'Swap stations',
    chooseRoute: 'Choose a route',
    routeTitle: '{{from}} to {{to}}',
    routePlanner: 'Route planner',
    delhiMetro: 'Delhi Metro',
    fare: 'Fare',
    stops: 'Stops',
    time: 'Time',
    minutesShort: '{{count}}m',
    minutes: '{{count}} mins',
    change: 'Change',
    selectInterchangePrompt: 'Select source and destination to see interchange stations.',
    allStations: 'All stations',
    interchangeStations: 'Interchange stations',
    changeMetroLineHere: 'Change metro line here',
    noInterchangeNeeded: 'No interchange needed for this route.',
    journeyTimelinePrompt: 'Plan a journey to see the station timeline.',
    journeyTimeline: 'Journey timeline',
    stations: '{{count}} stations',
    downloadJourneyTimeline: 'Download journey timeline as PNG',
    downloadTimeline: 'Download timeline',
    toward: 'Toward',
    selectDestination: 'Select destination',
    creatorLinks: 'Creator links',
    createdBy: 'Created by',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    copySupportEmail: 'Copy support email',
    supportEmailCopied: 'Email copied',
    shareRoute: 'Share route',
    copyRouteLink: 'Copy route link',
    routeLinkCopied: 'Route link copied',
    shareVia: 'Share via',
    shareOnTwitter: 'Twitter/X',
    shareOnReddit: 'Reddit',
    shareOnInstagram: 'Instagram',
    instagramLinkCopied: 'Link copied for Instagram',
    downloadRoutePng: 'Download route PNG',
    routePngDownloading: 'Preparing PNG',
    routePng: 'Route PNG',
    shareRouteText: 'Delhi Metro route from {{from}} to {{to}} with {{stops}} stops, {{time}} travel time, and ₹{{fare}} fare.',
  },
  hi: {
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    fromStation: 'प्रस्थान स्टेशन',
    toStation: 'गंतव्य स्टेशन',
    planJourney: 'यात्रा योजना',
    useSmoothRouteAnimation: 'स्मूथ रूट एनीमेशन इस्तेमाल करें',
    smoothRouteAnimation: 'स्मूथ रूट एनीमेशन',
    stepRouteAnimation: 'स्टेप रूट एनीमेशन',
    smooth: 'स्मूथ',
    step: 'स्टेप',
    cinematicExportZoom: 'सिनेमैटिक एक्सपोर्ट ज़ूम',
    swapFromAndToStations: 'प्रस्थान और गंतव्य स्टेशन बदलें',
    swapStations: 'स्टेशन बदलें',
    chooseRoute: 'रूट चुनें',
    routeTitle: '{{from}} से {{to}}',
    routePlanner: 'रूट प्लानर',
    delhiMetro: 'दिल्ली मेट्रो',
    fare: 'किराया',
    stops: 'स्टॉप',
    time: 'समय',
    minutesShort: '{{count}}मि',
    minutes: '{{count}} मिनट',
    change: 'बदलें',
    selectInterchangePrompt: 'इंटरचेंज स्टेशन देखने के लिए प्रस्थान और गंतव्य चुनें।',
    allStations: 'सभी स्टेशन',
    interchangeStations: 'इंटरचेंज स्टेशन',
    changeMetroLineHere: 'यहां मेट्रो लाइन बदलें',
    noInterchangeNeeded: 'इस रूट पर इंटरचेंज की जरूरत नहीं है।',
    journeyTimelinePrompt: 'स्टेशन टाइमलाइन देखने के लिए यात्रा योजना बनाएं।',
    journeyTimeline: 'यात्रा टाइमलाइन',
    stations: '{{count}} स्टेशन',
    downloadJourneyTimeline: 'यात्रा टाइमलाइन PNG के रूप में डाउनलोड करें',
    downloadTimeline: 'टाइमलाइन डाउनलोड करें',
    toward: 'की ओर',
    selectDestination: 'गंतव्य चुनें',
    creatorLinks: 'क्रिएटर लिंक',
    createdBy: 'बनाया गया',
    linkedin: 'लिंक्डइन',
    github: 'गिटहब',
    copySupportEmail: 'सपोर्ट ईमेल कॉपी करें',
    supportEmailCopied: 'ईमेल कॉपी हो गया',
    shareRoute: 'रूट शेयर करें',
    copyRouteLink: 'रूट लिंक कॉपी करें',
    routeLinkCopied: 'रूट लिंक कॉपी हो गया',
    shareVia: 'शेयर करें',
    shareOnTwitter: 'ट्विटर/X',
    shareOnReddit: 'रेडिट',
    shareOnInstagram: 'इंस्टाग्राम',
    instagramLinkCopied: 'इंस्टाग्राम के लिए लिंक कॉपी हो गया',
    downloadRoutePng: 'रूट PNG डाउनलोड करें',
    routePngDownloading: 'PNG तैयार हो रहा है',
    routePng: 'रूट PNG',
    shareRouteText: '{{from}} से {{to}} तक दिल्ली मेट्रो रूट: {{stops}} स्टॉप, {{time}} यात्रा समय, और ₹{{fare}} किराया।',
  },
};

const stationNamesHi: Record<string, string> = {
  RI: 'रिठाला',
  RHW: 'रोहिणी वेस्ट',
  RHE: 'रोहिणी ईस्ट',
  PTP: 'पीतमपुरा',
  KE: 'कोहाट एन्क्लेव',
  NSHP: 'नेताजी सुभाष प्लेस',
  KP: 'केशव पुरम',
  KN: 'कन्हैया नगर',
  ILOK: 'इंद्रलोक',
  SHT: 'शास्त्री नगर',
  PRA: 'प्रताप नगर',
  PBGH: 'पुलबंगश',
  TZI: 'तीस हजारी',
  KG: 'कश्मीरी गेट',
  SHPK: 'शास्त्री पार्क',
  SLAP: 'सीलमपुर',
  WC: 'वेलकम',
  SHD: 'शाहदरा',
  MPK: 'मानसरोवर पार्क',
  JLML: 'झिलमिल',
  DSG: 'दिलशाद गार्डन',
  SHDN: 'शहीद नगर',
  RJBH: 'राज बाग',
  RJNM: 'मेजर मोहित शर्मा राजेंद्र नगर',
  SMPK: 'श्याम पार्क',
  MNGM: 'मोहन नगर',
  ATHA: 'अर्थला',
  HDNR: 'हिंडन रिवर',
  NBAA: 'शहीद स्थल (न्यू बस अड्डा)',
  SPBI: 'समयपुर बादली',
  RISE: 'रोहिणी सेक्टर - 18,19',
  BIMR: 'हैदरपुर बादली मोड़',
  JGPI: 'जहांगीरपुरी',
  AHNR: 'आदर्श नगर',
  AZU: 'आजादपुर',
  MDTW: 'मॉडल टाउन',
  GTBR: 'गुरु तेग बहादुर नगर',
  VW: 'विश्वविद्यालय',
  VS: 'विधान सभा',
  CL: 'सिविल लाइंस',
  CHK: 'चांदनी चौक',
  CWBR: 'चावड़ी बाजार',
  NDI: 'नई दिल्ली',
  RCK: 'राजीव चौक',
  PTCK: 'पटेल चौक',
  CTST: 'सेंट्रल सेक्रेटेरिएट',
  UDB: 'उद्योग भवन',
  LKM: 'लोक कल्याण मार्ग',
  JB: 'जोर बाग',
  INA: 'दिल्ली हाट-आईएनए',
  AIIMS: 'एम्स',
  GNPK: 'ग्रीन पार्क',
  HKS: 'हौज खास',
  MVNR: 'मालवीय नगर',
  SAKT: 'साकेत',
  QM: 'कुतुब मीनार',
  CHTP: 'छतरपुर',
  SLTP: 'सुल्तानपुर',
  GTNI: 'घिटोरनी',
  AJG: 'अर्जन गढ़',
  GE: 'गुरु द्रोणाचार्य',
  SKRP: 'सिकंदरपुर',
  MGRO: 'एम.जी. रोड',
  IFOC: 'इफ्को चौक',
  HCC: 'मिलेनियम सिटी सेंटर गुरुग्राम',
  DSTO: 'द्वारका सेक्टर - 21',
  DSET: 'द्वारका सेक्टर - 8',
  DSN: 'द्वारका सेक्टर - 9',
  DST: 'द्वारका सेक्टर - 10',
  DSE: 'द्वारका सेक्टर - 11',
  DSW: 'द्वारका सेक्टर - 12',
  DSTN: 'द्वारका सेक्टर - 13',
  DSFN: 'द्वारका सेक्टर - 14',
  DW: 'द्वारका',
  DM: 'द्वारका मोड़',
  NWD: 'नवादा',
  UNW: 'उत्तम नगर वेस्ट',
  UNE: 'उत्तम नगर ईस्ट',
  JPW: 'जनकपुरी वेस्ट',
  JPE: 'जनकपुरी ईस्ट',
  TN: 'तिलक नगर',
  SN: 'सुभाष नगर',
  TG: 'टैगोर गार्डन',
  RG: 'राजौरी गार्डन',
  RN: 'रमेश नगर',
  MN: 'मोती नगर',
  KNR: 'कीर्ति नगर',
  SP: 'शादीपुर',
  PN: 'पटेल नगर',
  RP: 'राजेंद्र प्लेस',
  KB: 'करोल बाग',
  JW: 'झंडेवालान',
  RKAM: 'रामकृष्ण आश्रम मार्ग',
  BRKR: 'बाराखंबा रोड',
  MDHS: 'मंडी हाउस',
  PTMD: 'सुप्रीम कोर्ट',
  IDPT: 'इंद्रप्रस्थ',
  YB: 'यमुना बैंक',
  ASDM: 'अक्षरधाम',
  MVP1: 'मयूर विहार-1',
  MVE: 'मयूर विहार एक्सटेंशन',
  NAGR: 'न्यू अशोक नगर',
  NSFT: 'नोएडा सेक्टर-15',
  NSST: 'नोएडा सेक्टर-16',
  NSET: 'नोएडा सेक्टर-18',
  BCGN: 'बॉटनिकल गार्डन',
  GEC: 'गोल्फ कोर्स',
  NCC: 'नोएडा सिटी सेंटर',
  STFN: 'सेक्टर-34 नोएडा',
  SFTN: 'सेक्टर-52 नोएडा',
  SSON: 'सेक्टर-61 नोएडा',
  SFNN: 'सेक्टर-59 नोएडा',
  SSTN: 'सेक्टर-62 नोएडा',
  NECC: 'नोएडा इलेक्ट्रॉनिक सिटी',
  LN: 'लक्ष्मी नगर',
  NV: 'निर्माण विहार',
  PTVR: 'प्रीत विहार',
  KKDA: 'कड़कड़डूमा',
  AVIT: 'आनंद विहार आई.एस.बी.टी',
  KSHI: 'कौशांबी',
  VASI: 'वैशाली',
  CIPK: 'ब्रिगेडियर होशियार सिंह',
  BUSS: 'बहादुरगढ़ सिटी',
  MIEE: 'पंडित श्री राम शर्मा',
  TKBR: 'टिकरी बॉर्डर',
  TKLM: 'टिकरी कलां',
  GHEM: 'घेवरा मेट्रो स्टेशन',
  MIAA: 'मुंडका इंडस्ट्रियल एरिया (एमआईए)',
  MUDK: 'मुंडका',
  RDPK: 'राजधानी पार्क',
  NRSN: 'नांगलोई रेलवे स्टेशन',
  NNOI: 'नांगलोई',
  SMSM: 'महाराजा सूरजमल स्टेडियम',
  UNRG: 'उद्योग नगर',
  PAGI: 'पीरागढ़ी',
  PVW: 'पश्चिम विहार वेस्ट',
  PVE: 'पश्चिम विहार ईस्ट',
  MAPR: 'मादीपुर',
  SHVP: 'शिवाजी पार्क',
  PBGW: 'पंजाबी बाग वेस्ट',
  PBGA: 'पंजाबी बाग',
  APMN: 'अशोक पार्क मेन',
  SRSM: 'सतगुरु राम सिंह मार्ग',
  LLQA: 'लाल किला',
  JAMD: 'जामा मस्जिद',
  DLIG: 'दिल्ली गेट',
  ITO: 'आईटीओ',
  JNPH: 'जनपथ',
  KM: 'खान मार्केट',
  JLNS: 'जेएलएन स्टेडियम',
  JGPA: 'जंगपुरा',
  LJPN: 'लाजपत नगर',
  MLCD: 'मूलचंद',
  KHCY: 'कैलाश कॉलोनी',
  NP: 'नेहरू प्लेस',
  KJMD: 'कालकाजी मंदिर',
  GDPI: 'गोविंद पुरी',
  HNOK: 'हरकेश नगर ओखला',
  JLA: 'जसोला अपोलो',
  STVR: 'सरिता विहार',
  METE: 'मोहन एस्टेट',
  TKDS: 'तुगलकाबाद स्टेशन',
  BAPB: 'बदरपुर बॉर्डर',
  SRAI: 'सराय',
  NHPC: 'एनएचपीसी चौक',
  MMJR: 'मेवला महाराजपुर',
  STTA: 'सेक्टर-28',
  BKMR: 'बड़कल मोड़',
  OFDB: 'ओल्ड फरीदाबाद',
  NCAJ: 'नीलम चौक अजरोंदा',
  BACH: 'बाटा चौक',
  ECMJ: 'एस्कॉर्ट्स मुजेसर',
  NCBC: 'संत सूरदास (सिही)',
  BVHM: 'राजा नाहर सिंह (बल्लभगढ़)',
  MKPR: 'मजलिस पार्क',
  SMBG: 'शालीमार बाग',
  SAKP: 'शकूरपुर',
  ESIH: 'ईएसआई-बसीदारापुर',
  MYPI: 'मायापुरी',
  NAVR: 'नारायणा विहार',
  DLIC: 'दिल्ली कैंट',
  DDSC: 'दुर्गाबाई देशमुख साउथ कैंपस',
  SVMB: 'सर एम. विश्वेश्वरैया मोती बाग',
  BKCP: 'भीकाजी कामा प्लेस',
  SOJI: 'सरोजिनी नगर',
  SOEN: 'साउथ एक्सटेंशन',
  VNPR: 'विनोबापुरी',
  AHRM: 'आश्रम',
  NIZM: 'सराय काले खां निजामुद्दीन',
  MVPO: 'मयूर विहार पॉकेट-1',
  TKPR: 'त्रिलोकपुरी-संजय लेक',
  VENT: 'ईस्ट विनोद नगर-मयूर विहार -II',
  VNNR: 'मंडावली वेस्ट विनोद नगर',
  IPE: 'आईपी एक्सटेंशन',
  KKDC: 'कड़कड़डूमा कोर्ट',
  KHNA: 'कृष्णा नगर',
  EANR: 'ईस्ट आजाद नगर',
  JFRB: 'जाफराबाद',
  MUPR: 'मौजपुर-बाबरपुर',
  GKPR: 'गोकुलपुरी',
  JIEE: 'जौहरी एन्क्लेव',
  SVVR: 'शिव विहार',
  DBMR: 'डाबड़ी मोड़- जनकपुरी साउथ',
  DSHP: 'दशरथपुरी',
  PALM: 'पालम',
  SABR: 'सदर बाजार कैंटोनमेंट',
  IGDA: 'टर्मिनल-1 आईजीआई एयरपोर्ट',
  SKVR: 'शंकर विहार',
  VTVR: 'वसंत विहार',
  MIRK: 'मुनिरका',
  RKPM: 'आर के पुरम',
  IIT: 'आईआईटी',
  PSPK: 'पंचशील पार्क',
  CDLI: 'चिराग दिल्ली',
  GKEI: 'ग्रेटर कैलाश',
  NUEE: 'नेहरू एन्क्लेव',
  OKNS: 'ओखला एनएसआईसी',
  IWNR: 'सुखदेव विहार',
  JANR: 'जामिया मिल्लिया इस्लामिया',
  OVA: 'ओखला विहार',
  JLA8: 'जसोला विहार शाहीन बाग',
  KIKJ: 'कालिंदी कुंज',
  OKBS: 'ओखला बर्ड सैंक्चुअरी',
  NNGI: 'नांगली',
  NFGH: 'नजफगढ़',
  DNBT: 'ढांसा बस स्टैंड',
  DKV: 'धौला कुआं',
  SJSU: 'शिवाजी स्टेडियम',
  DACY: 'दिल्ली एरोसिटी',
  APOT: 'एयरपोर्ट (टी-3)',
  IICC: 'यशोभूमि द्वारका सेक्टर - 25',
  DL2: 'फेज-2',
  BEL: 'बेल्वेडियर टावर्स',
  GAT: 'साइबर सिटी',
  MAL: 'मौलसरी एवेन्यू',
  DL3: 'फेज-3',
  PH1: 'फेज-1',
  SUL: 'सेक्टर 42-43',
  S53: 'सेक्टर 53-54',
  AIT: 'सेक्टर 54 चौक',
  S55: 'सेक्टर 55-56',
};

const languageOptions: Language[] = ['en', 'hi'];

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';

  const urlLanguage = new URLSearchParams(window.location.search).get('lang');
  if (languageOptions.includes(urlLanguage as Language)) return urlLanguage as Language;

  const storedLanguage = window.localStorage.getItem('language');
  return languageOptions.includes(storedLanguage as Language) ? storedLanguage as Language : 'en';
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('language', language);

    const url = new URL(window.location.href);
    if (language === 'hi') {
      url.searchParams.set('lang', language);
    } else {
      url.searchParams.delete('lang');
    }
    const queryString = url.searchParams.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${queryString ? `?${queryString}` : ''}${url.hash}`);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values = {}) =>
      Object.entries(values).reduce(
        (message, [name, replacement]) => message.replaceAll(`{{${name}}}`, String(replacement)),
        translations[language][key] || translations.en[key]
      ),
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
};

export const availableLanguages = languageOptions;

export const getLocalizedStationName = (id: string, fallbackName: string, language: Language) =>
  language === 'hi' ? stationNamesHi[id] || fallbackName : fallbackName;
