// Which images a sheet offers, and which of them it has chosen.
//
// These live here rather than in builder.js because both the builder and the
// read-only reader page need them, and the reader has no builder UI and no access
// to the app's `state` singleton — it renders a sheet decoded from the URL. Every
// function therefore takes the sheet explicitly.

/** Every image in the sheet that could serve as the card portrait. */
export function getAvatarOptions(s) {
  const options = [];

  if (s.anime.favoriteCharacterData) {
    options.push({
      id: 'anime-char-fav',
      label: s.anime.favoriteCharacterData.name,
      image: s.anime.favoriteCharacterData.imageLarge || s.anime.favoriteCharacterData.image,
      type: 'character',
    });
  }

  if (s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip) {
    options.push({
      id: 'anime-char-waifu',
      label: s.anime.waifuHusbandoData.name,
      image: s.anime.waifuHusbandoData.imageLarge || s.anime.waifuHusbandoData.image,
      type: 'character',
    });
  }

  s.anime.topAnime.forEach((a, i) => {
    if (a.imageLarge || a.image) {
      options.push({ id: `anime-${i}`, label: a.name, image: a.imageLarge || a.image, type: 'anime' });
    }
  });

  s.gaming.topGames.forEach((g, i) => {
    if (g.image) {
      options.push({ id: `game-${i}`, label: g.name, image: g.image, type: 'game' });
    }
  });

  if (s.gaming.replayGame && s.gaming.replayGame.image) {
    options.push({ id: 'game-replay', label: s.gaming.replayGame.name, image: s.gaming.replayGame.image, type: 'game' });
  }

  s.movies.topMovies.forEach((m, i) => {
    if (m.image) {
      options.push({ id: `movie-${i}`, label: m.name, image: m.image, type: 'movie' });
    }
  });

  if (s.movies.comfortRewatch && s.movies.comfortRewatch.image) {
    options.push({ id: 'movie-comfort', label: s.movies.comfortRewatch.name, image: s.movies.comfortRewatch.image, type: 'movie' });
  }

  return options;
}

/** Every game/anime/film in the sheet that has cover art. */
export function getMediaOptions(s) {
  const media = [];

  s.gaming.topGames.forEach((g, i) => {
    media.push({ id: `game-${i}`, name: g.name, image: g.image, type: 'game' });
  });
  if (s.gaming.replayGame) {
    media.push({ id: 'game-replay', name: s.gaming.replayGame.name, image: s.gaming.replayGame.image, type: 'game' });
  }
  s.anime.topAnime.forEach((a, i) => {
    media.push({ id: `anime-${i}`, name: a.name, image: a.image || a.imageLarge, type: 'anime' });
  });
  if (s.anime.comfortRewatch) {
    media.push({ id: 'anime-comfort', name: s.anime.comfortRewatch.name, image: s.anime.comfortRewatch.image, type: 'anime' });
  }
  s.movies.topMovies.forEach((m, i) => {
    media.push({ id: `movie-${i}`, name: m.name, image: m.image, type: 'movie' });
  });
  if (s.movies.comfortRewatch) {
    media.push({ id: 'movie-comfort', name: s.movies.comfortRewatch.name, image: s.movies.comfortRewatch.image, type: 'movie' });
  }

  return media.filter(m => m.image);
}

/** The chosen portrait, falling back to the first available image. */
export function selectedAvatar(s) {
  const options = getAvatarOptions(s);
  return options.find(a => a.id === s.cardConfig.avatarId) || options[0] || null;
}

/** The media the person ticked for the card's cover grid. */
export function highlightedMedia(s) {
  const ids = s.cardConfig.highlightedMedia || [];
  return getMediaOptions(s).filter(m => ids.includes(m.id));
}
