export const shortenStringKeepWord = (text: string, maxLength: number) => {
    //if the text is longer than 30 chars, shorten it. ELSE return unchanged
    if (text.length > maxLength) {
        //shorten the string but keep the whole word
        return text.slice(0,maxLength).split(' ').slice(0, -1).join(' ') + '...'
    } else {
        return text;
    }
}