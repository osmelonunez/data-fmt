export function initAutoResize(){
  const ta = document.getElementById('text');
  const left = document.querySelector('.left');
  const footer = document.querySelector('.site-footer');
  if(!ta || !left) return;

  const MIN_H = 150;
  const VH_CAP = 0.8;
  const BELOW_PAD = 24;

  function getUploadBlock(){
    const blocks = left.querySelectorAll('.section-block');
    return blocks[blocks.length - 1] || null;
  }

  function maxAllowedHeight(){
    const vpH = window.innerHeight;
    const footerH = footer?.offsetHeight || 0;
    const taRect = ta.getBoundingClientRect();
    const upload = getUploadBlock();
    const uploadH = upload ? upload.getBoundingClientRect().height : 0;

    const visibleBelow = vpH - taRect.top - footerH - BELOW_PAD;
    const reserveForUpload = uploadH + BELOW_PAD;
    const viewportCap = Math.floor(vpH * VH_CAP);

    return Math.max(MIN_H, Math.min(visibleBelow - reserveForUpload, viewportCap));
  }

  function autoresize(){
    ta.style.height = 'auto';
    const cap = maxAllowedHeight();
    const desired = Math.max(MIN_H, Math.min(ta.scrollHeight, cap));
    ta.style.height = desired + 'px';
    ta.style.overflowY = (ta.scrollHeight > desired) ? 'auto' : 'hidden';
  }

  ['input', 'change'].forEach(evt => ta.addEventListener(evt, autoresize));
  ta.addEventListener('paste', () => setTimeout(autoresize, 0));
  window.addEventListener('resize', autoresize);
  document.addEventListener('DOMContentLoaded', autoresize);

  const clearBtn = document.getElementById('clear');
  if(clearBtn){
    clearBtn.addEventListener('click', () => {
      ta.value = '';
      ta.style.height = MIN_H + 'px';
      ta.style.overflowY = 'hidden';
    });
  }

  autoresize();
}
