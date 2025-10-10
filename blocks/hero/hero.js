function decorateBackground(hero, bg) {
  const bgPic = bg.querySelector('picture');
  if (!bgPic) {
    // No picture found, just return without error
    return;
  }
  
  const bgImgLink = bgPic.closest('a');
  if (bgImgLink) {
    const { href } = bgImgLink;
    // Only process if it's a video link
    if (href.includes('.mp4')) {
      const video = document.createElement('video');
      video.setAttribute('muted', true);
      video.setAttribute('autoplay', true);
      video.setAttribute('playsinline', true);
      video.setAttribute('loop', true);
      video.setAttribute('src', href);
      video.addEventListener('play', () => {
        bgPic.remove();
      });

      bgImgLink.parentElement.append(video, bgPic);
      bgImgLink.remove();
    }
  }
  // If it's just an image (not wrapped in a link or not a video), it will display normally
}

function decorateForeground(fg) {
  const heading = fg.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('hero-heading');
    const detail = heading.previousElementSibling;
    if (detail) {
      detail.classList.add('hero-detail');
    }
  }

  // Handle multiple CTAs
  const links = fg.querySelectorAll('a');
  if (links.length > 1) {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('button-wrapper');

    links.forEach((link, index) => {
      link.classList.add('btn');
      if (index === 0) {
        link.classList.add('btn-primary');
      } else {
        link.classList.add('btn-secondary');
      }
      buttonWrapper.appendChild(link);
    });

    // Insert button wrapper after the last paragraph or heading
    const lastElement = fg.querySelector('p:last-of-type, h1:last-of-type, h2:last-of-type, h3:last-of-type, h4:last-of-type, h5:last-of-type, h6:last-of-type');
    if (lastElement) {
      lastElement.parentNode.insertBefore(buttonWrapper, lastElement.nextSibling);
    } else {
      fg.appendChild(buttonWrapper);
    }
  } else if (links.length === 1) {
    const link = links[0];
    link.classList.add('btn', 'btn-primary');
    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('button-wrapper');
    buttonWrapper.appendChild(link);

    const lastElement = fg.querySelector('p:last-of-type, h1:last-of-type, h2:last-of-type, h3:last-of-type, h4:last-of-type, h5:last-of-type, h6:last-of-type');
    if (lastElement) {
      lastElement.parentNode.insertBefore(buttonWrapper, lastElement.nextSibling);
    } else {
      fg.appendChild(buttonWrapper);
    }
  }
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const fg = rows.pop();
  fg.classList.add('hero-foreground');
  decorateForeground(fg);
  if (rows.length) {
    const bg = rows.pop();
    bg.classList.add('hero-background');
    decorateBackground(el, bg);
  }

  // Add dark overlay class for better text readability
  el.classList.add('dark-overlay', 'large');
}
