// Sharing and social features
import { state } from './state.js';
import { showToast } from './utils.js';

export async function shareCard(format = 'image') {
  const canvas = document.getElementById('card-canvas');
  
  if (!canvas) {
    showToast('Generate a card first!');
    return;
  }

  try {
    if (format === 'image') {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'character-card.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${state.identity.name || 'My'} Character Sheet`,
          text: 'Check out my character card from charactersheet.neorgon.com!',
          files: [file]
        });
        showToast('Shared successfully!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('Card copied to clipboard!');
      }
    } else if (format === 'link') {
      const url = 'https://charactersheet.neorgon.com';
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Share failed:', err);
    showToast('Sharing not supported in this browser');
  }
}

export async function generateQRCode() {
  const url = 'https://charactersheet.neorgon.com';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  
  try {
    const img = document.createElement('img');
    img.src = qrApiUrl;
    img.style.maxWidth = '100%';
    
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.innerHTML = `
      <div class="qr-modal-content">
        <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
        <h3>Share via QR Code</h3>
        <div class="qr-code-container"></div>
        <p>Scan to visit Character Sheet</p>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    modal.querySelector('.qr-code-container').appendChild(img);
    document.body.appendChild(modal);
    
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000';
    
  } catch (err) {
    console.error('QR generation failed:', err);
    showToast('Failed to generate QR code');
  }
}

export function copyEmbedCode() {
  const embedCode = `<iframe src="https://charactersheet.neorgon.com/embed/${state.identity.name?.toLowerCase().replace(/\s+/g, '-') || 'card'}" width="800" height="1100" frameborder="0"></iframe>`;
  
  navigator.clipboard.writeText(embedCode).then(() => {
    showToast('Embed code copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy embed code');
  });
}

export async function downloadHighResCard() {
  const canvas = document.getElementById('card-canvas');
  
  if (!canvas) {
    showToast('Generate a card first!');
    return;
  }

  // Create a higher resolution version
  const scale = state.cardConfig.highQuality ? 2 : 1;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width * scale;
  tempCanvas.height = canvas.height * scale;
  
  const ctx = tempCanvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawImage(canvas, 0, 0);
  
  const quality = state.cardConfig.highQuality ? 1.0 : 0.9;
  const dataUrl = tempCanvas.toDataURL('image/png', quality);
  
  const link = document.createElement('a');
  const name = state.identity.name || 'character';
  link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-card-hq.png`;
  link.href = dataUrl;
  link.click();
  
  showToast('High-res card downloaded!');
}
