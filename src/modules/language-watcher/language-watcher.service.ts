import languagedetect from "languagedetect";

function getRussianLanguagePercent(text: string) {
    const detector = new languagedetect();
    const result = detector.detect(text, 3);

    console.log(result);

    const russianItem = result.find(tuple => tuple[0] === 'russian');

    return russianItem ? russianItem[1] * 100 : 0;
}

export default {
    getRussianLanguagePercent
}