// Stats and analytics for user profile
import { state } from './state.js';
import { SECTIONS } from './data.js';
import { IconSparkle, IconStar, IconZap, IconGame, IconAnime, IconMovie, IconTrophy, IconGlobe, IconPalette, IconBook } from './icons.js';

export function calculateCompletionStats() {
  const stats = {
    overall: 0,
    sections: {},
    totalFields: 0,
    filledFields: 0,
    achievements: [],
  };

  // Identity section
  const identity = state.identity;
  let identityFilled = 0;
  let identityTotal = 5;
  if (identity.name) identityFilled++;
  if (identity.country) identityFilled++;
  if (identity.bestTimeToPresent) identityFilled++;
  if (identity.description) identityFilled++;
  if (identity.handles.length) identityFilled++;
  stats.sections.identity = { filled: identityFilled, total: identityTotal, percentage: (identityFilled / identityTotal * 100).toFixed(0) };

  // Intro section
  const intro = state.intro;
  let introFilled = 0;
  let introTotal = 10;
  if (intro.jobTitle) introFilled++;
  if (intro.yearsExperience) introFilled++;
  if (intro.prevCompany) introFilled++;
  if (intro.city) introFilled++;
  if (intro.careerHighlight) introFilled++;
  if (intro.motto) introFilled++;
  if (intro.unknownFact) introFilled++;
  if (intro.currentlyLearning) introFilled++;
  if (intro.freeTimeChoice) introFilled++;
  if (intro.truth1 && intro.truth2 && intro.lie) introFilled++;
  stats.sections.intro = { filled: introFilled, total: introTotal, percentage: (introFilled / introTotal * 100).toFixed(0) };

  // Gaming section
  const gaming = state.gaming;
  let gamingFilled = 0;
  let gamingTotal = 4;
  if (gaming.consoles.length) gamingFilled++;
  if (gaming.topGames.length) gamingFilled++;
  if (gaming.replayGame) gamingFilled++;
  if (gaming.favoriteCharacter) gamingFilled++;
  stats.sections.gaming = { filled: gamingFilled, total: gamingTotal, percentage: (gamingFilled / gamingTotal * 100).toFixed(0) };

  // Anime section
  const anime = state.anime;
  let animeFilled = 0;
  let animeTotal = 5;
  if (anime.watches !== null) animeFilled++;
  if (anime.topAnime.length) animeFilled++;
  if (anime.favoriteCharacterData) animeFilled++;
  if (anime.subDub) animeFilled++;
  if (anime.comfortRewatch) animeFilled++;
  stats.sections.anime = { filled: animeFilled, total: animeTotal, percentage: (animeFilled / animeTotal * 100).toFixed(0) };

  // Movies section
  const movies = state.movies;
  let moviesFilled = 0;
  let moviesTotal = 5;
  if (movies.topMovies.length) moviesFilled++;
  if (movies.starWars !== null) moviesFilled++;
  if (movies.marvel !== null) moviesFilled++;
  if (movies.comfortRewatch) moviesFilled++;
  if (movies.favoriteQuote) moviesFilled++;
  stats.sections.movies = { filled: moviesFilled, total: moviesTotal, percentage: (moviesFilled / moviesTotal * 100).toFixed(0) };

  // Hobbies section
  const hobbies = state.hobbies;
  let hobbiesFilled = 0;
  let hobbiesTotal = 2;
  if (hobbies.selected.length) hobbiesFilled++;
  if (hobbies.creative) hobbiesFilled++;
  stats.sections.hobbies = { filled: hobbiesFilled, total: hobbiesTotal, percentage: (hobbiesFilled / hobbiesTotal * 100).toFixed(0) };

  // Wildcards section
  const wildcards = state.wildcards;
  let wildcardsFilled = Object.values(wildcards).filter(w => w.value && !w.skip).length;
  let wildcardsTotal = Object.keys(wildcards).length + 3; // +3 for truth/lie
  if (intro.truth1 && intro.truth2 && intro.lie) wildcardsFilled += 3;
  stats.sections.wildcards = { filled: wildcardsFilled, total: wildcardsTotal, percentage: (wildcardsFilled / wildcardsTotal * 100).toFixed(0) };

  // Calculate overall
  stats.totalFields = identityTotal + introTotal + gamingTotal + animeTotal + moviesTotal + hobbiesTotal + wildcardsTotal;
  stats.filledFields = identityFilled + introFilled + gamingFilled + animeFilled + moviesFilled + hobbiesFilled + wildcardsFilled;
  stats.overall = (stats.filledFields / stats.totalFields * 100).toFixed(0);

  // Calculate achievements
  stats.achievements = calculateAchievements(stats);

  return stats;
}

function calculateAchievements(stats) {
  const achievements = [];

  // Completion achievements
  if (stats.overall >= 100) {
    achievements.push({ id: 'perfectionist', name: 'Perfectionist', icon: IconSparkle, description: 'Completed 100% of your character sheet' });
  } else if (stats.overall >= 75) {
    achievements.push({ id: 'dedicated', name: 'Dedicated', icon: IconStar, description: 'Completed 75% of your character sheet' });
  } else if (stats.overall >= 50) {
    achievements.push({ id: 'committed', name: 'Committed', icon: IconZap, description: 'Completed 50% of your character sheet' });
  }

  // Section-specific achievements
  if (stats.sections.gaming.percentage >= 100) {
    achievements.push({ id: 'gamer', name: 'True Gamer', icon: IconGame, description: 'Completed the Gaming section' });
  }
  if (stats.sections.anime.percentage >= 100) {
    achievements.push({ id: 'otaku', name: 'Otaku', icon: IconAnime, description: 'Completed the Anime section' });
  }
  if (stats.sections.movies.percentage >= 100) {
    achievements.push({ id: 'cinephile', name: 'Cinephile', icon: IconMovie, description: 'Completed the Movies section' });
  }

  // Content achievements
  if (state.gaming.topGames.length >= 3) {
    achievements.push({ id: 'collector', name: 'Game Collector', icon: IconTrophy, description: 'Added 3 favorite games' });
  }
  if (state.identity.handles.length >= 5) {
    achievements.push({ id: 'connected', name: 'Well Connected', icon: IconGlobe, description: 'Added 5+ social handles' });
  }
  if (state.hobbies.selected.length >= 5) {
    achievements.push({ id: 'renaissance', name: 'Renaissance Person', icon: IconPalette, description: 'Selected 5+ hobbies' });
  }

  return achievements;
}

export function getPersonalityInsights() {
  const insights = [];

  // Gaming insights
  if (state.gaming.topGames.length >= 3) {
    insights.push({ category: 'Gaming', text: 'You have strong gaming preferences and clear favorites', emoji: IconGame });
  }
  if (state.gaming.consoles.includes('pc') && state.gaming.consoles.includes('playstation')) {
    insights.push({ category: 'Gaming', text: 'Multi-platform gamer - you appreciate different gaming experiences', emoji: IconTrophy });
  }

  // Anime/Movies insights
  if (state.anime.watches && state.movies.topMovies.length) {
    insights.push({ category: 'Media', text: 'Well-rounded media consumer - anime and live-action', emoji: IconMovie });
  }
  if (state.anime.subDub === 'sub') {
    insights.push({ category: 'Anime', text: 'Purist - you prefer the original voice acting', emoji: IconAnime });
  }

  // Social insights
  if (state.identity.handles.length >= 5) {
    insights.push({ category: 'Social', text: 'Highly connected - you maintain presence across multiple platforms', emoji: IconGlobe });
  }

  // Hobby insights
  if (state.hobbies.selected.length >= 6) {
    insights.push({ category: 'Lifestyle', text: 'Renaissance person - diverse interests and hobbies', emoji: IconSparkle });
  }
  if (state.hobbies.creative) {
    insights.push({ category: 'Creativity', text: 'Creative spirit - you express yourself through art', emoji: IconPalette });
  }

  // Personality insights from wildcards
  const wildcardsCount = Object.values(state.wildcards).filter(w => w.value && !w.skip).length;
  if (wildcardsCount >= 4) {
    insights.push({ category: 'Personality', text: 'Open book - you\'re comfortable sharing your thoughts', emoji: IconBook });
  }

  return insights;
}

export function getShareableStats() {
  const stats = calculateCompletionStats();
  return {
    completionRate: stats.overall,
    totalFields: stats.filledFields,
    achievements: stats.achievements.length,
    topCategory: Object.entries(stats.sections)
      .sort((a, b) => b[1].percentage - a[1].percentage)[0][0],
  };
}
