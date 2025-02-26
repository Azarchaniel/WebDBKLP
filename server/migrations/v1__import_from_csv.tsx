import Autor from "../src/models/autor";
import Book from "../src/models/book";
import LP from "../src/models/lp";
import Quote from "../src/models/quote";
import {IBook} from "../src/types";
import {AutorRole} from "../src/utils/constants";
import {connectDBforMigration} from "./premigration";

/**
 * Save as: Text oddeleny tabulatormi; change format to csv; UTF-8
 * HOW TO RUN:
 * npx ts-node migrations/v1__import_from_csv.tsx DBKLP_Lubos.csv
 */

const alreadyCheckedBooks = ["Zombies, Run!","Bojové techniky starověkého světa","Zlatý osel","Tažení Alexandra Velikého","Hovory k sobě","Atlas římské říše: Budování říše a období rozmachu: 300 př. n. l. – 200 n. l.","Ideologie a virtuální město","Absint","A People's History of Scotland","Báseň o hašiši","Čas je hráč","Důvěrné deníky","Důvěrný deník","Fanfarlo","Hořké propasti","Chuť smútku","Květy zla","Květy zla","Květy zla a jiné básně","Kytica z Kvetov zla","La Fanfarlo","Les Fleurs du mal","Malé básně v próze","Malé básně v próze","Malé básně v próze","Mé srdce, tak jak je","Parížsky spleen - Malé básne v próze","Petits po?mes en prose / Malé básně v próze","Rakety / Mé srdce obnažené","Selected Poems","Tej, čo prešla popri mne","The Flowers of Evil","The Flowers of Evil","The Flowers of Evil / Les Fleurs du Mal","Umělé ráje","Úvahy o některých současnících","Víno samotářovo","Z Kvetov zla","Žena","Školní mluvnice ruského jazyka","Co je nového v počítačových hrách","Charles Baudelaire","Bojové techniky středověkého světa","Nové pohledy: mapy světa, jak ho neznáme","Láska a válka","Superinteligence","Od kompasu k GPS","Geostorky","Hannibal","Podivuhodný příběh - Esej o jednom Baudelairově snu","Válečné paměti","Mýtus o Sisyfovi","J. R. R. Tolkien: Životopis","Tolkien: Zákulisí Pána prstenů","O povinnostech","Únos Proserpiny","O válce","Migrace: Stěhování lidstva od pravěku po současnost","Izrael a Palestina","Půlkacíř","Dějiny zemí Koruny české II.","Husitská revoluce: Stručná historie","Evropa - Dějiny jednoho kontinentu","Charles Baudelaire","Fenomén Karel Kryl","Když hvězdy byly ještě bohy","Jak vidím svět","Z mých pozdějších let","Řecké mýty: Mytologie a filosofie","The Atlas of Tolkien's Middle-Earth","Roboti nastupují: Automatizace, umělá inteligence a hrozba budoucnosti bez práce","Hrdinové","Mýty","Prométheus: Bitva s Titány","Norse Mythology","Světy J. R. R. Tolkiena","Charles Baudelaire","Charles Baudelaire","Úpadok a zánik Rímskej ríše","Mytologie Slovanů","Brána bohov: Vzostup a pád Babylonu","Římští císařové","Příručka pro partyzány","Řecké mýty I","Řecké mýty II","Zlaté rouno","Bojové techniky orientálního světa","Vesmír v kostce","Řím po Marku Aureliovi / Kniha o císařích","Odysseia","Slovník antické kultury","Báje a mýty starých Slovanů","Velká nástěnná mapa světových dějin","Einstein: Jeho život a vesmír","Atentát na Reinharda Heydricha","Běhání pre (ne)chápavé","Soumrak bohů: Severské mýty a báje","Supervelmoci umělé inteligence - Čína, Silicon Valley a svět v éře AI","Fyzika budoucnosti","Fyzika nemožného","Hyperprostor","Vidím širou a krásnou zemi","Čarovné hrady a zámky Slovenska","Portréty světovládců I","Gramatika současné švédštiny","Homérští hrdinové ve vzpomínkách věků","Na veselé struně","Písně pastvin a lesů","Svět ezopských bajek","Synové slávy – oběti iluzí","Verše o víně","Óda na Ódina","Sága o Hervaře","Monomýtus: Syntetické pojednání o teorii mýtu","Sága o Lundirovi","Nero","Kníška Karla Kryla","Komplet - Vyměň kordy za akordy","Krylogie","Krylogie","Ostrov pokladů","Prózy","Rozhovory","Rýmované komentáře","Země Lhostejnost","Panorama mytologie","Zpěvy Maldororovy - Poesie - Dopisy","Trpaslíci a elfové ve středověku","Poslední dny Charlese Baudelaira","Bröderna Lejonhjärta","Dějiny I","Dějiny II-III","Dějiny IV","Dějiny V","Dějiny VI","Dějiny VII","Doma lidé umírají","Pod maskou smích","Pro koho krev","Spartakus - Před námi boj","Spartakus - Smrtí boj nekončí","Farsalské pole","Listy hetér","Pravdivé výmysly","Šlehy a úsměvy","Severský bestiář","Alexander Veľký - Dedič ríše","Alexander Veľký - Dobyvateľ","Alexander Veľký - Veštba Amonova","Sila geografie v 21. storočí: Desať máp budúcnosti nášho sveta","V zajatí geografie","Umělá inteligence","Umělá inteligence","Umělá inteligence","Umělá inteligence","Umělá inteligence","Umělá inteligence","The Enemies of Rome","Starověké báje a pověsti","CSS: Moderní layout","Co kdyby?","Héró a Leandros","O lásce a milování","Ruština nejen pro samouky","Švédština nejen pro samouky","Kleopatra – Ve znamení hada","Být tak strojem","Proměny","Polidštěná galaxie: Kosmická budoucnost lidstva 2","SU-152 a příbuzná vozidla","Tolkien: Man and Myth","Satirikon","Bolestný život Baudelairův","Děti Jasanu a Jívy: Dějiny Vikingů","Kmotr - příběhy rodiny dona Coleona","Atlas klasického Řecka: 5. a 4. stol. př. n. l.: zlatý věk první evropské civilizace","The Book of Beasties: A Scottish Bestiary of Old 1710","Mýty starého světa","Seven Brief Lessons on Physics","Héraklés a jiné tragédie","Bouřková sezóna","Čas opovržení","Krev elfů","Křest ohněm","Meč osudu","Paní jezera","Poslední přání","Věž vlaštovky","Zaklínač (poviedka 1)","O duševním klidu","Tragédie I.","Tragédie II.","Výbor z listů Luciliovi","Armáda strojů: Autonomní zbraně a budoucnost války","Recommendation Engines","Krev, pot a pixely","Press Reset","Signál a šum","The Wolf Age: The Vikings, the Anglo-Saxons and the Battle for the North Sea Empire","Melancholie v zrcadle","Moudrost starých Římanů","Everybody Lies: What the Internet Can Tell Us About Who We Really Are","Sen o Tróji","Sága o svatém Óláfovi","Když papyry promluvily","Nová velká kniha etikety","Agricola, Anály, Germánia, Histórie","Velký průvodce JavaScriptem","Dopisy Otce Vánoc","Pád Númenoru","Pan Blahoš  / Mr. Bliss","A Secret Vice: Tolkien on Invented Languages","The Hobbit","The Lay of Aotrou & Itroun","Artušův pád / The Fall of Arthur","Beowulf","Beren and Lúthien","Dve veže","Hobit","Hobit aneb Cesta tam a zase zpátky","Húrinove deti","Letters from Father Christmas","List od Nimrala a jiné příběhy","Návrat kráľa","Nedokončené príbehy","Netvoři a kritikové a jiné eseje","Pád Gondolinu","Roverandom","Silmarillion","Silmarillion","Smith of Wootton Major","Spoločenstvo prsteňa","The Adventures of Tom Bombadil and Other Verses from the Red Book","The Battle of Maldon: together with The Homecoming of Beorhtnoth","The Fall of Númenor: and Other Tales from the Second Age of Middle-earth","The Fellowship of the Ring","The Hobbit: Or There and Back Again","The Return of the King","The Two Towers","Po nás potopa","Baudelaire","The Complete Tolkien Companion","Život v starom Ríme","Svět dávných Slovanů","Velká Morava: Tisíciletá tradice státu a kultury","Dějiny zemí Koruny české I.","Zpěvy rolnické a pastýřské","Nápady","Ben Hur","Spravedlivé a nespravedlivé války","SAS - Příručka jak přežít","SAS Survival Guide: How to Survive in the Wild, on Land or Sea","Řecké dějiny - Lakedaimovské zřízení o státních příjmech","Slečna Baudelairová","Bohové a hrdinové antických bájí","Dejiny písané Rímom","Jejich veličenstva pyramidy","Na počátku byl Sumer","Objevení Tróje","Řecký zázrak","Sinuhet","Za sedmi divy světa","1968 - Revoluční rok ve fotografiích","Béowulf","Edda","Epos o Gilgamešovi","Hráme na gitare","Kalevala","Lživé ságy starého Severu","Sága o Grettim","Staroislandské ságy","Školní atlas československých dějin","A dívky mlčely","Květy zla","Srdce temnoty","Rusky za 4 týdny","Naše planeta","Syntaktické struktury","Staré pověsti české","El retorno del rey","Hobit","Hobit aneb cesta tam a zase zpátky","Pán prstenů – souborné vydání","Exodus","Školní atlas světa","Kvety zla","Křížové výpravy"]

const getAuthorsIDandUnique = async (authors: string[], isbn: string, role: string) => {
    try {
        if (!authors) return;

        const foundAuthors = [];

        for (let author of authors) {
            author = author
                .replace(/\\/g, "")
                .replace(/'/g, "")
                .replace(/"/g, "")
                .trim();
            const splitted = author.split(",").map(word => word.trim());
            let firstName = "";
            let lastName = "";

            if (splitted.length < 1) return;

            // if name consist of only one word
            if (splitted.length === 1) {
                lastName = splitted[0];
            } else if (splitted.length === 2) {
                firstName = splitted[1];
                lastName = splitted[0];
            } else {
                lastName = splitted[0];
                firstName = splitted.slice(1).join(', ');
            }

            if (!lastName || lastName === "kolektív") return;

            let queryOptions: any = [
                {
                    lastName: {
                        $regex: `^${lastName.replace(/ová$/i, '')}(ová)?$`,
                        $options: 'i'
                    }
                }
            ];

            if (firstName.length > 0) {
                const firstNameConditions = [
                    {firstName: firstName}
                ];

                if (!firstName.includes(".")) {
                    firstNameConditions.push({
                        firstName: firstName
                            ?.split(" ")
                            .map(word => word[0] + ". ")
                            .join("")
                            .trim()
                    });
                }

                queryOptions = [
                    {
                        $and: [
                            queryOptions[0], // Prioritize lastName condition
                            {$or: firstNameConditions} // Include firstName conditions only when lastName matches
                        ]
                    },
                    ...queryOptions // Fall back to matching lastName alone
                ];
            }

            //console.log(`Found ${firstName} ${lastName}`);
            //console.log(queryOptions);
            let foundAuthor = await Autor.findOne({$or: queryOptions}).collation({locale: "cs", strength: 1});

            if (!foundAuthor) {
                foundAuthor = await Autor.create({firstName: firstName, lastName: lastName, role: role});
            } else {
                if (!foundAuthor.role?.includes(role)) {
                    await Autor.findByIdAndUpdate(
                        {_id: foundAuthor._id},
                        {
                            ...foundAuthor,
                            role: [...foundAuthor.role ?? [], role],
                        }
                    )
                }
            }

            //cleaning obj, so there is no hidden params from Mongo
            foundAuthors.push({
                _id: foundAuthor._id,
                lastName: foundAuthor.lastName,
                firstName: foundAuthor.firstName,
                fullName: `${foundAuthor.lastName ?? ""}${foundAuthor.firstName ? ", " + foundAuthor.firstName : ""}`,
            });


        }
        // remove duplicates
        return foundAuthors.filter((doc, index, self) =>
            index === self.findIndex(d => d.firstName === doc.firstName && d.lastName === doc.lastName)
        );
    } catch (err) {
        console.error("Error while finding autors for ", isbn);
    }
};

const parseDate = (date: string): Date => {
    const [day, month, year] = date.split('.').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate;
}

const createBook = async (row: string[], owner: string) => {
    try {
        const autors = [
            row[0],
            row[1],
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            row[7],
            row[8],
            row[9]
        ].filter((row) => row !== "");

        const editors = row[10].split(";");
        const translators = row[12].split(";");
        const ilustrators = row[11].split(";");

        const enrichedAuthors = await getAuthorsIDandUnique(autors, row[19], AutorRole.AUTOR);
        const enrichedTranslator = await getAuthorsIDandUnique(translators, row[19], AutorRole.TRANSLATOR);
        const enrichedIlustrators = await getAuthorsIDandUnique(ilustrators, row[19], AutorRole.ILUSTRATOR);
        const enrichedEditors = await getAuthorsIDandUnique(editors, row[19], AutorRole.EDITOR);

        //console.log(autors, translators, ilustrators, editors);
        //console.log(row.map((val, index) => `${index} ${val}`));

        const readBy = [];
        if (owner === "619800d46aba58b905cc2455") { //Lubos
            if (row[23] !== "") {
                readBy.push("619800d46aba58b905cc2455");//Lubos
            }
            if (row[24] !== "") {
                readBy.push("619802656aba58b905cc245e");
            }
        } else {
            if (row[24] !== "") {
                readBy.push("619800d46aba58b905cc2455");//Lubos
            }
            if (row[23] !== "") {
                readBy.push("619802656aba58b905cc245e");
            }
        }

        let city: string | undefined = undefined;

        switch (row[31]) {
            case "Spišská":
                city = "spisska";
                break;
            case "Ostrava":
            case "Břuchotín":
                city = "bruchotin";
                break;
            default:
                city = undefined;
        }

        const book = {
            title: row[13],
            autor: enrichedAuthors,
            translator: enrichedTranslator,
            ilustrator: enrichedIlustrators,
            editor: enrichedEditors,
            content: row[14],
            ISBN: row[19],
            published: {
                publisher: row[20],
                year: row[21],
                country: row[22],
            },
            numberOfPages: row[29],
            note: row[25],
            language: row[22].replace(" ", "").split("/"),
            serie: {
                title: row[17],
                no: row[18],
            },
            dimensions: {
                height: row[26] ? parseFloat(row[26])*10 : undefined, // *10, because Mongo is not saving decimal
                width: row[27] ? parseFloat(row[27])*10 : undefined,
                depth: row[28] ? parseFloat(row[28])*10 : undefined,
            },
            edition: {
                title: row[15],
                no: row[16],
            },
            location: {
                city: city,
                shelf: undefined
            },
            exLibris: Boolean(row[30]),
            hrefDatabazeKnih: "",
            hrefGoodReads: "",
            picture: "",
            readBy: readBy,
            owner: owner,
            wasChecked: alreadyCheckedBooks.includes(row[13]),
            createdAt: row[32] ? parseDate(row[32]) : new Date(),
        }
        //console.log(book);
        await Book.create(book);
    } catch (err) {
        console.error("error while creating book", row[19], err);
    }
}

const createLP = async (row: string[]) => {
    const splittedRow = row[0].split(";")
    const autors = splittedRow[0].split(",");

    const enrichedAutors = await getAuthorsIDandUnique(autors, splittedRow[1], AutorRole.MUSICIAN);

    const lp = {
        autor: enrichedAutors,
        title: splittedRow[1] || "",
        subtitle: splittedRow[2],
        edition: {
            title: splittedRow[4],
        },
        countLp: splittedRow[5],
        speed: splittedRow[6],
        publisher: {
            publisher: splittedRow[8],
            year: splittedRow[9],
            country: splittedRow[7]
        },
        language: splittedRow[10],
        note: splittedRow[11]
    }

    console.log(lp)

    try {
        await LP.create(lp);
    } catch (err) {
        console.error("error while creating LP", lp.title, err);
    }
}

const createQuote = async (row: string[]) => {
    let book: IBook | null = null;
    if (row[0]) {
        // 8071456071 becomes the regex 8-?0-?7-?1-?4-?5-?6-?0-?7-?1.
        const normalizedIsbn = new RegExp(
            row[0]
                .replace(/-/g, "")
                .split("")
                .join('-?'),
            "i");

        book = await Book.findOne({ISBN: normalizedIsbn});
    }

    const quote = {
        text: row[3].replace(/"{2,3}/g, '"'),
        fromBook: book ? book._id : undefined,
        pageNo: row[2] ? parseInt(row[2]) : undefined,
        owner: ["619800d46aba58b905cc2455"]
    }

    try {
        await Quote.create(quote);
    } catch (err) {
        console.error("error while creating Quote", quote.fromBook, err);
    }

}

const importFromCsv = () => {
    const filePath = process.argv[2];
    console.log("------------------------------");
    console.log("readCSV file", filePath);
    const fs = require('fs');

    // Add BOM handling and explicit encoding
    const options = {
        encoding: 'utf8',
        // This flag ensures we handle BOM correctly
        flag: 'r'
    };

    fs.readFile("data/" + filePath, options, async (err: Error, data: any) => {
        if (err) {
            console.error("Error reading file ", filePath, err);
            return;
        }

        // Remove BOM if present
        data = data.replace(/^\uFEFF/, '');

        // Normalize line endings
        data = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Split into rows, filter out empty lines
        const rows = data
            .split("\n")
            .filter((row: string) => row.trim().length > 0)
            .map((row: string) => {
                // Properly handle tab-delimited fields
                const fields = row.split("\t");
                // Trim whitespace from each field
                return fields.map(field => field.trim());
            });

        let processedCount = 0;
        const totalRows = rows.length;

        for (const [index, row] of rows.entries()) {
            // Update progress
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${totalRows}`);

            //if (index > 10) return process.exit(); //DEBUG

            try {
                switch (filePath) {
                    case "DBKLP_Lubos.csv":
                        await createBook(row, "619800d46aba58b905cc2455");
                        break;
                    case "DBKLP_Zaneta.csv":
                        await createBook(row, "619802656aba58b905cc245e");
                        break;
                    case "DBKLP_Jakub.csv":
                        await createBook(row, "62bb590bf7da6b9aaa2a3669");
                        break;
                    case "LP.csv":
                        await createLP(row);
                        break;
                    case "Quotes.csv":
                        await createQuote(row);
                        break;
                    default:
                        throw Error("Unknown file " + filePath);
                }
                processedCount++;
            } catch (error) {
                console.error('Row data:', row);
                // Continue with next row instead of stopping
                continue;
            }
        }

        console.log("===== FINISHED =======");
        process.exit();
    });
};

connectDBforMigration();
importFromCsv();
