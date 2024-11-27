import {ILangCode} from "../type";

export const toLocaleDateString = (date: Date): string => {
	return new Date(date).toLocaleDateString(
		"cs-cz",
		{
			year: "numeric",
			month: "numeric",
			day: "numeric",
		}
	);
}

export const monthsSkCz: string[] = [
	"Január/Leden",
	"Február/Únor",
	"Marec/Březen",
	"Apríl/Duben",
	"Máj/Květen",
	"Jún/Červen",
	"Júl/Červenec",
	"August/Srpen",
	"September/Září",
	"Október/Říjen",
	"November/Listopad",
	"December/Prosinec"
]

export const langCode: ILangCode[] = [
	{key: "sk", value: "slovenčina"},
	{key: "cz", value: "čeština"},
	{key: "en", value: "angličtina"},
	{key: "ru", value: "ruština"},
	{key: "aa", value: "afarština"},
	{key: "ab", value: "abcházština"},
	{key: "ae", value: "avestánština"},
	{key: "af", value: "afrikánština"},
	{key: "ak", value: "akanština"},
	{key: "am", value: "amharština"},
	{key: "an", value: "aragonština"},
	{key: "ar", value: "arabština"},
	{key: "as", value: "ásámština"},
	{key: "av", value: "avarština"},
	{key: "ay", value: "ajmarština"},
	{key: "az", value: "ázerbájdžánština"},
	{key: "ba", value: "baškirština"},
	{key: "be", value: "běloruština"},
	{key: "bg", value: "bulharština"},
	{key: "bh", value: "bihárština"},
	{key: "bi", value: "bislamština"},
	{key: "bm", value: "bambarština"},
	{key: "bn", value: "bengálština"},
	{key: "bo", value: "tibetština"},
	{key: "br", value: "bretonština"},
	{key: "bs", value: "bosenština"},
	{key: "ca", value: "katalánština"},
	{key: "ce", value: "čečenština"},
	{key: "co", value: "korsičtina"},
	{key: "cr", value: "kríjština"},
	{key: "cu", value: "staroslověnština"},
	{key: "cv", value: "čuvaština"},
	{key: "cy", value: "velština"},
	{key: "da", value: "dánština"},
	{key: "de", value: "němčina"},
	{key: "dv", value: "divehi"},
	{key: "dz", value: "dzongkha"},
	{key: "ee", value: "eveština"},
	{key: "el", value: "řečtina"},
	{key: "eo", value: "esperanto"},
	{key: "es", value: "španělština"},
	{key: "et", value: "estonština"},
	{key: "eu", value: "baskičtina"},
	{key: "fa", value: "perština"},
	{key: "ff", value: "fulbština"},
	{key: "fi", value: "finština"},
	{key: "fj", value: "fidžijština"},
	{key: "fo", value: "faerština"},
	{key: "fr", value: "francouzština"},
	{key: "fy", value: "západofríština"},
	{key: "ga", value: "irština"},
	{key: "gd", value: "skotská gaelština"},
	{key: "gl", value: "galicijština"},
	{key: "gn", value: "guaraní"},
	{key: "gu", value: "gudžarátština"},
	{key: "gv", value: "manština"},
	{key: "ha", value: "hauština"},
	{key: "he", value: "hebrejština"},
	{key: "hi", value: "hindština"},
	{key: "ho", value: "hiri motu"},
	{key: "hr", value: "chorvatština"},
	{key: "ht", value: "haitština"},
	{key: "hu", value: "maďarština"},
	{key: "hy", value: "arménština"},
	{key: "hz", value: "hererština"},
	{key: "ch", value: "chamorro"},
	{key: "ia", value: "interlingua"},
	{key: "id", value: "indonéština"},
	{key: "ie", value: "interlingue"},
	{key: "ig", value: "igbo"},
	{key: "ii", value: "yi"},
	{key: "ik", value: "inupiaq"},
	{key: "io", value: "ido"},
	{key: "is", value: "islandština"},
	{key: "it", value: "italština"},
	{key: "iu", value: "inuitština"},
	{key: "ja", value: "japonština"},
	{key: "jv", value: "javánština"},
	{key: "ka", value: "gruzínština"},
	{key: "kg", value: "konžština"},
	{key: "ki", value: "kikujština"},
	{key: "kj", value: "kuanyama"},
	{key: "kk", value: "kazaština"},
	{key: "kl", value: "grónština"},
	{key: "km", value: "khmerština"},
	{key: "kn", value: "kannadština"},
	{key: "ko", value: "korejština"},
	{key: "kr", value: "kanurijština"},
	{key: "ks", value: "kašmírština"},
	{key: "ku", value: "kurdština"},
	{key: "kv", value: "komijština"},
	{key: "kw", value: "kornština"},
	{key: "ky", value: "kyrgyzština"},
	{key: "la", value: "latina"},
	{key: "lb", value: "lucemburština"},
	{key: "lg", value: "gandština"},
	{key: "li", value: "limburština"},
	{key: "ln", value: "ngalština"},
	{key: "lo", value: "laoština"},
	{key: "lt", value: "litevština"},
	{key: "lu", value: "lubština"},
	{key: "lv", value: "lotyština"},
	{key: "mg", value: "malgaština"},
	{key: "mh", value: "maršálština"},
	{key: "mi", value: "maorština"},
	{key: "mk", value: "makedonština"},
	{key: "ml", value: "malajámština"},
	{key: "mn", value: "mongolština"},
	{key: "mo", value: "moldavština"},
	{key: "mr", value: "maráthština"},
	{key: "ms", value: "malajština"},
	{key: "mt", value: "maltština"},
	{key: "my", value: "barmština"},
	{key: "na", value: "nauruština"},
	{key: "nb", value: "bokmål"},
	{key: "nd", value: "severní ndebelština"},
	{key: "ne", value: "nepálština"},
	{key: "ng", value: "ndonga"},
	{key: "nl", value: "nizozemština"},
	{key: "nn", value: "nynorsk"},
	{key: "no", value: "norština"},
	{key: "nr", value: "jižní ndebelština"},
	{key: "nv", value: "navažština"},
	{key: "ny", value: "čičevština"},
	{key: "oc", value: "okcitánština"},
	{key: "oj", value: "odžibvejština"},
	{key: "om", value: "oromština"},
	{key: "or", value: "urijština"},
	{key: "os", value: "osetština"},
	{key: "pa", value: "paňdžábština"},
	{key: "pi", value: "páli"},
	{key: "pl", value: "polština"},
	{key: "ps", value: "paštština"},
	{key: "pt", value: "portugalština"},
	{key: "qu", value: "kečuánština"},
	{key: "rm", value: "rétorománština"},
	{key: "rn", value: "kirundština"},
	{key: "ro", value: "rumunština"},
	{key: "rw", value: "rwandština"},
	{key: "sa", value: "sanskrt"},
	{key: "sc", value: "sardština"},
	{key: "sd", value: "sindhština"},
	{key: "se", value: "severní sámština"},
	{key: "sg", value: "sangština"},
	{key: "sh", value: "srbochorvatština"},
	{key: "si", value: "sinhálština"},
	{key: "sl", value: "slovinština"},
	{key: "sm", value: "samojština"},
	{key: "sn", value: "šonština"},
	{key: "so", value: "somálština"},
	{key: "sq", value: "albánština"},
	{key: "sr", value: "srbština"},
	{key: "ss", value: "svazijština"},
	{key: "st", value: "sotština"},
	{key: "su", value: "sundština"},
	{key: "sv", value: "švédština"},
	{key: "sw", value: "svahilština"},
	{key: "ta", value: "tamilština"},
	{key: "te", value: "telugština"},
	{key: "tg", value: "tádžičtina"},
	{key: "th", value: "thajština"},
	{key: "ti", value: "tigriňňa"},
	{key: "tk", value: "turkmenština"},
	{key: "tl", value: "tagalština"},
	{key: "tn", value: "čwanština"},
	{key: "to", value: "tonžština"},
	{key: "tr", value: "turečtina"},
	{key: "ts", value: "tsonga"},
	{key: "tt", value: "tatarština"},
	{key: "tw", value: "ťwiština"},
	{key: "ty", value: "tahitština"},
	{key: "ug", value: "ujgurština"},
	{key: "uk", value: "ukrajinština"},
	{key: "ur", value: "urdština"},
	{key: "uz", value: "uzbečtina"},
	{key: "ve", value: "luvendština"},
	{key: "vi", value: "vietnamština"},
	{key: "vo", value: "volapük"},
	{key: "wa", value: "valonština"},
	{key: "wo", value: "wolofština"},
	{key: "xh", value: "xhoština"},
	{key: "yi", value: "jidiš"},
	{key: "yo", value: "jorubština"},
	{key: "za", value: "čuangština"},
	{key: "zh", value: "čínština"},
	{key: "zu", value: "zulština"},
];

export const countryCode: ILangCode[] = [
	{key: "sk", value: "Slovensko"},
	{key: "cz", value: "Česko"},
	{key: "cs", value: "Česko-Slovensko"},
	{key: "ad", value: "Andorra"},
	{key: "ae", value: "Spojené arabské emiráty"},
	{key: "af", value: "Afganistan"},
	{key: "ag", value: "Antigua a Barbuda"},
	{key: "ai", value: "Anguilla"},
	{key: "al", value: "Albánsko"},
	{key: "am", value: "Arménsko"},
	{key: "ao", value: "Angola"},
	{key: "aq", value: "Antarktída"},
	{key: "ar", value: "Argentína"},
	{key: "as", value: "Americká Samoa"},
	{key: "at", value: "Rakúsko"},
	{key: "au", value: "Austrália"},
	{key: "aw", value: "Aruba"},
	{key: "ax", value: "Alandy"},
	{key: "az", value: "Azerbajdžan"},
	{key: "ba", value: "Bosna a Hercegovina"},
	{key: "bb", value: "Barbados"},
	{key: "bd", value: "Bangladéš"},
	{key: "be", value: "Belgicko"},
	{key: "bf", value: "Burkina"},
	{key: "bg", value: "Bulharsko"},
	{key: "bh", value: "Bahrajn"},
	{key: "bi", value: "Burundi"},
	{key: "bj", value: "Benin"},
	{key: "bl", value: "Svätý Bartolomej"},
	{key: "bm", value: "Bermudy"},
	{key: "bn", value: "Brunej"},
	{key: "bo", value: "Bolívia"},
	{key: "br", value: "Brazília"},
	{key: "bs", value: "Bahamy"},
	{key: "bt", value: "Bhután"},
	{key: "bv", value: "Bouvetov ostrov"},
	{key: "bw", value: "Botswana"},
	{key: "by", value: "Bielorusko"},
	{key: "bz", value: "Belize"},
	{key: "ca", value: "Kanada"},
	{key: "cc", value: "Kokosové ostrovy"},
	{key: "cd", value: "Konžská demokratická republika"},
	{key: "cf", value: "Stredoafrická republika"},
	{key: "cg", value: "Kongo"},
	{key: "ch", value: "Švajčiarsko"},
	{key: "ci", value: "Pobrežie Slonoviny"},
	{key: "ck", value: "Cookove ostrovy"},
	{key: "cl", value: "Čile"},
	{key: "cm", value: "Kamerun"},
	{key: "cn", value: "Čína"},
	{key: "co", value: "Kolumbia"},
	{key: "cp", value: "Clipperton"},
	{key: "cr", value: "Kostarika"},
	{key: "cu", value: "Kuba"},
	{key: "cv", value: "Kapverdy"},
	{key: "cw", value: "Curaçao"},
	{key: "cx", value: "Vianočný ostrov"},
	{key: "cy", value: "Cyprus"},
	{key: "de", value: "Nemecko"},
	{key: "dj", value: "Džibutsko"},
	{key: "dk", value: "Dánsko"},
	{key: "dm", value: "Dominika"},
	{key: "do", value: "Dominikánska republika"},
	{key: "dz", value: "Alžírsko"},
	{key: "ec", value: "Ekvádor"},
	{key: "ee", value: "Estónsko"},
	{key: "eg", value: "Egypt"},
	{key: "eh", value: "Západná Sahara"},
	{key: "el", value: "Grécko"},
	{key: "er", value: "Eritrea"},
	{key: "es", value: "Španielsko"},
	{key: "et", value: "Etiópia"},
	{key: "fi", value: "Fínsko"},
	{key: "fj", value: "Fidži"},
	{key: "fk", value: "Falklandy"},
	{key: "fm", value: "Mikronézia"},
	{key: "fo", value: "Faerské ostrovy"},
	{key: "fr", value: "Francúzsko"},
	{key: "ga", value: "Gabon"},
	{key: "gd", value: "Grenada"},
	{key: "ge", value: "Gruzínsko"},
	{key: "gf", value: "Francúzska Guyana"},
	{key: "gg", value: "Guernsey"},
	{key: "gh", value: "Ghana"},
	{key: "gi", value: "Gibraltár"},
	{key: "gl", value: "Grónsko"},
	{key: "gm", value: "Gambia"},
	{key: "gn", value: "Guinea"},
	{key: "gp", value: "Guadeloupe"},
	{key: "gq", value: "Rovníková Guinea"},
	{key: "gs", value: "Južná Georgia a Južné Sandwichove ostrovy"},
	{key: "gt", value: "Guatemala"},
	{key: "gu", value: "Guam"},
	{key: "gw", value: "Guinea-Bissau"},
	{key: "gy", value: "Guyana"},
	{key: "hk", value: "Hongkong"},
	{key: "hm", value: "Heardov ostrov"},
	{key: "hn", value: "Honduras"},
	{key: "hr", value: "Chorvátsko"},
	{key: "ht", value: "Haiti"},
	{key: "hu", value: "Maďarsko"},
	{key: "id", value: "Indonézia"},
	{key: "ie", value: "Írsko"},
	{key: "il", value: "Izrael"},
	{key: "im", value: "Ostrov Man"},
	{key: "in", value: "India"},
	{key: "io", value: "Britské indickooceánske územie"},
	{key: "iq", value: "Irak"},
	{key: "ir", value: "Irán"},
	{key: "is", value: "Island"},
	{key: "it", value: "Taliansko"},
	{key: "je", value: "Jersey"},
	{key: "jm", value: "Jamajka"},
	{key: "jo", value: "Jordánsko"},
	{key: "jp", value: "Japonsko"},
	{key: "ke", value: "Keňa"},
	{key: "kg", value: "Kirgizsko"},
	{key: "kh", value: "Kambodža"},
	{key: "ki", value: "Kiribati"},
	{key: "km", value: "Komory"},
	{key: "kn", value: "Svätý Krištof a Nevis"},
	{key: "kp", value: "Severná Kórea"},
	{key: "kr", value: "Južná Kórea"},
	{key: "kw", value: "Kuvajt"},
	{key: "ky", value: "Kajmanie ostrovy"},
	{key: "kz", value: "Kazachstan"},
	{key: "la", value: "Laos"},
	{key: "lb", value: "Libanon"},
	{key: "lc", value: "Svätá Lucia"},
	{key: "li", value: "Lichtenštajnsko"},
	{key: "lk", value: "Srí Lanka"},
	{key: "lr", value: "Libéria"},
	{key: "ls", value: "Lesotho"},
	{key: "lt", value: "Litva"},
	{key: "lu", value: "Luxembursko"},
	{key: "lv", value: "Lotyšsko"},
	{key: "ly", value: "Líbya"},
	{key: "ma", value: "Maroko"},
	{key: "mc", value: "Monako"},
	{key: "md", value: "Moldavsko"},
	{key: "me", value: "Čierna Hora"},
	{key: "mf", value: "Saint Martin"},
	{key: "mg", value: "Madagaskar"},
	{key: "mh", value: "Marshallove ostrovy"},
	{key: "mk", value: "Severné Macedónsko"},
	{key: "ml", value: "Mali"},
	{key: "mm", value: "Mjanmarsko/Barma"},
	{key: "mn", value: "Mongolsko"},
	{key: "mo", value: "Macao"},
	{key: "mp", value: "Ostrovy Severné Mariány"},
	{key: "mq", value: "Martinik"},
	{key: "mr", value: "Mauritánia"},
	{key: "ms", value: "Montserrat"},
	{key: "mt", value: "Malta"},
	{key: "mu", value: "Maurícius"},
	{key: "mv", value: "Maldivy"},
	{key: "mw", value: "Malawi"},
	{key: "mx", value: "Mexiko"},
	{key: "my", value: "Malajzia"},
	{key: "mz", value: "Mozambik"},
	{key: "na", value: "Namíbia"},
	{key: "nc", value: "Nová Kaledónia"},
	{key: "ne", value: "Niger"},
	{key: "nf", value: "Ostrov Norfolk"},
	{key: "ng", value: "Nigéria"},
	{key: "ni", value: "Nikaragua"},
	{key: "nl", value: "Holandsko"},
	{key: "no", value: "Nórsko"},
	{key: "np", value: "Nepál"},
	{key: "nr", value: "Nauru"},
	{key: "nu", value: "Niue"},
	{key: "nz", value: "Nový Zéland"},
	{key: "om", value: "Omán"},
	{key: "pa", value: "Panama"},
	{key: "pe", value: "Peru"},
	{key: "pf", value: "Francúzska Polynézia"},
	{key: "pg", value: "Papua-Nová Guinea"},
	{key: "ph", value: "Filipíny"},
	{key: "pk", value: "Pakistan"},
	{key: "pl", value: "Poľsko"},
	{key: "pm", value: "Saint Pierre a Miquelon"},
	{key: "pn", value: "Pitcairnove ostrovy"},
	{key: "pr", value: "Portoriko"},
	{key: "pt", value: "Portugalsko"},
	{key: "pw", value: "Palau"},
	{key: "py", value: "Paraguaj"},
	{key: "qa", value: "Katar"},
	{key: "re", value: "Réunion"},
	{key: "ro", value: "Rumunsko"},
	{key: "rs", value: "Srbsko"},
	{key: "ru", value: "Rusko"},
	{key: "rw", value: "Rwanda"},
	{key: "sa", value: "Saudská Arábia"},
	{key: "sb", value: "Šalamúnove ostrovy"},
	{key: "sc", value: "Seychely"},
	{key: "sd", value: "Sudán"},
	{key: "se", value: "Švédsko"},
	{key: "sg", value: "Singapur"},
	{key: "sh", value: "Svätá Helena, Ascension a Tristan da Cunha"},
	{key: "si", value: "Slovinsko"},
	{key: "sj", value: "Svalbard a Jan Mayen"},
	{key: "sl", value: "Sierra Leone"},
	{key: "sm", value: "San Maríno"},
	{key: "sn", value: "Senegal"},
	{key: "so", value: "Somálsko"},
	{key: "sr", value: "Surinam"},
	{key: "ss", value: "Južný Sudán"},
	{key: "st", value: "Svätý Tomáš a Princov ostrov"},
	{key: "sv", value: "Salvádor"},
	{key: "sx", value: "Svätý Martin"},
	{key: "sy", value: "Sýria"},
	{key: "sz", value: "Eswatini"},
	{key: "tc", value: "Turks a Caicos"},
	{key: "td", value: "Čad"},
	{key: "tf", value: "Francúzske južné a antarktické územia"},
	{key: "tg", value: "Togo"},
	{key: "th", value: "Thajsko"},
	{key: "tj", value: "Tadžikistan"},
	{key: "tk", value: "Tokelau"},
	{key: "tl", value: "Východný Timor"},
	{key: "tm", value: "Turkménsko"},
	{key: "tn", value: "Tunisko"},
	{key: "to", value: "Tonga"},
	{key: "tr", value: "Turecko"},
	{key: "tt", value: "Trinidad a Tobago"},
	{key: "tv", value: "Tuvalu"},
	{key: "tw", value: "Taiwan"},
	{key: "tz", value: "Tanzánia"},
	{key: "ua", value: "Ukrajina"},
	{key: "ug", value: "Uganda"},
	{key: "uk", value: "Spojené kráľovstvo"},
	{key: "um", value: "Menšie odľahlé ostrovy Spojených štátov"},
	{key: "us", value: "Spojené štáty"},
	{key: "uy", value: "Uruguaj"},
	{key: "uz", value: "Uzbekistan"},
	{key: "va", value: "Svätá stolica/Vatikánsky mestský štát"},
	{key: "vc", value: "Svätý Vincent a Grenadíny"},
	{key: "ve", value: "Venezuela"},
	{key: "vg", value: "Britské Panenské ostrovy"},
	{key: "vi", value: "Americké Panenské ostrovy"},
	{key: "vn", value: "Vietnam"},
	{key: "vu", value: "Vanuatu"},
	{key: "wf", value: "Wallis a Futuna"},
	{key: "ws", value: "Samoa"},
	{key: "ye", value: "Jemen"},
	{key: "yt", value: "Mayotte"},
	{key: "za", value: "Južná Afrika"},
	{key: "zm", value: "Zambia"},
	{key: "zw", value: "Zimbabwe"}
];
