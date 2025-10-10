export default function init(el) {
  const cards = el.querySelectorAll(':scope > div');
  cards.forEach((card) => {
    card.classList.add('card');
    const picture = card.querySelector('picture');
    if (picture) {
      const pictureWrapper = document.createElement('div');
      pictureWrapper.className = 'card-picture';
      pictureWrapper.append(picture);
      card.insertAdjacentElement('afterbegin', pictureWrapper);
    }
  });
}
