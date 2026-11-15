export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomItem(array) {
  return array[randomNumber(0, array.length - 1)]
}

// Sorteia sem repetir o último item mostrado neste navegador.
function pickFresh(storageKey, items) {
  let last = null
  try { last = sessionStorage.getItem(storageKey) } catch { /* armazenamento indisponível */ }
  const options = items.length > 1 ? items.filter(item => item !== last) : items
  const choice = randomItem(options)
  try { sessionStorage.setItem(storageKey, choice) } catch { /* ignora */ }
  return choice
}

export function randomAffectionateName() {
  return pickFresh('rebeca-last-name', ['meu bem', 'meu amorzinho', 'meu docinho', 'minha gatinha', 'minha princesa'])
}

export function randomAffectionatePhrase() {
  return pickFresh('rebeca-last-phrase', ['te amo!', 'estou cheio de saudades!', 'você é muito bonita', 'você é minha pessoa preferida'])
}
