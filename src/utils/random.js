export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem(array) {
    return array[randomNumber(0, array.length - 1)];
}

export function randomAffectionateName() {
    const affectionateNames = [
        'meu bem',
        'meu amorzinho',
        'meu docinho',
        'minha gatinha',
        'minha princesa'
    ];

     return randomItem(affectionateNames);
}

export function randomAffectionatePhrase() {
    const affectionatePhrases = [
        'te amo!',
        'estou cheio de saudades!',
        'você é muito bonita',
        'você é minha pessoa preferida'
    ];

     return randomItem(affectionatePhrases);
}