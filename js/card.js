import { getRPGClass, PLATFORMS } from './data.js';
import { getSelectedAvatar, getHighlightedMedia } from './builder.js';
import { $, showToast } from './utils.js';

const W = 800;
const LX = 50;
const RX = 420;
const CW = 330;
const SEP_X = 400;
const FULL_W = W - 100;

const COLORS = {
  bg: '#080b18',
  border: '#1e2140',
  accent: '#a78bfa',
  gaming: '#34d399',
  anime: '#f472b6',
  movies: '#fbbf24',
  hobbies: '#2dd4bf',
  wildcards: '#a78bfa',
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0b0',
  textMuted: '#666680',
};

export async function generateCard(s) {
  const canvas = $('card-canvas');
  const ctx = canvas.getContext('2d');

  const avatar = getSelectedAvatar();
  const media = s.cardConfig.showCollection ? getHighlightedMedia() : [];

  const imageUrls = [];
  if (avatar && avatar.image) imageUrls.push(avatar.image);
  media.forEach(m => { if (m.image) imageUrls.push(m.image); });
  const imageCache = await preloadImages(imageUrls);

  const totalH = measureCard(ctx, s, media);
  canvas.width = W;
  canvas.height = totalH;

  drawBackground(ctx, totalH);
  drawHeader(ctx, s);
  drawStats(ctx, s);
  let y = drawBody(ctx, s);

  if (s.cardConfig.showSocials && s.identity.handles.length) {
    y = drawSocials(ctx, s, y);
  }

  if (media.length) {
    y = drawCollection(ctx, media, y, imageCache);
  }

  drawFooter(ctx, y + 30);
  drawAvatar(ctx, avatar, imageCache);
}

function preloadImages(urls) {
  return new Promise(resolve => {
    const cache = new Map();
    const unique = [...new Set(urls)];
    if (!unique.length) { resolve(cache); return; }
    let loaded = 0;
    unique.forEach(url => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { cache.set(url, img); loaded++; if (loaded === unique.length) resolve(cache); };
      img.onerror = () => { loaded++; if (loaded === unique.length) resolve(cache); };
      img.src = url;
    });
  });
}

function measureCard(ctx, s, media) {
  let y = 265;
  y = measureHobbies(ctx, s, y);
  y = measureTwoColRow(ctx, s, y);
  y = measureMovies(ctx, s, y);
  y = measureWildcards(ctx, s, y);
  if (s.cardConfig.showSocials && s.identity.handles.length) y += 60 + Math.ceil(s.identity.handles.filter(h => h.handle).length / 3) * 28;
  if (media.length) {
    const maxPerRow = Math.floor(FULL_W / 80);
    y += 50 + Math.ceil(media.length / maxPerRow) * 119;
  }
  return Math.max(900, y + 80);
}

function measureHobbies(ctx, s, y) {
  if (!s.hobbies.selected.length && !s.hobbies.creative) return y;
  y += 30;
  if (s.hobbies.selected.length) {
    const hobbies = [...s.hobbies.selected];
    if (s.hobbies.custom) hobbies.push(s.hobbies.custom);
    ctx.font = '12px "Avenir Next", sans-serif';
    let cx = 0;
    let rows = 1;
    hobbies.forEach(tag => {
      const tw = ctx.measureText(tag).width + 18;
      if (cx + tw > FULL_W) { cx = 0; rows++; }
      cx += tw + 8;
    });
    y += rows * 30 + 16;
  }
  if (s.hobbies.creative) y += 40;
  return y + 10;
}

function measureTwoColRow(ctx, s, y) {
  const hasG = s.gaming.topGames.length || s.gaming.replayGame || s.gaming.favoriteCharacter;
  const hasA = s.anime.watches && (s.anime.topAnime.length || s.anime.favoriteCharacterData || s.anime.waifuHusbandoData);
  if (!hasG && !hasA) return y;
  let leftH = 0, rightH = 0;
  if (hasG) {
    leftH += 28;
    leftH += s.gaming.topGames.length * 24;
    if (s.gaming.topGames.length) leftH += 12;
    if (s.gaming.replayGame) leftH += 44;
    if (s.gaming.favoriteCharacter) leftH += 44;
  }
  if (hasA) {
    rightH += 28;
    rightH += s.anime.topAnime.length * 24;
    if (s.anime.topAnime.length) rightH += 12;
    if (s.anime.favoriteCharacterData) rightH += 44;
    if (s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip) rightH += 44;
  }
  return y + Math.max(leftH, rightH) + 20;
}

function measureMovies(ctx, s, y) {
  const hasM = s.movies.topMovies.length || (s.movies.starWars && s.movies.starWarsTrilogy) || (s.movies.marvel && s.movies.marvelHero) || s.movies.favoriteQuote;
  if (!hasM) return y;
  y += 28;
  y += s.movies.topMovies.length * 24;
  if (s.movies.topMovies.length) y += 12;
  const hasSW = s.movies.starWars && s.movies.starWarsTrilogy;
  const hasMarvel = s.movies.marvel && s.movies.marvelHero;
  if (hasSW || hasMarvel) y += 48;
  if (s.movies.favoriteQuote) {
    ctx.font = 'italic 14px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, `"${s.movies.favoriteQuote}"`, FULL_W);
    y += 30 + lines.length * 18;
    if (s.movies.favoriteQuoteSource) y += 20;
  }
  return y + 20;
}

function measureWildcards(ctx, s, y) {
  const wc = Object.entries(s.wildcards).filter(([, v]) => v.value && !v.skip);
  if (!wc.length) return y;
  y += 40;
  wc.forEach(([, v]) => {
    ctx.font = 'italic 13px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, `"${v.value}"`, FULL_W);
    y += 22 + lines.length * 17 + 14;
  });
  return y + 10;
}

function drawBackground(ctx, h) {
  const grad = ctx.createLinearGradient(0, 0, W, h);
  grad.addColorStop(0, '#0a0d20');
  grad.addColorStop(0.5, '#080b18');
  grad.addColorStop(1, '#0d0820');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, h);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundRect(ctx, 20, 20, W - 40, h - 40, 20);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(167, 139, 250, 0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, 24, 24, W - 48, h - 48, 18);
  ctx.stroke();

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * W;
    const y = Math.random() * h;
    const r = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
    ctx.fill();
  }
}

function drawHeader(ctx, s) {
  const name = s.identity.name || 'Unknown Adventurer';
  const rpgClass = getRPGClass(s);

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 34px "Avenir Next", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(name, 180, 88);

  ctx.fillStyle = COLORS.accent;
  ctx.font = '500 17px "Avenir Next", sans-serif';
  ctx.fillText(rpgClass, 180, 114);

  let infoY = 138;
  if (s.gaming.consoles.length) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '13px "Avenir Next", sans-serif';
    ctx.fillText(s.gaming.consoles.map(c => c.toUpperCase()).join(' / '), 180, infoY);
    infoY += 18;
  }

  if (s.anime.subDub) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '13px "Avenir Next", sans-serif';
    ctx.fillText(`${s.anime.subDub.charAt(0).toUpperCase() + s.anime.subDub.slice(1)}`, 180, infoY);
    infoY += 18;
  }

  if (s.identity.description) {
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'italic 13px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, s.identity.description, W - 230);
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, 180, infoY + i * 16);
    });
  }
}

function drawStats(ctx, s) {
  const stats = [];
  if (s.gaming.topGames.length) stats.push({ label: 'Games', value: s.gaming.topGames.length, color: COLORS.gaming });
  if (s.anime.topAnime.length) stats.push({ label: 'Anime', value: s.anime.topAnime.length, color: COLORS.anime });
  if (s.movies.topMovies.length) stats.push({ label: 'Movies', value: s.movies.topMovies.length, color: COLORS.movies });
  if (s.hobbies.selected.length) stats.push({ label: 'Hobbies', value: s.hobbies.selected.length, color: COLORS.hobbies });

  const y = 190;
  const boxW = 88;
  const startX = 180;

  stats.forEach((st, i) => {
    const x = startX + i * (boxW + 10);
    ctx.fillStyle = hexToRgba(st.color, 0.1);
    roundRect(ctx, x, y, boxW, 48, 8);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(st.color, 0.3);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, boxW, 48, 8);
    ctx.stroke();

    ctx.fillStyle = st.color;
    ctx.font = 'bold 18px "Avenir Next", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.value, x + boxW / 2, y + 21);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '10px "Avenir Next", sans-serif';
    ctx.fillText(st.label, x + boxW / 2, y + 38);
  });
  ctx.textAlign = 'left';
}

function drawBody(ctx, s) {
  let y = 265;

  y = drawHobbiesSection(ctx, s, y);
  y = drawGamingAnimeRow(ctx, s, y);
  y = drawMoviesSection(ctx, s, y);
  y = drawWildcardsSection(ctx, s, y);

  return y;
}

function drawSectionTitle(ctx, title, color, x, y, w) {
  ctx.fillStyle = color;
  ctx.font = 'bold 14px "Avenir Next", sans-serif';
  ctx.fillText(title, x, y);
  ctx.strokeStyle = hexToRgba(color, 0.4);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x + w, y + 6);
  ctx.stroke();
  return y + 24;
}

function drawHobbiesSection(ctx, s, y) {
  if (!s.hobbies.selected.length && !s.hobbies.creative) return y;

  y = drawSectionTitle(ctx, 'HOBBIES', COLORS.hobbies, LX, y, FULL_W);

  if (s.hobbies.selected.length) {
    const hobbies = [...s.hobbies.selected];
    if (s.hobbies.custom) hobbies.push(s.hobbies.custom);
    y = drawTags(ctx, hobbies, COLORS.hobbies, LX, y, FULL_W);
    y += 10;
  }

  if (s.hobbies.creative) {
    ctx.fillStyle = COLORS.hobbies;
    ctx.font = '11px "Avenir Next", sans-serif';
    ctx.fillText('CREATIVE', LX, y);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '14px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, s.hobbies.creative, FULL_W);
    lines.forEach((line, i) => ctx.fillText(line, LX, y + 18 + i * 17));
    y += 18 + lines.length * 17 + 8;
  }

  y += 6;
  return y;
}

function drawGamingAnimeRow(ctx, s, y) {
  const hasG = s.gaming.topGames.length || s.gaming.replayGame || s.gaming.favoriteCharacter;
  const hasA = s.anime.watches && (s.anime.topAnime.length || s.anime.favoriteCharacterData || (s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip));
  if (!hasG && !hasA) return y;

  drawHorizontalSep(ctx, y);
  y += 20;
  const rowStartY = y;

  let leftY = y;
  if (hasG) {
    leftY = drawSectionTitle(ctx, 'GAMING', COLORS.gaming, LX, leftY, CW);
    s.gaming.topGames.forEach((g, i) => {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '14px "Avenir Next", sans-serif';
      leftY = drawWrappedItem(ctx, `${i + 1}. ${g.name}`, LX + 6, leftY, CW - 6);
    });
    if (s.gaming.topGames.length) leftY += 8;
    if (s.gaming.replayGame) leftY = drawSmallLabelValue(ctx, 'Would Replay', s.gaming.replayGame.name, COLORS.gaming, LX, leftY, CW);
    if (s.gaming.favoriteCharacter) leftY = drawSmallLabelValue(ctx, 'Favorite Character', s.gaming.favoriteCharacter, COLORS.gaming, LX, leftY, CW);
  }

  let rightY = y;
  if (hasA) {
    rightY = drawSectionTitle(ctx, 'ANIME', COLORS.anime, RX, rightY, CW);
    s.anime.topAnime.forEach((a, i) => {
      ctx.fillStyle = COLORS.textSecondary;
      ctx.font = '14px "Avenir Next", sans-serif';
      rightY = drawWrappedItem(ctx, `${i + 1}. ${a.name}`, RX + 6, rightY, CW - 6);
    });
    if (s.anime.topAnime.length) rightY += 8;
    if (s.anime.favoriteCharacterData) rightY = drawSmallLabelValue(ctx, 'Anime Character', s.anime.favoriteCharacterData.name, COLORS.anime, RX, rightY, CW);
    if (s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip) rightY = drawSmallLabelValue(ctx, 'Waifu / Husbando', s.anime.waifuHusbandoData.name, COLORS.anime, RX, rightY, CW);
  }

  if (hasG && hasA) {
    drawVerticalSep(ctx, SEP_X, rowStartY - 4, Math.max(leftY, rightY) - 6);
  }

  return Math.max(leftY, rightY) + 6;
}

function drawMoviesSection(ctx, s, y) {
  const hasM = s.movies.topMovies.length || (s.movies.starWars && s.movies.starWarsTrilogy) || (s.movies.marvel && s.movies.marvelHero) || s.movies.favoriteQuote;
  if (!hasM) return y;

  drawHorizontalSep(ctx, y);
  y += 20;

  y = drawSectionTitle(ctx, 'MOVIES & SERIES', COLORS.movies, LX, y, FULL_W);

  s.movies.topMovies.forEach((m, i) => {
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '14px "Avenir Next", sans-serif';
    y = drawWrappedItem(ctx, `${i + 1}. ${m.name}`, LX + 6, y, FULL_W - 6);
  });
  if (s.movies.topMovies.length) y += 8;

  const hasSW = s.movies.starWars && s.movies.starWarsTrilogy;
  const hasMarvel = s.movies.marvel && s.movies.marvelHero;

  if (hasSW && hasMarvel) {
    let swText = capitalize(s.movies.starWarsTrilogy) + ' Trilogy';
    if (s.movies.starWarsSide) swText += ` \u00B7 ${capitalize(s.movies.starWarsSide)} Side`;
    const leftEnd = drawSmallLabelValue(ctx, 'Star Wars', swText, COLORS.movies, LX, y, CW);
    const rightEnd = drawSmallLabelValue(ctx, 'Marvel Hero', s.movies.marvelHero, COLORS.movies, RX, y, CW);
    y = Math.max(leftEnd, rightEnd);
  } else if (hasSW) {
    let swText = capitalize(s.movies.starWarsTrilogy) + ' Trilogy';
    if (s.movies.starWarsSide) swText += ` \u00B7 ${capitalize(s.movies.starWarsSide)} Side`;
    y = drawSmallLabelValue(ctx, 'Star Wars', swText, COLORS.movies, LX, y, FULL_W);
  } else if (hasMarvel) {
    y = drawSmallLabelValue(ctx, 'Marvel Hero', s.movies.marvelHero, COLORS.movies, LX, y, FULL_W);
  }

  if (s.movies.favoriteQuote) {
    ctx.fillStyle = COLORS.movies;
    ctx.font = 'bold 11px "Avenir Next", sans-serif';
    ctx.fillText('FAVORITE QUOTE', LX, y);
    y += 18;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'italic 14px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, `\u201C${s.movies.favoriteQuote}\u201D`, FULL_W);
    lines.forEach((line, i) => ctx.fillText(line, LX, y + i * 18));
    y += lines.length * 18 + 4;
    if (s.movies.favoriteQuoteSource) {
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '12px "Avenir Next", sans-serif';
      ctx.fillText(`\u2014 ${s.movies.favoriteQuoteSource}`, LX, y);
      y += 20;
    }
  }

  return y + 6;
}

function drawWildcardsSection(ctx, s, y) {
  const wildcards = Object.entries(s.wildcards).filter(([, v]) => v.value && !v.skip);
  if (!wildcards.length) return y;

  drawHorizontalSep(ctx, y);
  y += 20;
  y = drawSectionTitle(ctx, 'WILDCARDS', COLORS.wildcards, LX, y, FULL_W);

  wildcards.forEach(([key, v]) => {
    ctx.fillStyle = COLORS.wildcards;
    ctx.font = 'bold 11px "Avenir Next", sans-serif';
    ctx.fillText(getWildcardLabel(key).toUpperCase(), LX, y);
    y += 16;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'italic 13px "Avenir Next", sans-serif';
    const lines = wrapText(ctx, `\u201C${v.value}\u201D`, FULL_W);
    lines.forEach((line, i) => ctx.fillText(line, LX, y + i * 17));
    y += lines.length * 17 + 16;
  });

  return y;
}

function drawSmallLabelValue(ctx, label, value, color, x, y, maxW) {
  ctx.fillStyle = color;
  ctx.font = 'bold 11px "Avenir Next", sans-serif';
  ctx.fillText(label.toUpperCase(), x, y);
  y += 16;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '14px "Avenir Next", sans-serif';
  const lines = wrapText(ctx, value, maxW);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * 17));
  return y + lines.length * 17 + 10;
}

function drawWrappedItem(ctx, text, x, y, maxW) {
  const lines = wrapText(ctx, text, maxW);
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * 18));
  return y + lines.length * 18 + 4;
}

function drawHorizontalSep(ctx, y) {
  ctx.strokeStyle = hexToRgba(COLORS.border, 0.6);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(LX, y);
  ctx.lineTo(W - LX, y);
  ctx.stroke();
}

function drawVerticalSep(ctx, x, y1, y2) {
  ctx.strokeStyle = hexToRgba(COLORS.border, 0.5);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
}

function drawSocials(ctx, s, y) {
  drawHorizontalSep(ctx, y);
  y += 20;
  y = drawSectionTitle(ctx, 'SOCIALS', COLORS.accent, LX, y, FULL_W);

  const handles = s.identity.handles.filter(h => h.handle);
  ctx.font = '13px "Avenir Next", sans-serif';

  const colW = FULL_W / 3;
  handles.forEach((h, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = LX + col * colW;
    const hy = y + row * 26;
    const platformLabel = PLATFORMS.find(p => p.id === h.platform)?.label || h.platform;

    ctx.fillStyle = COLORS.accent;
    ctx.fillText(platformLabel, x, hy);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText(h.handle, x + ctx.measureText(platformLabel).width + 8, hy);
  });

  return y + Math.ceil(handles.length / 3) * 26 + 16;
}

function drawCollection(ctx, media, y, imageCache) {
  drawHorizontalSep(ctx, y);
  y += 20;
  y = drawSectionTitle(ctx, 'FAVORITE MEDIA', COLORS.textMuted, LX, y, FULL_W);

  const imgW = 70;
  const imgH = 95;
  const gap = 10;
  const maxPerRow = Math.floor(FULL_W / (imgW + gap));
  const typeColors = { game: COLORS.gaming, anime: COLORS.anime, movie: COLORS.movies };

  media.forEach((m, i) => {
    const col = i % maxPerRow;
    const row = Math.floor(i / maxPerRow);
    const x = LX + col * (imgW + gap);
    const iy = y + row * (imgH + 24);

    const img = imageCache.get(m.image);
    if (img) {
      ctx.save();
      roundRect(ctx, x, iy, imgW, imgH, 6);
      ctx.clip();
      ctx.drawImage(img, x, iy, imgW, imgH);
      ctx.restore();
    } else {
      ctx.fillStyle = hexToRgba(typeColors[m.type] || COLORS.textMuted, 0.08);
      roundRect(ctx, x, iy, imgW, imgH, 6);
      ctx.fill();
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.type === 'game' ? '\uD83C\uDFAE' : m.type === 'anime' ? '\uD83C\uDFAC' : '\uD83C\uDF9E', x + imgW / 2, iy + imgH / 2 + 8);
      ctx.textAlign = 'left';
    }

    ctx.strokeStyle = hexToRgba(typeColors[m.type] || COLORS.textMuted, 0.3);
    ctx.lineWidth = 1;
    roundRect(ctx, x, iy, imgW, imgH, 6);
    ctx.stroke();

    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '9px "Avenir Next", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(truncate(m.name, 12), x + imgW / 2, iy + imgH + 12);
    ctx.textAlign = 'left';
  });

  const rows = Math.ceil(media.length / maxPerRow);
  return y + rows * (imgH + 24) + 16;
}

function drawFooter(ctx, y) {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '12px "Avenir Next", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('charactersheet.neorgon.com', W / 2, y);
  ctx.textAlign = 'left';
}

function drawAvatar(ctx, avatar, imageCache) {
  const imgUrl = avatar ? avatar.image : '';
  const img = imgUrl ? imageCache.get(imgUrl) : null;

  if (!img) {
    drawPlaceholderAvatar(ctx);
    return;
  }

  ctx.save();
  roundRect(ctx, 50, 55, 110, 150, 12);
  ctx.clip();
  ctx.drawImage(img, 50, 55, 110, 150);
  ctx.restore();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  roundRect(ctx, 50, 55, 110, 150, 12);
  ctx.stroke();
}

function drawPlaceholderAvatar(ctx) {
  ctx.fillStyle = '#151830';
  roundRect(ctx, 50, 55, 110, 150, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundRect(ctx, 50, 55, 110, 150, 12);
  ctx.stroke();
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('?', 105, 145);
  ctx.textAlign = 'left';
}

export function exportPDF(s) {
  const canvas = $('card-canvas');
  let imgData;
  try {
    imgData = canvas.toDataURL('image/png');
  } catch {
    showToast('Cannot export: images blocked by CORS');
    return;
  }
  const cw = canvas.width;
  const ch = canvas.height;
  const pdfW = 210;
  const pdfH = (ch / cw) * pdfW;

  const loadAndGenerate = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: pdfH > pdfW ? 'portrait' : 'landscape', unit: 'mm', format: [pdfW, pdfH] });
    doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);

    const linkY = pdfH - (40 / ch) * pdfH;
    const linkW = 60;
    doc.link(pdfW / 2 - linkW / 2, linkY - 4, linkW, 6, { url: 'https://charactersheet.neorgon.com' });

    const name = s.identity.name || 'character';
    doc.save(`${name.toLowerCase().replace(/\s+/g, '-')}-card.pdf`);
    showToast('PDF downloaded!');
  };

  if (window.jspdf) {
    loadAndGenerate();
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
    script.onload = loadAndGenerate;
    script.onerror = () => showToast('Failed to load PDF library');
    document.head.appendChild(script);
  }
}

function drawTags(ctx, tags, color, x, y, maxW) {
  let cx = x, cy = y;
  ctx.font = '12px "Avenir Next", sans-serif';
  tags.forEach(tag => {
    const tw = ctx.measureText(tag).width + 18;
    if (cx + tw > x + maxW) { cx = x; cy += 30; }
    ctx.fillStyle = hexToRgba(color, 0.12);
    roundRect(ctx, cx, cy - 9, tw, 22, 11);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.3);
    ctx.lineWidth = 1;
    roundRect(ctx, cx, cy - 9, tw, 22, 11);
    ctx.stroke();
    ctx.fillStyle = COLORS.textSecondary;
    ctx.textAlign = 'center';
    ctx.fillText(tag, cx + tw / 2, cy + 4);
    ctx.textAlign = 'left';
    cx += tw + 8;
  });
  return cy + 18;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function getWildcardLabel(key) {
  const labels = {
    weirdThing: 'Weird but not weird',
    lifeHack: 'Life hack',
    hillToDieOn: 'Hill to die on',
    guiltyPleasure: 'Guilty pleasure',
    threeApps: 'Only 3 apps',
    breakfastSTier: 'S-tier breakfast',
  };
  return labels[key] || key;
}
